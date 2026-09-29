import {it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {stressFixture} from './stress-fixture';
import {arrangeDynamics,type DynamicsKind} from '../src/plugins/dynamics/layouts';
import {dynamicsStep} from '../src/plugins/dynamics/motion';
import {PRESETS,type PhysicsInput} from '../src/graph/physics';
import {footprint} from '../src/graph/footprint';
it('three real layouts remain distinct and readable at 100, 500 and 1000 atoms',()=>{
 const metrics=[];for(const count of [100,500,1000]){const data=stressFixture(count),original=JSON.stringify(data),layouts=[];for(const kind of ['branch','molecule','compact'] as DynamicsKind[]){const start=performance.now(),out=arrangeDynamics(kind,{data,settings:PRESETS.calm}),ms=performance.now()-start;expect(out.positions).toHaveLength(count);expect(out.positions.every(p=>Number.isFinite(p.x+p.y))).toBe(true);const byId=new Map(out.positions.map(p=>[p.id,p])),boxes=data.atoms.map(a=>({...byId.get(a.id)!,...footprint(a.title,38,Boolean(a.content))}));let overlaps=0;for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){const a=boxes[i],b=boxes[j];if(Math.abs(a.x-b.x)<a.halfWidth+b.halfWidth-8&&Math.min(a.y+a.bottom,b.y+b.bottom)-Math.max(a.y-a.top,b.y-b.top)>8)overlaps++;}expect(overlaps,`${kind}/${count}`).toBeLessThan(count*.02);const xs=out.positions.map(p=>p.x),ys=out.positions.map(p=>p.y),area=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));metrics.push({count,kind,ms:Math.round(ms),overlaps,area:Math.round(area)});layouts.push(out.positions);}
 for(let i=0;i<layouts.length;i++)for(let j=i+1;j<layouts.length;j++){const mean=layouts[i].reduce((s,p,k)=>s+Math.hypot(p.x-layouts[j][k].x,p.y-layouts[j][k].y),0)/count;expect(mean).toBeGreaterThan(100);}expect(JSON.stringify(data)).toBe(original);}
 writeFileSync('artifacts/dynamics-metrics.json',JSON.stringify(metrics,null,2));console.log(metrics);
},30000);
it('molecular compression, branching tension and compact local contacts behave differently',()=>{
 const input:PhysicsInput={nodes:[{id:'a',x:0,y:0,vx:0,vy:0,radius:10,mass:1,pinned:true,resistance:0},{id:'b',x:90,y:0,vx:0,vy:0,radius:10,mass:1,pinned:false,resistance:0}],links:[{from:'a',to:'b',distance:250,strength:1}],settings:PRESETS.elastic,dt:1,reducedMotion:false};expect(dynamicsStep('branch',input).nodes[1].x).toBe(90);expect(dynamicsStep('molecule',input).nodes[1].x).toBeGreaterThan(90);input.nodes[1].x=900;expect(dynamicsStep('compact',input).nodes[1].x).toBeLessThan(900);expect(dynamicsStep('branch',input).nodes[1].x).toBeLessThan(900);expect(dynamicsStep('molecule',input).nodes[0].x).toBe(0);
});
