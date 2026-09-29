import {it,expect} from 'vitest';
import {placeAtom,segmentsCross} from '../src/graph/placement';
import {makeAtom,makeLink} from '../src/core/model';
import {branchingLayout,structure} from '../src/graph/structure';
import {graphFootprints} from '../src/graph/geometry';

// Fixed identity and creation time. The structural walk breaks ties on both, so a
// generated one would make the geometry these tests measure non deterministic.
const at='2026-01-01T00:00:00Z';
const A=(input:Partial<Parameters<typeof makeAtom>[0]>)=>makeAtom({created_at:at,...input});

it('successive children fan out into distinct free sectors',()=>{
  const root=A({id:'root',title:'Root'}),data={atoms:[root],links:[] as any[]};
  for(let i=0;i<6;i++){
   const id='c'+i;
   const point=placeAtom({data,parent:'root'});
   data.atoms.push(A({id,title:'Child '+i,x:point.x,y:point.y}));
   data.links.push(makeLink('root',id));
  }
  const angles=data.atoms.slice(1).map(a=>Math.atan2(a.y-root.y,a.x-root.x));
  let closest=Math.PI;
  for(let i=0;i<angles.length;i++)for(let j=i+1;j<angles.length;j++)closest=Math.min(closest,Math.abs(Math.atan2(Math.sin(angles[i]-angles[j]),Math.cos(angles[i]-angles[j]))));
  // Six children must be told apart, not stacked on the same bearing.
  expect(closest).toBeGreaterThan(.35);
});
it('a child lands clear of the labels already painted around its parent',()=>{
  const parent=A({id:'p',title:'A parent with a long name',x:0,y:0});
  const atoms=[parent];
  for(let i=0;i<5;i++)atoms.push(A({id:'n'+i,title:'Neighbour number '+i,x:Math.cos(i*1.3)*300,y:Math.sin(i*1.3)*300}));
  const links=atoms.slice(1).map(a=>makeLink('p',a.id));
  const data={atoms,links},child=placeAtom({data,parent:'p'});
  const feet=graphFootprints(data);
  const mine=graphFootprints({atoms:[...atoms,A({id:'c',title:'The new child',x:child.x,y:child.y})],links}).get('c')!;
  for(const other of atoms.slice(1)){
   const f=feet.get(other.id)!;
   const ox=f.halfWidth+mine.halfWidth-Math.abs(other.x-child.x);
   const oy=Math.min(other.y+f.bottom,child.y+mine.bottom)-Math.max(other.y-f.top,child.y-mine.top);
   expect(ox>0&&oy>0).toBe(false);
  }
});
it('a branch keeps growing outward instead of doubling back on itself',()=>{
  const root=A({id:'root',title:'Root',x:0,y:0});
  const child=A({id:'child',title:'Child',x:200,y:0});
  const data={atoms:[root,child],links:[makeLink('root','child')]};
  const grandchild=placeAtom({data,parent:'child'});
  // The way back to the root is the least attractive direction.
  expect(Math.abs(Math.atan2(grandchild.y-child.y,grandchild.x-child.x))).toBeGreaterThan(.4);
});
it('a loose atom lands beside the existing islands, not at the far edge',()=>{
  const atoms=Array.from({length:14},(_,i)=>A({id:'a'+i,title:'Note '+i,x:2000+i%4*220,y:2000+Math.floor(i/4)*220}));
  const point=placeAtom({data:{atoms,links:[]},parent:undefined});
  const distance=Math.min(...atoms.map(a=>Math.hypot(a.x-point.x,a.y-point.y)));
  expect(distance).toBeLessThan(1400);
  expect(distance).toBeGreaterThan(120);
  expect(Number.isFinite(point.x)).toBe(true);
});
it('placement reads the world but never rewrites it',()=>{
  const atoms=[A({id:'a',title:'A',x:100,y:100}),A({id:'b',title:'B',x:-260,y:80})];
  const data={atoms,links:[makeLink('a','b')]},before=JSON.stringify(data);
  placeAtom({data,parent:'a'});placeAtom({data});
  expect(JSON.stringify(data)).toBe(before);
});
it('a large subtree is given a proportionally larger sector under its parent',()=>{
  // Three children, so the weight shows up as the gap between neighbouring
  // branches: two large ones must be set further apart than a large and a small.
  const atoms=[A({id:'a-root',title:'Root'}),A({id:'b-big1',title:'Big one'}),A({id:'c-small',title:'Small'}),A({id:'d-big2',title:'Big two'})],links:any[]=[];
  for(const [hub,prefix] of [['b-big1','e-one'],['d-big2','f-two']] as const){
   for(let i=0;i<12;i++){const id=prefix+String(i).padStart(2,'0');atoms.push(A({id,title:'Leaf '+i}));links.push(makeLink(i?prefix+String(i-1).padStart(2,'0'):hub,id));}
  }
  links.push(makeLink('a-root','b-big1'),makeLink('a-root','c-small'),makeLink('a-root','d-big2'));
  const data={atoms,links},tree=structure(data),layout=branchingLayout(data),root=layout.points.get('a-root')!;
  expect(tree.roots).toEqual(['a-root']);
  expect(tree.size.get('b-big1')).toBe(13);
  expect(tree.size.get('c-small')).toBe(1);
  const angle=(id:string)=>Math.atan2(layout.points.get(id)!.y-root.y,layout.points.get(id)!.x-root.x);
  const gap=(a:string,b:string)=>Math.abs(Math.atan2(Math.sin(angle(a)-angle(b)),Math.cos(angle(a)-angle(b))));
  // Neighbouring large branches are set further apart than a large and a small one.
  expect(gap('b-big1','d-big2')).toBeGreaterThan(gap('b-big1','c-small')*1.3);
  // And nothing is left on top of anything else.
  const feet=graphFootprints(data);let overlaps=0;
  for(let i=0;i<atoms.length;i++)for(let j=i+1;j<atoms.length;j++){
   const a=layout.points.get(atoms[i].id)!,b=layout.points.get(atoms[j].id)!,fa=feet.get(atoms[i].id)!,fb=feet.get(atoms[j].id)!;
   if(Math.abs(a.x-b.x)<fa.halfWidth+fb.halfWidth&&Math.max(a.y-fa.top,b.y-fb.top)<Math.min(a.y+fa.bottom,b.y+fb.bottom))overlaps++;
  }
  expect(overlaps).toBe(0);
});
it('a cross-link adds tension without ever dragging a whole branch',()=>{
  const atoms=Array.from({length:40},(_,i)=>A({id:'n'+i,title:'Node '+i})),links:any[]=[];
  for(let i=1;i<20;i++)links.push(makeLink('n0','n'+i,'related','context'));
  for(let i=1;i<5;i++)links.push(makeLink('n'+i,'n'+(20+i),'related','context'));
  // A cycle between two branches: real, but not part of the hierarchy.
  links.push(makeLink('n21','n2','related','manual'));
  const tree=structure({atoms,links});
  const cross=links.filter(l=>!tree.edges.has(l.id));
  expect(cross.length).toBe(1);
  const without=branchingLayout({atoms,links:links.filter(l=>tree.edges.has(l.id))});
  const withCross=branchingLayout({atoms,links});
  const extent=Math.max(...[...without.points.values()].map(p=>Math.hypot(p.x,p.y)))*2||1;
  let worst=0;
  for(const a of atoms){
   const before=without.points.get(a.id)!,after=withCross.points.get(a.id)!;
   worst=Math.max(worst,Math.hypot(after.x-before.x,after.y-before.y));
  }
  // The structural skeleton owns the spatial hierarchy. A cross-link may change a
  // little local tension, but it must not pull a whole branch across the map.
  expect(worst).toBeLessThan(extent*.05);
  // The hierarchy itself is untouched: the same branch, the same membership.
  expect([...withCross.tree.descendants('n0')].sort()).toEqual([...without.tree.descendants('n0')].sort());
  expect(segmentsCross(withCross.points.get('n0')!,withCross.points.get('n1')!,withCross.points.get('n25')!,withCross.points.get('n26')!)).toBe(false);
});
