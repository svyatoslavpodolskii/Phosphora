import {it,expect} from 'vitest';
import {makeAtom,makeLink} from '../src/core/model';
import {branchingLayout} from '../src/graph/structure';
it('scatters disconnected notes through the composition rather than a side row',()=>{
 const atoms=Array.from({length:360},(_,i)=>makeAtom({id:'n'+i,title:'Thought '+i,created_at:'2026-09-12T00:00:00Z'}));const links=[];for(let i=1;i<260;i++){const parent=Math.floor((i-1)/5);const l=makeLink('n'+parent,'n'+i,'related','context');l.id='e'+i;links.push(l);}const layout=branchingLayout({atoms,links});const linked=atoms.slice(0,260).map(a=>layout.points.get(a.id)!),free=atoms.slice(260).map(a=>layout.points.get(a.id)!);const inside=free.filter(p=>p.x>Math.min(...linked.map(p=>p.x))&&p.x<Math.max(...linked.map(p=>p.x))&&p.y>Math.min(...linked.map(p=>p.y))&&p.y<Math.max(...linked.map(p=>p.y)));expect(inside.length).toBeGreaterThan(30);expect(new Set(free.map(p=>Math.round(p.y/30))).size).toBeGreaterThan(20);expect(new Set(free.map(p=>Math.round(p.x/30))).size).toBeGreaterThan(20);
});
