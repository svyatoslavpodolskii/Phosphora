import {it,expect} from 'vitest';
import {physicsStep,forces,dropResistance,PRESETS,type PhysicsInput,type Body} from '../src/graph/physics';
const body=(id:string,x:number,y=0,pinned=false):Body=>({id,x,y,vx:0,vy:0,pinned,radius:30,mass:1,resistance:0});
const input=(nodes:Body[],links:{from:string;to:string}[]):PhysicsInput=>({nodes,links,settings:PRESETS.living,dt:1,reducedMotion:false});
it('free mode releases distant bonds instead of acting like a tether',()=>{const frame={...input([body('A',0,0,true),body('B',1200)],[{from:'A',to:'B'}]),settings:PRESETS.free,mode:'free'};expect(Math.abs(forces(frame).get('B')!.x)).toBeLessThan(.001);for(let i=0;i<120;i++)frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[1].x).toBe(1200);const local={...frame,nodes:[body('A',0,0,true),body('B',300)]};expect(forces(local).get('B')!.x).toBeLessThan(-.1);});
it('elastic contacts transfer more motion than calm contacts at identical settings',()=>{const frame=input([{...body('A',0),vx:2},body('B',56)],[]);const calm=physicsStep({...frame,mode:'calm'});const elastic=physicsStep({...frame,mode:'elastic'});expect(elastic.nodes[1].vx).toBeGreaterThan(calm.nodes[1].vx);expect(elastic.nodes[1].vx).toBeLessThanOrEqual(3);});
it('manual drop is force-based static friction, bridge can overcome it',()=>{let frame=input([body('A',0,0,true),body('B',250),body('C',400,0,true)],[{from:'A',to:'B'},{from:'B',to:'C'}]);frame.nodes[1].y=180;frame.nodes[1].resistance=dropResistance(frame,'B');const x=frame.nodes[1].x,y=frame.nodes[1].y;for(let i=0;i<120;i++)frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[1].x).toBe(x);expect(frame.nodes[1].y).toBe(y);frame.nodes.push(body('X',1400,180,true));frame.links.push({from:'B',to:'X'});for(let i=0;i<60;i++)frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[1].x).toBeGreaterThan(x+10);});
it('pin is absolute and unpin resumes gradual movement under tension',()=>{const frame=input([body('A',0,0,true),body('B',650,0,true)],[{from:'A',to:'B'}]);for(let i=0;i<100;i++)frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[1].x).toBe(650);frame.nodes[1].pinned=false;frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[1].x).toBeLessThan(650);expect(frame.nodes[1].x).toBeGreaterThan(640);});
it('collision separates large nodes around fixed pinned geometry',()=>{const frame=input([{...body('A',0,0,true),radius:64},{...body('B',30),radius:64}],[]);for(let i=0;i<120;i++)frame.nodes=physicsStep(frame).nodes;expect(frame.nodes[0].x).toBe(0);expect(frame.nodes[1].x).toBeGreaterThan(125);});
it('presets and reduced motion affect actual integration',()=>{const f=input([body('A',0,0,true),body('B',500)],[{from:'A',to:'B'}]);const calm=physicsStep({...f,settings:PRESETS.calm}).nodes[1];const elastic=physicsStep({...f,settings:PRESETS.elastic}).nodes[1];expect(elastic.x).toBeLessThan(calm.x);const reduced=physicsStep({...f,reducedMotion:true}).nodes[1];expect(Math.abs(reduced.x-500)).toBeLessThan(Math.abs(physicsStep(f).nodes[1].x-500));});

it('approaching outlines has no proximity wall, with or without a short link',()=>{
 for(const links of [[],[{from:'A',to:'B'}]])for(const settings of Object.values(PRESETS)){
  let previous=0;
  for(let distance=100;distance>=55;distance-=.25){
   const frame={...input([body('A',0,0,true),body('B',distance)],links),settings};
   const force=forces(frame).get('B')!.x;
   if(distance>=62)expect(force).toBeLessThan(.15);
   expect(Math.abs(force-previous)).toBeLessThan(.15);previous=force;
   expect(physicsStep(frame).nodes[1].x-distance).toBeLessThan(1);
  }
 }
});

it('three overlapping atoms settle into a compact group without shooting apart',()=>{
 const frame=input([body('A',0),body('B',15),body('C',7,10)],[]);
 for(let i=0;i<500;i++){
  const before=frame.nodes;frame.nodes=physicsStep(frame).nodes;
  frame.nodes.forEach((n,j)=>expect(Math.hypot(n.x-before[j].x,n.y-before[j].y)).toBeLessThanOrEqual(3.00001));
 }
 for(const a of frame.nodes)for(const b of frame.nodes)if(a.id!==b.id){
  expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThanOrEqual(59);
  expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(95);
 }
});

it('large and small outlines resolve contact without an oversized gap',()=>{
 const frame=input([{...body('A',0,0,true),radius:64},{...body('B',70),radius:18}],[]);
 for(let i=0;i<300;i++)frame.nodes=physicsStep(frame).nodes;
 expect(frame.nodes[1].x).toBeGreaterThanOrEqual(82);
 expect(frame.nodes[1].x).toBeLessThan(90);
});

it('bounded substeps reproduce equal elapsed time and zero time does not move',()=>{
 const frame=input([body('A',0,0,true),body('B',500)],[{from:'A',to:'B'}]);
 const twice=physicsStep({...frame,nodes:physicsStep(frame).nodes});
 expect(physicsStep({...frame,dt:2})).toEqual(twice);
 expect(physicsStep({...frame,dt:0}).nodes).toEqual(frame.nodes);
 expect(physicsStep({...frame,dt:100})).toEqual(physicsStep({...frame,dt:4}));
});

it('many incident links cannot create an unbounded resultant force',()=>{
 const nodes=[body('A',0),...Array.from({length:100},(_,i)=>body('B'+i,1000+i,0,true))];
 const frame=input(nodes,nodes.slice(1).map(n=>({from:'A',to:n.id})));
 const f=forces(frame).get('A')!;expect(Math.hypot(f.x,f.y)).toBeLessThanOrEqual(12);
});

it('a compressed link settles without jitter or returning to preferred distance',()=>{
 const frame=input([body('A',0,0,true),body('B',48)],[{from:'A',to:'B'}]);
 for(let i=0;i<300;i++)frame.nodes=physicsStep(frame).nodes;
 const resting=frame.nodes[1].x;
 expect(resting).toBeGreaterThanOrEqual(60);expect(resting).toBeLessThan(70);
 for(let i=0;i<300;i++)frame.nodes=physicsStep(frame).nodes;
 expect(frame.nodes[1].x).toBe(resting);
 expect(frame.nodes[1].vx).toBe(0);
});
