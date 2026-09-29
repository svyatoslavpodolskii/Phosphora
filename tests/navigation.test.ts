import {it,expect} from 'vitest';
import {flightCamera,validLocation} from '../src/graph/navigation';
import {neighborhood} from '../src/graph/neighborhood';
import {makeAtom,makeLink} from '../src/core/model';
it('camera flights preserve endpoints, remain bounded and reveal long spatial journeys',()=>{
 const from={x:120,y:-50,zoom:2},to={x:-9000,y:4500,zoom:1};expect(flightCamera(from,to,0)).toEqual(from);expect(flightCamera(from,to,1).x).toBeCloseTo(to.x);const middle=flightCamera(from,to,.5);expect(middle.zoom).toBeLessThan(1);for(let i=0;i<=100;i++){const p=flightCamera(from,to,i/100);expect(p.zoom).toBeGreaterThanOrEqual(.035);expect(p.zoom).toBeLessThanOrEqual(3);expect(Number.isFinite(p.x+p.y)).toBe(true);}expect(validLocation({camera:to,selected:'a',lens:'all'})).toBe(true);expect(validLocation({camera:{...to,zoom:NaN},selected:'a',lens:'all'})).toBe(false);
});
it('local context includes backlinks, significant indirect nodes and spatial neighbors without altering data',()=>{
 const atoms=Array.from({length:40},(_,i)=>makeAtom({id:'n'+i,title:'Note '+i,x:i*300,y:0,importance:i===3?2:0}));const links=[makeLink('n1','n0'),makeLink('n0','n2'),makeLink('n2','n3','supports'),makeLink('n3','n4'),...Array.from({length:20},(_,i)=>makeLink('n4','n'+(i+10)))];const data={atoms,links},before=JSON.stringify(data),context=neighborhood(data,'n0');expect(context.get('n0')).toBe(1);expect(context.get('n1')).toBeGreaterThan(.8);expect(context.get('n3')).toBeGreaterThan(.3);expect(context.get('n39')).toBeUndefined();expect(JSON.stringify(data)).toBe(before);expect(neighborhood(data,'missing').size).toBe(0);
});
