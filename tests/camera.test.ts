import {it,expect} from 'vitest';
import {CameraRig,wheelZoomFactor,gestureZoomFactor,screenToWorld,clampZoom,fromAnchor} from '../src/graph/camera';
import {MIN_ZOOM,MAX_ZOOM} from '../src/graph/model';

const view={width:900,height:620};
/** A hand that produces events at a chosen cadence, so a mouse notch and a
 *  trackpad pinch can both be driven deterministically. */
const hand=(gapMs:number)=>{let t=0;const rig=new CameraRig(()=>t);return{rig,beat(ms=gapMs){t+=ms;},advance(ms:number){t+=ms;}};};
const settle=(rig:CameraRig,dt=16)=>{let frames=0;while(rig.moving&&frames++<3000)rig.step(dt);return frames;};
const trace=(rig:CameraRig,frames:number,dt=16)=>{const values:number[]=[];for(let i=0;i<frames;i++)values.push(Math.log(rig.step(dt).zoom));return values;};

it('keeps the world point under the pointer exactly pinned for the whole zoom',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:120,y:-80,zoom:.8});
  const pointer={x:237,y:411},held=screenToWorld(pointer,h.rig.value,view);
  h.beat();h.rig.zoomAt(pointer,1.6);
  let frames=0;while(h.rig.moving&&frames++<3000){const seen=screenToWorld(pointer,h.rig.step(16),view);expect(seen.x).toBeCloseTo(held.x,9);expect(seen.y).toBeCloseTo(held.y,9);}
  expect(h.rig.value.zoom).toBeCloseTo(1.28,3);
});
it('a pointer that travels during the gesture is still held exactly',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:.5});
  h.beat();h.rig.zoomAt({x:100,y:100},1.3);
  for(let i=0;i<10&&h.rig.moving;i++){h.beat();h.rig.zoomAt({x:100+i*7,y:100+i*3},1.02);h.rig.step(16);}
  const pointer={x:163,y:127},held=screenToWorld(pointer,h.rig.value,view);
  h.rig.zoomAt(pointer,2.2);
  let frames=0;while(h.rig.moving&&frames++<3000){const seen=screenToWorld(pointer,h.rig.step(16),view);expect(seen.x).toBeCloseTo(held.x,9);expect(seen.y).toBeCloseTo(held.y,9);}
});
it('never overshoots, however hard the direction changes',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:.2});
  h.beat();h.rig.zoomAt({x:450,y:310},4);
  const rising=trace(h.rig,300);
  for(let i=1;i<rising.length;i++)expect(rising[i]).toBeGreaterThanOrEqual(rising[i-1]-1e-12);
  expect(h.rig.value.zoom).toBeLessThanOrEqual(MAX_ZOOM);
  const reached=h.rig.value.zoom;
  // Slam the direction back while the camera is still travelling.
  h.beat();h.rig.zoomAt({x:450,y:310},.05);
  const falling=trace(h.rig,400);
  for(let i=1;i<falling.length;i++)expect(falling[i]).toBeLessThanOrEqual(falling[i-1]+1e-12);
  expect(h.rig.value.zoom).toBeLessThan(reached);
  expect(h.rig.value.zoom).toBeCloseTo(reached*.05,3);
});
it('a single wheel notch eases in instead of jumping, and lands exactly',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  h.beat();h.rig.zoomAt({x:450,y:310},1.15);
  const log=trace(h.rig,40);
  // No single frame may move the world by a visible amount.
  for(let i=1;i<log.length;i++)expect(Math.abs(log[i]-log[i-1])).toBeLessThan(.1);
  expect(h.rig.value.zoom).toBeCloseTo(1.15,4);
  const frames=settle(h.rig);
  expect(frames).toBeLessThan(40);
});
it('a reversal never produces a discontinuity',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  h.beat();h.rig.zoomAt({x:450,y:310},3);
  const up=trace(h.rig,14);
  h.beat();h.rig.zoomAt({x:450,y:310},.1);
  const down=trace(h.rig,14);
  const step=Math.max(...[...up,...down].map((v,i,a)=>i?Math.abs(v-a[i-1]):0));
  expect(step).toBeLessThan(.2);
});
it('a sustained trackpad pinch tracks the hand instead of falling behind',()=>{
  const h=hand(4);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  let worst=0;
  for(let frame=0;frame<10;frame++){for(let i=0;i<4;i++){h.beat();h.rig.zoomAt({x:450,y:310},1.02);}h.rig.step(16);worst=Math.max(worst,Math.abs(Math.log(h.rig.value.zoom)-Math.log(Math.pow(1.02,4*(frame+1)))));}
  expect(worst).toBeLessThan(.05);
  settle(h.rig);
  expect(h.rig.value.zoom).toBeCloseTo(Math.pow(1.02,40),3);
});
it('a slow precise scroll moves exactly as little as it is asked to',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  h.beat();h.rig.zoomAt({x:450,y:310},1.001);h.rig.step(16);
  expect(h.rig.value.zoom).toBeGreaterThan(1.00015);
  expect(h.rig.value.zoom).toBeLessThan(1.001);
  settle(h.rig);
  expect(h.rig.value.zoom).toBeCloseTo(1.001,6);
});
it('the same gesture lands in the same place at 30, 60 and 144Hz',()=>{
  const run=(dt:number)=>{const h=hand(4);h.rig.resize(view);h.rig.set({x:10,y:-5,zoom:.3});
   for(let i=0;i<20;i++){h.beat();h.rig.panBy(20,-13);h.beat();h.rig.zoomAt({x:200,y:150},1.1);h.rig.step(dt);}
   settle(h.rig,dt);return h.rig.value;};
  const thirty=run(33.3),sixty=run(16.7),oneFortyFour=run(6.9);
  for(const rig of [thirty,sixty,oneFortyFour]){
   expect(rig.x).toBeCloseTo(sixty.x,1);expect(rig.y).toBeCloseTo(sixty.y,1);expect(rig.zoom).toBeCloseTo(sixty.zoom,4);
  }
  // A long frame after a background stall cannot send the camera anywhere absurd.
  const stalled=hand(90);stalled.rig.resize(view);stalled.rig.set({x:0,y:0,zoom:1});stalled.beat();stalled.rig.zoomAt({x:300,y:200},4);stalled.rig.step(4000);
  expect(Number.isFinite(stalled.rig.value.zoom)).toBe(true);expect(stalled.rig.value.zoom).toBeLessThanOrEqual(MAX_ZOOM);
});
it('comes to rest and stops consuming frames',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});h.beat();h.rig.panBy(300,180);
  const frames=settle(h.rig);
  expect(h.rig.moving).toBe(false);expect(frames).toBeLessThan(140);
  const rest=h.rig.value;h.rig.step(16);expect(h.rig.value).toEqual(rest);
});
it('pan momentum coasts to a stop without a lurch',()=>{
  const h=hand(12);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  // A drag, then a release, sampled the way the renderer sees it.
  const drag:number[]=[];
  for(let i=0;i<8;i++){h.beat();h.rig.panBy(14,0);drag.push(h.rig.step(16).x);}
  h.rig.release({x:3,y:0});
  const coast:number[]=[];
  for(let i=0;i<40&&h.rig.moving;i++)coast.push(h.rig.step(16).x);
  const step=(a:number[])=>Math.max(...a.slice(1).map((v,i)=>Math.abs(v-a[i])));
  // The first frame after release is in the same league as the drag itself.
  expect(step(coast)).toBeLessThan(step(drag)*1.6);
  expect(coast[coast.length-1]).toBeGreaterThan(drag[drag.length-1]+30);
  const rest=h.rig.value.x;h.rig.step(16);expect(h.rig.value.x).toBe(rest);
});
it('normalises mouse wheel, line mode, page mode and trackpad pinch into one scale',()=>{
  expect(wheelZoomFactor({deltaY:-100,deltaMode:0,ctrlKey:false},800)).toBeGreaterThan(1.1);
  expect(wheelZoomFactor({deltaY:-100,deltaMode:0,ctrlKey:false},800)).toBeLessThan(1.25);
  expect(wheelZoomFactor({deltaY:100,deltaMode:0,ctrlKey:false},800)).toBeLessThan(1);
  expect(wheelZoomFactor({deltaY:-3,deltaMode:1,ctrlKey:false},800)).toBeCloseTo(wheelZoomFactor({deltaY:-48,deltaMode:0,ctrlKey:false},800),9);
  expect(wheelZoomFactor({deltaY:-1,deltaMode:2,ctrlKey:false},800)).toBeCloseTo(wheelZoomFactor({deltaY:-800,deltaMode:0,ctrlKey:false},800),9);
  const pinch=wheelZoomFactor({deltaY:-2,deltaMode:0,ctrlKey:true},800),plain=wheelZoomFactor({deltaY:-2,deltaMode:0,ctrlKey:false},800);
  expect(pinch).toBeGreaterThan(1.01);expect(pinch).toBeLessThan(1.05);
  expect(Math.log(pinch)/Math.log(plain)).toBeGreaterThan(4);
  expect(wheelZoomFactor({deltaY:-99999,deltaMode:0,ctrlKey:false},800)).toBeLessThan(1.9);
  // Spreading fingers apart zooms out, pinching together zooms in.
  expect(gestureZoomFactor(1.2,1)).toBeLessThan(1);
  expect(gestureZoomFactor(.8,1)).toBeGreaterThan(1);
  expect(gestureZoomFactor(0,1)).toBe(1);
});
it('keeps zoom inside its bounds under any input',()=>{
  const h=hand(4);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  for(let i=0;i<400;i++){h.beat();h.rig.zoomAt({x:450,y:310},1.2);}
  settle(h.rig);expect(h.rig.value.zoom).toBeCloseTo(MAX_ZOOM,6);
  for(let i=0;i<600;i++){h.beat();h.rig.zoomAt({x:450,y:310},.8);}
  settle(h.rig);expect(h.rig.value.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
  expect(clampZoom(-5)).toBe(MIN_ZOOM);expect(clampZoom(99)).toBe(MAX_ZOOM);
});
it('never touches world coordinates: the camera is a pure view transform',()=>{
  const world=[{x:0,y:0},{x:420,y:-310},{x:-1900,y:1400}];
  const before=JSON.stringify(world);
  const h=hand(4);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});
  for(let i=0;i<200;i++){h.beat();h.rig.zoomAt({x:i%900,y:i%620},1.03);}
  settle(h.rig);h.beat();h.rig.panBy(500,-400);settle(h.rig);
  expect(JSON.stringify(world)).toBe(before);
});
it('halts immediately when the user grabs the canvas',()=>{
  const h=hand(90);h.rig.resize(view);h.rig.set({x:0,y:0,zoom:1});h.beat();h.rig.zoomAt({x:100,y:100},3);
  h.rig.step(16);h.rig.halt();
  expect(h.rig.moving).toBe(false);
  const rest={...h.rig.value};h.rig.step(16);h.rig.step(16);
  expect(h.rig.value).toEqual(rest);
});
it('exposes a single anchor formula for both directions',()=>{
  const anchor={world:{x:120,y:-80},screen:{x:640,y:200}};
  expect(screenToWorld(anchor.screen,fromAnchor(anchor,2.5,view),view)).toEqual(anchor.world);
});
it('reduced motion applies the target immediately',()=>{
  const h=hand(90);h.rig.setReduced(true);h.rig.set({x:0,y:0,zoom:1});h.rig.resize(view);
  h.beat();h.rig.zoomAt({x:300,y:200},2);
  expect(h.rig.value.zoom).toBe(2);expect(h.rig.moving).toBe(false);
});

it('interrupting a live pan does not strand subsequent wheel zoom',()=>{
 const rig=new CameraRig();rig.resize(view);rig.trackTo({x:40,y:20,zoom:1});rig.halt();
 expect(rig.gesturing).toBe(false);rig.zoomAt({x:300,y:200},1.4);settle(rig);
 expect(rig.value.zoom).toBeCloseTo(1.4,3);
});
