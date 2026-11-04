import {describe,it,expect} from 'vitest';
import {makeAtom,makeLink,type Atom,type Snapshot} from '../src/core/model';
import {FOLDER_DEFINITIONS,FOLDER_MEMBERSHIP,MAX_FOLDERS,TERRITORY_DIRECTIONS,folderDefinitions,normalizeFolderWeights,projectFolders,folderTerritories,folderCameraTransform} from '../src/graph/folders';

const note=(id:string,x=0,y=0)=>makeAtom({id,title:id,x,y});
function folder(owner:Atom,id:string,roots=[owner.id]){owner.properties[FOLDER_DEFINITIONS]=[...folderDefinitions(owner),{id,name:id,color:'#9bbef2',roots}];}
describe('folder membership',()=>{
 it('does not absorb another explicit folder root when branches are connected',()=>{
  const [a,b,c]=['a','b','c'].map(id=>note(id));folder(a,'work');folder(b,'music');const p=projectFolders({atoms:[a,b,c],links:[makeLink('a','b','grouped'),makeLink('b','c','grouped')]});expect(p.memberships.get('b')).toEqual({music:1});expect(p.memberships.get('c')).toEqual({music:1});
 });
 it('propagates directed strong branches, never ordinary or reversed cross-links',()=>{
  const [a,b,c,d,e]=['a','b','c','d','e'].map(id=>note(id));folder(a,'work');
  const data={atoms:[a,b,c,d,e],links:[makeLink('a','b','related','context'),makeLink('b','c','grouped'),makeLink('b','d'),makeLink('e','a','grouped')]};
  const before=structuredClone(data),p=projectFolders(data);
  for(const id of ['a','b','c'])expect(p.memberships.get(id)).toEqual({work:1});
  expect(p.memberships.has('d')).toBe(false);expect(p.memberships.has('e')).toBe(false);expect(data).toEqual(before);
 });
 it('keeps the earlier parent when two folder branches meet',()=>{
  const [a,b,c]=['a','b','c'].map(id=>note(id));folder(a,'work',['a','a']);folder(b,'music');
  const p=projectFolders({atoms:[a,b,c],links:[makeLink('a','c','grouped'),makeLink('b','c','grouped')]});
  expect(p.memberships.get('c')).toEqual({work:1});expect(p.folders.map(f=>[f.count,f.weight])).toEqual([[2,2],[1,1]]);
  expect(normalizeFolderWeights({work:Infinity,music:-2,other:NaN,ok:.3})).toEqual({ok:.3});
 });
 it('supports cycles and 5000 descendants iteratively',()=>{
  const atoms=Array.from({length:5000},(_,i)=>note('n'+i));folder(atoms[0],'deep');
  const links=atoms.slice(1).map((a,i)=>makeLink(atoms[i].id,a.id,'grouped'));links.push(makeLink('n4999','n0','grouped'));
  const p=projectFolders({atoms,links});expect(p.memberships.get('n4999')).toEqual({deep:1});expect(p.folders[0].count).toBe(5000);
 });
 it('ignores malformed and orphan data and bounds imported folder counts',()=>{
  const a=note('a');a.properties[FOLDER_DEFINITIONS]=[{id:'bad',name:'Bad',color:'url(x)',roots:['a']}];
  a.properties[FOLDER_MEMBERSHIP]={missing:1};expect(projectFolders({atoms:[a],links:[]}).folders).toEqual([]);
  a.properties[FOLDER_DEFINITIONS]=Array.from({length:100},(_,i)=>({id:'f'+i,name:'F'+i,color:'#112233',roots:['a']}));
  const p=projectFolders({atoms:[a],links:[]});expect(p.folders).toHaveLength(MAX_FOLDERS);expect(Object.values(p.memberships.get('a')!).reduce((a,b)=>a+b,0)).toBeCloseTo(1);
 });
 it('retains explicit durable inherited weights; unknown folder IDs have no effect',()=>{
  const a=note('a'),b=note('b'),c=note('c');folder(a,'work');b.properties[FOLDER_MEMBERSHIP]={work:.6,missing:1};
  const p=projectFolders({atoms:[a,b,c],links:[makeLink('b','c','grouped')]});expect(p.memberships.get('c')).toEqual({work:.6});
 });
});
describe('folder presentation geometry',()=>{
 it('focuses original coordinates and keeps every note in the same world',()=>{
  const a=note('a',-120,40),b=note('b',180,140),loose=note('loose',500,800);folder(a,'work',['a','b']);
  const p=projectFolders({atoms:[a,b,loose],links:[]});expect(p.folders[0].focus).toEqual({folderId:'work',center:{x:30,y:90},bounds:{minX:-152,minY:8,maxX:212,maxY:172}});
  expect(p.all?.bounds.maxY).toBe(832);expect(projectFolders({atoms:[],links:[]}).all).toBeNull();
 });
 it.each([1,2,3000])('builds a bounded rounded path for %i moving members',count=>{
  const atoms=Array.from({length:count},(_,i)=>note('n'+i,i*20,Math.sin(i)*100));folder(atoms[0],'work',atoms.map(a=>a.id));
  const p=projectFolders({atoms,links:[]}),live=atoms.map(a=>({...a,x:a.x+200}));const territories=folderTerritories(p,live);
  expect(territories).toHaveLength(1);expect(territories[0].path.match(/ Q /g)).toHaveLength(TERRITORY_DIRECTIONS);expect(territories[0].path).not.toMatch(/NaN|Infinity/);expect(territories[0].bounds.minX).toBeGreaterThan(0);
  expect(folderTerritories(p,[])).toEqual([]);
 });
 it('matches the graph camera convention exactly',()=>{
  expect(folderCameraTransform({x:40,y:-30,zoom:.5},800,600)).toBe('translate(440 270) scale(0.5)');
 });
 it('ignores nonfinite render positions',()=>{
  const a=note('a');folder(a,'work');const p=projectFolders({atoms:[a],links:[]});expect(folderTerritories(p,[{id:'a',x:NaN,y:3}])).toEqual([]);
 });
});
