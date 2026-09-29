import {it,expect} from 'vitest';
import {contentPreviews} from '../src/graph/previews';
import type {GraphNode} from '../src/graph/model';
import {labelGeometry,visualFootprint} from '../src/graph/footprint';
const node=(id:string,x=0,y=0):GraphNode=>({id,x,y,radius:25,label:'👩🏽‍💻 Мысль',content:'**Content**',color:'#ffffff',icon:'',shape:'circle',style:'solid',state:'normal'});
it('progressive content stays in screen space and never mutates world coordinates',()=>{
 const nodes=[node('a')],before=structuredClone(nodes);
 expect(contentPreviews(nodes,{x:0,y:0,zoom:1},1200,800,'a')).toEqual([]);
 const short=contentPreviews(nodes,{x:0,y:0,zoom:1.5},1200,800,'a')[0];
 const rich=contentPreviews(nodes,{x:0,y:0,zoom:2.5},1200,800,'a')[0];
 expect(rich.height).toBeGreaterThan(short.height);expect(rich.opacity).toBeGreaterThan(short.opacity);
 expect(nodes).toEqual(before);expect(rich.width).toBeLessThanOrEqual(260);
});
it('places a mobile preview below the complete title and state caption',()=>{
 for(const state of ['now','paused','archived'] as const){
  const atom={...node('a'),state},camera={x:0,y:0,zoom:3};
  const [preview]=contentPreviews([atom],camera,390,844,'a',new Map([['a',90]]));
  expect(preview).toBeDefined();
  const label=labelGeometry(atom.label,atom.radius,3,390,state),bounds=visualFootprint(atom.label,atom.radius,3,390,state);
  const captionBottom=422+(label.captionTop+label.captionSize)*3;
  expect(preview.y).toBeGreaterThan(captionBottom);
  expect(preview.y).toBeGreaterThan(422+bounds.bottom*3);
 }
});
it('keeps rich previews clear of neighbors and caps visible detail',()=>{
 const nodes=[node('a'),node('b',150),node('c',-150),node('d',0,200),node('e',0,-200)];
 const result=contentPreviews(nodes,{x:0,y:0,zoom:2},1600,1200,'b');
 expect(result.length).toBeGreaterThan(0);expect(result.length).toBeLessThanOrEqual(3);
 expect(result[0].id).toBe('b');
 for(const p of result)for(const n of nodes){const x=800+n.x*2,y=600+n.y*2;expect(x>p.x&&x<p.x+p.width&&y>p.y&&y<p.y+p.height).toBe(false);}
});
it('uses vertical free space on a narrow mobile viewport',()=>{
 const result=contentPreviews([node('a')],{x:0,y:0,zoom:3},390,844,'a');
 expect(result).toHaveLength(1);expect(result[0].x).toBeGreaterThanOrEqual(16);
 expect(result[0].x+result[0].width).toBeLessThanOrEqual(374);
});
it('keeps a valid placement when panning reveals another slot, but relocates at an edge',()=>{
 const atoms=[node('a')],heights=new Map([['a',80]]),camera={x:0,y:0,zoom:2};
 const initial=contentPreviews(atoms,camera,700,700,'a',heights);
 expect(initial[0].placement).toBe('below');
 const panned={...camera,x:-60};
 expect(contentPreviews(atoms,panned,700,700,'a',heights)[0].placement).toBe('right');
 const stable=contentPreviews(atoms,panned,700,700,'a',heights,initial);
 expect(stable[0].placement).toBe('below');
 expect(stable[0].x-initial[0].x).toBe(-60);
 const edge=contentPreviews(atoms,{...panned,y:190},700,700,'a',heights,stable);
 expect(edge[0].placement).not.toBe('below');
 expect(edge[0].y+edge[0].height).toBeLessThanOrEqual(635);
});
