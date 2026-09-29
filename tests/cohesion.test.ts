import {it,expect} from 'vitest';
import {dynamicsStep} from '../src/plugins/dynamics/motion';
import {PRESETS,type PhysicsInput} from '../src/graph/physics';
for(const kind of ['molecule','compact'] as const)it(`${kind} gathers free isolated notes but preserves pins and manual placement`,()=>{
 const nodes=Array.from({length:120},(_,i)=>({id:String(i),x:Math.cos(i*2.4)*(900+i*10),y:Math.sin(i*2.4)*(900+i*10),vx:0,vy:0,radius:25,mass:1,pinned:i===0,resistance:i===1?100:0}));
 let input:PhysicsInput={nodes,links:[],settings:kind==='molecule'?PRESETS.elastic:PRESETS.free,dt:1,reducedMotion:false};
 const spread=(ns:typeof nodes)=>ns.reduce((sum,n)=>sum+Math.hypot(n.x,n.y),0);
 for(let i=0;i<400;i++)input={...input,nodes:dynamicsStep(kind,input).nodes};
 expect(spread(input.nodes)).toBeLessThan(spread(nodes)*.85);expect(input.nodes[0].x).toBe(nodes[0].x);expect(input.nodes[1].x).toBe(nodes[1].x);
 expect(input.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&!n.target)).toBe(true);
});
