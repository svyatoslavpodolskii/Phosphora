import {it,expect} from 'vitest';
import {edgeCurve} from '../src/graph/edge-curve';
it('keeps overlapping atom connections finite, short and ordered through the drag',()=>{
 for(const distance of [.001,.01,1,20,59,60,200]){const a={x:100,y:-20,radius:64},b={x:100+distance,y:-20,radius:64},c=edgeCurve(a,b)!;expect(Object.values(c).every(Number.isFinite)).toBe(true);expect(c.ax).toBeLessThan(c.bx);expect(c.ax).toBeGreaterThanOrEqual(a.x);expect(c.bx).toBeLessThanOrEqual(b.x);expect(Math.abs(c.cy-a.y)).toBeLessThanOrEqual(14);}
 expect(edgeCurve({x:0,y:0,radius:30},{x:0,y:0,radius:30})).toBeNull();
});
