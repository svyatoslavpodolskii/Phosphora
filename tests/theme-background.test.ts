import {describe,it,expect} from 'vitest';
import {BACKGROUND_TILE,BACKGROUND_DEPTHS,backgroundLayers,backgroundTransform} from '../src/ui/theme-background';
import {MIN_ZOOM,MAX_ZOOM} from '../src/graph/model';

const view={width:1280,height:800};
const wrap=(value:number,period:number)=>((value%period)+period)%period;
describe('camera background layers',()=>{
 it('keeps a deterministic bounded field distributed once across three depths',()=>{
  for(const pattern of ['none','daisies','stars','fireflies','night-sky'] as const){
   const layers=backgroundLayers(pattern,1),points=layers.flatMap(l=>l.points);
   expect(layers).toHaveLength(3);
   expect(layers).toEqual(backgroundLayers(pattern,1));
   expect(points.length).toBeLessThanOrEqual(pattern==='night-sky'?240:64);
   expect(new Set(points).size).toBe(points.length);
   expect(points.every(p=>p.x>=0&&p.x<BACKGROUND_TILE.width&&p.y>=0&&p.y<BACKGROUND_TILE.height)).toBe(true);
   if(pattern==='none')expect(points).toEqual([]);
   else expect(layers.every(l=>l.points.length>0)).toBe(true);
  }
 });
 it('defaults to static and ignores every camera component in static mode',()=>{
  const baseline=backgroundTransform(undefined,{x:0,y:0,zoom:1},view,.4);
  for(const depth of BACKGROUND_DEPTHS){
   expect(backgroundTransform('static',{x:1730,y:-967,zoom:MIN_ZOOM},view,depth)).toEqual(baseline);
   expect(backgroundTransform(undefined,{x:-600,y:400,zoom:MAX_ZOOM},view,depth)).toEqual(baseline);
  }
 });
 it('projects world tiles with exactly the same center, pan and zoom as the map',()=>{
  for(const zoom of [MIN_ZOOM,.5,1,MAX_ZOOM]){
   const camera={x:197,y:-91,zoom};
   const t=backgroundTransform('world',camera,view,.18);
   expect(t.scale).toBeCloseTo(zoom);
   expect(t.x).toBeCloseTo(view.width/2+camera.x-BACKGROUND_TILE.width*zoom/2);
   expect(t.y).toBeCloseTo(view.height/2+camera.y-BACKGROUND_TILE.height*zoom/2);
   expect(backgroundTransform('world',camera,view,.7)).toEqual(t);
  }
 });
 it('blends the complete affine camera at each parallax depth, keeping zoom anchors coherent',()=>{
  // Zoom about an off-center screen anchor: x/y compensate for the zoom.
  const anchor={x:220,y:130},zoom=2;
  const camera={x:(anchor.x-view.width/2)*(1-zoom),y:(anchor.y-view.height/2)*(1-zoom),zoom};
  for(const depth of BACKGROUND_DEPTHS){
   const t=backgroundTransform('parallax',camera,view,depth);
   expect(t.scale).toBeCloseTo(1+(zoom-1)*depth);
   // This tile point was under the anchor before zoom. It remains there modulo tiling.
   expect(wrap(anchor.x-t.x-anchor.x*t.scale,BACKGROUND_TILE.width*t.scale)).toBeCloseTo(0);
   expect(wrap(anchor.y-t.y-anchor.y*t.scale,BACKGROUND_TILE.height*t.scale)).toBeCloseTo(0);
  }
 });
 it('wraps huge positive and negative pan without changing the repeated field',()=>{
  for(const mode of ['world','parallax'] as const)for(const depth of BACKGROUND_DEPTHS)for(const sign of [-1,1]){
   const camera={x:sign*1e9,y:sign*-1e9,zoom:MIN_ZOOM};
   const t=backgroundTransform(mode,camera,view,depth);
   expect(t.scale).toBeGreaterThan(0);
   expect(Number.isFinite(t.x)).toBe(true);expect(Math.abs(t.x)).toBeLessThan(2e9);
   expect(Number.isFinite(t.y)).toBe(true);expect(Math.abs(t.y)).toBeLessThan(2e9);
  }
 });
});
