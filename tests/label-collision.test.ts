import {it,expect} from 'vitest';
import {LabelCollisions,type LabelRect} from '../src/graph/label-collision';
const overlaps=(a:LabelRect,b:LabelRect)=>a.x<b.x+b.width+8&&a.x+a.width+8>b.x&&a.y<b.y+b.height+4&&a.y+a.height+4>b.y;
it('preserves exact greedy label decisions across negative coordinates, boundaries and long labels',()=>{
 let seed=37;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const grid=new LabelCollisions(),accepted:LabelRect[]=[];
 for(let i=0;i<2000;i++){const rect={x:Math.floor(random()*4000)-2000,y:Math.floor(random()*3000)-1500,width:random()*600,height:12+random()*80};const hit=accepted.some(other=>overlaps(rect,other));expect(grid.overlaps(rect)).toBe(hit);if(!hit){grid.add(rect);accepted.push(rect);}}
 const exact=new LabelCollisions();exact.add({x:0,y:0,width:120,height:20});expect(exact.overlaps({x:128,y:0,width:20,height:20})).toBe(false);expect(exact.overlaps({x:127.99,y:0,width:20,height:20})).toBe(true);expect(exact.overlaps({x:0,y:24,width:20,height:20})).toBe(false);
});
it('avoids quadratic pair checks for a large readable field',()=>{
 const grid=new LabelCollisions(),accepted:LabelRect[]=[];let naiveChecks=0;
 for(let i=0;i<1000;i++){const rect={x:i%40*250-5000,y:Math.floor(i/40)*80-1000,width:190,height:40};expect(accepted.some(other=>{naiveChecks++;return overlaps(rect,other);})).toBe(false);expect(grid.overlaps(rect)).toBe(false);accepted.push(rect);grid.add(rect);}
 console.log(JSON.stringify({labels:accepted.length,naiveChecks,gridChecks:grid.checks}));expect(grid.checks).toBeLessThan(naiveChecks/10);
});
