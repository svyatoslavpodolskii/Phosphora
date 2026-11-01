import {describe,it,expect} from 'vitest';
import {dwellLink,linkReady,dragLinkTarget,linkedPair,LINK_DWELL_MS} from '../src/graph/drag-link';
import {makeLink} from '../src/core/model';
import type {GraphNode} from '../src/graph/model';

describe('deliberate direct link proposal',()=>{
 it('requires stationary dwell; crossing and changing targets cannot confirm',()=>{
  const entered=dwellLink(null,'b',{x:100,y:100},0);
  expect(linkReady(entered,LINK_DWELL_MS-1)).toBe(false);
  expect(linkReady(entered,LINK_DWELL_MS)).toBe(true);
  expect(dwellLink(entered,'b',{x:106,y:104},300)).toBe(entered);
  const moving=dwellLink(entered,'b',{x:111,y:100},300);
  expect(linkReady(moving,500)).toBe(false);
  expect(dwellLink(entered,'c',{x:100,y:100},400)?.since).toBe(400);
  expect(dwellLink(entered,'',{x:100,y:100},400)).toBeNull();
  expect(linkReady(dwellLink(null,'b',{x:100,y:100},450),500)).toBe(false);
 });
 it('picks bodies in screen space, excluding source, clusters and fading atoms',()=>{
  const node=(id:string,x:number,extra:Partial<GraphNode&{opacity:number}>={})=>({id,x,y:0,radius:20,...extra} as GraphNode);
  const nodes=[node('source',0),node('b',100),node('group',105,{members:['c']}),node('fading',110,{opacity:.2})];
  const camera={x:30,y:10,zoom:2},view={width:400,height:300};
  expect(dragLinkTarget(nodes,'source',{x:450,y:160},camera,view)).toBe('b');
  expect(dragLinkTarget(nodes,'source',{x:230,y:160},camera,view)).toBe('');
  expect(dragLinkTarget(nodes,'source',{x:600,y:160},camera,view)).toBe('');
 });
 it('recognizes an existing pair in either direction',()=>{
  const links=[makeLink('b','a','depends')];
  expect(linkedPair(links,'a','b')).toBe(true);
  expect(linkedPair(links,'b','a')).toBe(true);
  expect(linkedPair(links,'a','c')).toBe(false);
 });
});
