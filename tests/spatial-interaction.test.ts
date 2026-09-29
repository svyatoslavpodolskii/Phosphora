import {it,expect} from 'vitest';
import {CameraRig,fromAnchor,screenToWorld} from '../src/graph/camera';
import {visualAttention} from '../src/graph/attention';
import {SemanticScene} from '../src/graph/semantic';
import {graphModel} from '../src/graph/model';
import {makeAtom,makeLink} from '../src/core/model';
it('a two finger gesture is smoothed but still lands exactly on the focal point',()=>{
  const rig=new CameraRig(),view={width:390,height:844};rig.resize(view);rig.set({x:35,y:-60,zoom:.4});
  const world=screenToWorld({x:140,y:330},rig.value,view);
  rig.pinchTo({x:140,y:330},.4);
  let step=0,last=rig.value.zoom;
  for(let i=0;i<30;i++){
   const screen={x:140+i*2,y:330+i};
   rig.pinchTo(screen,.4+i*.02);
   const c=rig.step(16);
   // Never a visible jump, whatever the finger does.
   step=Math.max(step,Math.abs(Math.log(c.zoom/last)));
   last=c.zoom;
   // The grabbed point always stays under the fingers, never drifting away.
   expect(Math.hypot(view.width/2+c.x+world.x*c.zoom-screen.x,view.height/2+c.y+world.y*c.zoom-screen.y)).toBeLessThan(60);
  }
  for(let i=0;i<400&&rig.moving;i++)rig.step(16);
  const end=rig.step(16);
  expect(end.zoom).toBeCloseTo(.98,6);
  // Once the fingers stop, the point they were holding is exactly under them.
  expect(view.width/2+end.x+world.x*end.zoom).toBeCloseTo(198,6);
  expect(view.height/2+end.y+world.y*end.zoom).toBeCloseTo(359,6);
  expect(step).toBeLessThan(.2);
});
it('a gesture is not distorted by how many events the device delivers',()=>{
  const world={x:12,y:-40},run=(events:number)=>{const rig=new CameraRig(),view={width:390,height:844};rig.resize(view);rig.set({x:20,y:0,zoom:.5});rig.pinchTo({x:200,y:400},.5);
   for(let i=1;i<=20;i++){const screen={x:200+i*6,y:400-i*2};for(let e=0;e<events;e++)rig.pinchTo(screen,.5+i*.03);rig.step(16);}
   for(let i=0;i<600&&rig.moving;i++)rig.step(16);
   const c=rig.step(16);return{zoom:c.zoom,screen:{x:view.width/2+c.x+world.x*c.zoom,y:view.height/2+c.y+world.y*c.zoom}};};
  // One event per step and eight events per step describe the same finger motion.
  const single=run(1),many=run(8);
  expect(many.zoom).toBeCloseTo(single.zoom,3);
  expect(many.screen.x).toBeCloseTo(single.screen.x,0);
  expect(many.screen.y).toBeCloseTo(single.screen.y,0);
});
it('attention follows the viewport while selection and distant landmarks survive',()=>{
 const data={atoms:[makeAtom({id:'a',title:'A',x:0,y:0}),makeAtom({id:'b',title:'B',x:800,y:0,importance:2})],links:[]};const nodes=graphModel(data,'all',1,'a').nodes;const view={width:390,height:844};
 expect(visualAttention(nodes,{x:0,y:0,zoom:1},view,'a','a').focus).toBe('a');const moved=visualAttention(nodes,{x:-800,y:0,zoom:1},view,'a','a');expect(moved.focus).toBe('b');expect(moved.scores.get('a')).toBeGreaterThanOrEqual(.38);expect(nodes.find(n=>n.id==='b')?.landmark).toBe(true);
});
it('continuous semantic reveal is reversible and never changes the world',()=>{
 const data={atoms:[makeAtom({id:'a',title:'A',x:0,y:0}),makeAtom({id:'b',title:'B',x:200,y:0})],links:[makeLink('a','b')]};const model={...graphModel(data,'all',.3,''),expanded:graphModel(data,'all',1,'')};const before=JSON.stringify(data),scene=new SemanticScene();
 for(const collapse of [0,.25,.5,.75,1,.75,.5,.25,0]){const result=scene.advance(model,16,false,'',collapse);expect(result.nodes.length).toBeGreaterThan(0);const child=result.nodes.find(n=>n.id==='b');if(collapse<1)expect(child?.opacity).toBeCloseTo(1-collapse);expect(JSON.stringify(data)).toBe(before);}
});
