import {it,expect} from 'vitest';
import {placeAtom,segmentsCross} from '../src/graph/placement';
import {makeAtom,makeLink} from '../src/core/model';
// Fixed ids and creation times: the structural walk breaks ties on both, so a
// generated identity would make the geometry this test measures non deterministic.
const at='2026-01-01T00:00:00Z';
it('grows a child into a free direction without crossing an existing link',()=>{
  const ancestor=makeAtom({id:'ancestor',title:'Ancestor',x:-240,y:0,importance:2,created_at:at}),parent=makeAtom({id:'parent',title:'Parent',x:0,y:0,created_at:at}),top=makeAtom({id:'top',title:'Top',x:110,y:-110,created_at:at}),bottom=makeAtom({id:'bottom',title:'Bottom',x:110,y:110,created_at:at});
  const data={atoms:[ancestor,parent,top,bottom],links:[makeLink('ancestor','parent'),makeLink('top','bottom')]},before=structuredClone(data);
  const child=placeAtom({data,parent:'parent'});
  expect(segmentsCross(parent,child,top,bottom)).toBe(false);expect(data).toEqual(before);
  expect(Math.hypot(child.x-parent.x,child.y-parent.y)).toBeLessThan(400);
});
it('successive children occupy distinct sectors around the same parent',()=>{
  const root=makeAtom({id:'root',title:'Root',created_at:at}),first=makeAtom({id:'first',title:'First',x:190,y:0,created_at:at});
  const point=placeAtom({data:{atoms:[root,first],links:[makeLink(root.id,first.id)]},parent:root.id});
  expect(Math.abs(Math.atan2(point.y,point.x))).toBeGreaterThan(.4);
});
