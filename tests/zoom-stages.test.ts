import {it,expect} from 'vitest';
import {dragWeights} from '../src/graph/drag-response';
import {makeAtom,makeLink} from '../src/core/model';
import {graphModel} from '../src/graph/model';
import {CameraRig} from '../src/graph/camera';

it('drag transmission decays along connections and never includes another island',()=>{
  const atoms=['a','b','c','d','e','other'].map(id=>makeAtom({id,title:id}));
  const weights=dragWeights({atoms,links:[makeLink('a','b'),makeLink('b','c'),makeLink('c','d'),makeLink('d','e')]},['a']);
  expect(weights.get('b')).toBeGreaterThan(weights.get('c')!);expect(weights.get('c')).toBeGreaterThan(weights.get('d')!);
  expect(weights.has('a')).toBe(false);expect(weights.has('e')).toBe(false);expect(weights.has('other')).toBe(false);
});
it('zooming never chooses what is selected, and never touches the world',()=>{
  const atoms=[makeAtom({id:'a',title:'A',x:-900,y:0}),makeAtom({id:'b',title:'B',x:400,y:0}),makeAtom({id:'c',title:'C',x:1500,y:0})];
  const links=[makeLink('a','b'),makeLink('b','c')],data={atoms,links};
  const before=JSON.stringify(data);
  // Whatever the camera does over a wide range of zooms, selection is untouched.
  const projected=new Set<string>();
  for(const zoom of [.05,.2,.4,.41,.42,.45,.5,.55,.56,.7,1,2.5])projected.add(JSON.stringify(graphModel(data,'all',zoom,'').nodes.map(n=>n.id)));
  expect(projected.size).toBeGreaterThan(1);
  // Every projection is derived from the same stored coordinates.
  expect(JSON.stringify(data)).toBe(before);
  const rig=new CameraRig();rig.resize({width:1200,height:800});rig.set({x:0,y:0,zoom:1});
  for(let i=0;i<200;i++)rig.zoomAt({x:300+i,y:400-i},1.05);
  for(let i=0;i<400&&rig.moving;i++)rig.step(16);
  expect(JSON.stringify(data)).toBe(before);
});
