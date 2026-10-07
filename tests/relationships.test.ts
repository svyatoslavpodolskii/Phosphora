import {it,expect} from 'vitest';
import {pickLink,linkCurve} from '../src/graph/relationships';
import {makeLink} from '../src/core/model';
it('picks curved links in screen space and leaves empty space available for pan',()=>{
 const nodes=[{id:'a',x:-100,y:0,radius:20},{id:'b',x:100,y:0,radius:20}],link=makeLink('a','b');
 const curve=linkCurve(nodes[0],nodes[1]);expect(curve.ax).toBe(-80);expect(curve.bx).toBe(80);
 expect(pickLink([link],nodes,{x:0,y:0,zoom:1},{width:400,height:400},{x:200,y:204})).toBe(link.id);
 expect(pickLink([link],nodes,{x:0,y:0,zoom:1},{width:400,height:400},{x:200,y:240})).toBe('');
});

it('selects between samples of a very long curve',()=>{
 const nodes=[{id:'a',x:-5000,y:0,radius:20},{id:'b',x:5000,y:0,radius:20}],link=makeLink('a','b');
 expect(pickLink([link],nodes,{x:0,y:0,zoom:1},{width:400,height:400},{x:300,y:207})).toBe(link.id);
});
