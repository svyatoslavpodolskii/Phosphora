import {it,expect} from 'vitest';
import {CurveStrip} from '../src/graph/curve-strip';
import {edgeCurve} from '../src/graph/edge-curve';
it('retains topology and curve sampling while zoom changes the screen width',()=>{
 const strip=new CurveStrip(),curve={ax:0,ay:0,cx:50,cy:12,bx:100,by:0},vertices=strip.vertices,indices=strip.indices;
 expect(strip.update(curve,2)).toEqual({updated:true,rebuilt:true});
 for(const zoom of [.1,.3,.7,1,1.6,3]){expect(strip.update(curve,2/zoom).rebuilt).toBe(false);expect(strip.vertices).toBe(vertices);expect(strip.indices).toBe(indices);for(let i=0;i<vertices.length;i+=4)expect(Math.hypot(vertices[i]-vertices[i+2],vertices[i+1]-vertices[i+3])*zoom).toBeCloseTo(2,4);}
 expect(strip.update(curve,2/3)).toEqual({updated:false,rebuilt:false});expect(strip.update({...curve,bx:120},2/3).rebuilt).toBe(true);
});
it('stays finite and centered for short, vertical and reversed relationships',()=>{
 for(const [x,y] of [[.001,0],[0,.001],[0,200],[-200,40],[200,0]]){const a={x:0,y:0,radius:30},b={x,y,radius:30},curve=edgeCurve(a,b)!;const strip=new CurveStrip();strip.update(curve,12);expect([...strip.vertices].every(Number.isFinite)).toBe(true);expect((strip.vertices[0]+strip.vertices[2])/2).toBeCloseTo(curve.ax,4);expect((strip.vertices[1]+strip.vertices[3])/2).toBeCloseTo(curve.ay,4);expect(Math.max(...strip.indices)).toBeLessThan(strip.vertices.length/2);}
});
