import {it,expect} from 'vitest';
import {activeNeighborhood} from '../src/graph/activity';
import {makeAtom,makeLink} from '../src/core/model';
import type {Body} from '../src/graph/physics';
it('wakes the dragged neighborhood beyond the first 450 records and respects the work limit',()=>{
 const atoms=Array.from({length:1000},(_,i)=>makeAtom({id:'a'+i,title:'A'+i,x:i*400}));const bodies=new Map(atoms.map(a=>[a.id,{id:a.id,x:a.x,y:0,radius:30,mass:1,vx:0,vy:0,pinned:false,resistance:0} satisfies Body]));const links=[makeLink('a950','a951'),makeLink('a951','a952'),makeLink('a952','a953')];const active=activeNeighborhood({atoms,links},bodies,['a950']);expect([...active]).toEqual(['a950','a951','a952','a953']);expect(active.has('a0')).toBe(false);
 const crowded=atoms.slice(1).map(a=>makeLink('a0',a.id));expect(activeNeighborhood({atoms,links:crowded},bodies,['a0'],45).size).toBe(45);
});
