export interface PhysicsSettings {elasticity:number;repulsion:number;distance:number;damping:number;inertia:number;friction:number}
export const PRESETS:Record<string,PhysicsSettings>={calm:{elasticity:.014,repulsion:550,distance:175,damping:.72,inertia:1.8,friction:.8},living:{elasticity:.024,repulsion:900,distance:165,damping:.8,inertia:1.3,friction:.65},elastic:{elasticity:.045,repulsion:700,distance:145,damping:.85,inertia:1,friction:.8},free:{elasticity:.009,repulsion:1400,distance:210,damping:.76,inertia:1.5,friction:.5}};
export const PHYSICS_RANGES:Record<keyof PhysicsSettings,[number,number]>={elasticity:[.005,.065],repulsion:[100,2200],distance:[110,280],damping:[.55,.88],inertia:[.8,3],friction:[.25,2]};
export function safePhysics(value:Partial<PhysicsSettings>):PhysicsSettings{const result={...PRESETS.calm};for(const key of Object.keys(result) as (keyof PhysicsSettings)[]){const n=value[key];if(n!==undefined){const [min,max]=PHYSICS_RANGES[key];if(!Number.isFinite(n))throw Error('Некорректная настройка физики.');result[key]=Math.max(min,Math.min(max,n));}}return result;}
export interface Body {id:string;x:number;y:number;vx:number;vy:number;radius:number;mass:number;pinned:boolean;resistance:number;dragged?:boolean;boundary?:boolean;halfWidth?:number;top?:number;bottom?:number;target?:{x:number;y:number}}
export interface PhysicsInput {nodes:Body[];links:{from:string;to:string;strength?:number;distance?:number}[];settings:PhysicsSettings;mode?:string;bondBehavior?:'tension'|'elastic'|'local';dt:number;reducedMotion:boolean}
export interface PhysicsOutput {nodes:Body[];energy:number}
export function forces(input:PhysicsInput,contacts=new Set<string>()):Map<string,{x:number;y:number}>{
 const result=new Map(input.nodes.map(n=>[n.id,{x:0,y:0}]));const byId=new Map(input.nodes.map(n=>[n.id,n]));const s=safePhysics(input.settings);
 for(const l of input.links){const a=byId.get(l.from),b=byId.get(l.to);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y;const d=Math.max(.1,Math.hypot(dx,dy));const preferred=Math.max(l.distance??s.distance,a.radius+b.radius+20);const strength=Math.max(.01,Math.min(3,l.strength??1));const stretch=input.bondBehavior==='elastic'?d-preferred:Math.max(0,d-preferred);if(input.bondBehavior==='local'&&d>preferred*1.8)continue;const field=input.mode==='free'?Math.exp(-((stretch/preferred)**2)):1;const cap=input.mode==='calm'?3:input.mode==='living'?5:12;const f=cap*Math.tanh(stretch*s.elasticity*strength/cap)*field;const fa=result.get(a.id)!,fb=result.get(b.id)!;fa.x+=dx/d*f;fa.y+=dy/d*f;fb.x-=dx/d*f;fb.y-=dy/d*f;}
 // Spatial hashing bounds footprint collision cost to the active neighbourhood.
 const cell=180;const grid=new Map<string,Body[]>();for(const n of input.nodes){const key=`${Math.floor(n.x/cell)},${Math.floor(n.y/cell)}`;const list=grid.get(key)||[];list.push(n);grid.set(key,list);}
 for(const a of input.nodes){const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);for(let x=gx-2;x<=gx+2;x++)for(let y=gy-2;y<=gy+2;y++)for(const b of grid.get(`${x},${y}`)||[]){if(a.id>=b.id)continue;let dx=b.x-a.x,dy=b.y-a.y;const distance=Math.hypot(dx,dy);let d=distance;if(d<.01){dx=1;dy=.5;d=Math.hypot(dx,dy);}let overlap=Math.max(0,a.radius+b.radius+2-distance);if(a.halfWidth&&b.halfWidth){const ox=a.halfWidth+b.halfWidth-Math.abs(dx),oy=Math.min(a.y+(a.bottom||a.radius),b.y+(b.bottom||b.radius))-Math.max(a.y-(a.top||a.radius),b.y-(b.top||b.radius));overlap=Math.max(0,Math.min(ox,oy));if(overlap>0){if(ox<oy){dx=dx>=0?1:-1;dy=0;}else{dx=0;dy=dy>=0?1:-1;}d=1;}}
 // No proximity wall: a smooth bounded response starts at the painted outline.
 // Contact stiffness changes the response, never the distance at which it starts.
 if(overlap>0){contacts.add(a.id);contacts.add(b.id);}

 const approach=Math.max(0,((a.vx-b.vx)*dx+(a.vy-b.vy)*dy)/d);const transfer=input.mode==='elastic'?.65:input.mode==='free'?.35:0;const f=3*Math.tanh(overlap*overlap/180)*Math.sqrt(s.repulsion/550)+(overlap>0?Math.min(1,overlap/8)*approach*transfer:0);
 const fa=result.get(a.id)!,fb=result.get(b.id)!;fa.x-=dx/d*f;fa.y-=dy/d*f;fb.x+=dx/d*f;fb.y+=dy/d*f;}}
 for(const n of input.nodes)if(n.target&&!n.resistance){const f=result.get(n.id)!,dx=n.target.x-n.x,dy=n.target.y-n.y,d=Math.hypot(dx,dy);if(d>1){const force=2*Math.tanh(d/100);f.x+=dx/d*force;f.y+=dy/d*force;}}
 for(const force of result.values()){const length=Math.hypot(force.x,force.y);if(length>12){force.x*=12/length;force.y*=12/length;}}
 return result;
}
export function physicsStep(input:PhysicsInput):PhysicsOutput {
 const duration=Number.isFinite(input.dt)?Math.max(0,Math.min(4,input.dt)):0;
 let nodes=input.nodes;let energy=0;
 for(let remaining=duration;remaining>1e-8;remaining-=Math.min(1,remaining)){
 const result=integrate({...input,nodes,dt:Math.min(1,remaining)});nodes=result.nodes;energy=result.energy;
 }
 return {nodes,energy};
}
function integrate(input:PhysicsInput):PhysicsOutput {
 const s=safePhysics(input.settings),contacts=new Set<string>(),f=forces(input,contacts);const dt=input.dt;let energy=0;
 const nodes=input.nodes.map(old=>{const n={...old};if(n.pinned||n.dragged||n.boundary){n.vx=0;n.vy=0;return n;}const force=f.get(n.id)!;const forceSize=Math.hypot(force.x,force.y),speed=Math.hypot(n.vx,n.vy);const contact=contacts.has(n.id);const threshold=Math.max(contact?.01:s.friction,n.resistance);
 // Coulomb static friction is force based, persisted after drag; never a timer.
 if(speed<.08&&forceSize<=threshold){n.vx=0;n.vy=0;return n;}
 if(n.resistance>0&&forceSize>threshold)n.resistance=0;
 const mass=Math.max(.5,n.mass)*s.inertia;const motion=input.reducedMotion?.5:1;const damping=Math.min(s.damping,contact?(input.mode==='elastic'?.8:input.mode==='free'?.76:.55):input.reducedMotion?.65:1);
 const decay=damping**dt;const impulse=damping*(1-decay)/(1-damping);
 n.vx=n.vx*decay+force.x/mass*impulse;n.vy=n.vy*decay+force.y/mass*impulse;const v=Math.hypot(n.vx,n.vy);const max=3*motion;const nextSpeed=Math.min(max,Math.max(0,v-(contact?0:s.friction*.3*dt)));if(v>0){n.vx*=nextSpeed/v;n.vy*=nextSpeed/v;}n.x+=n.vx*dt*motion;n.y+=n.vy*dt*motion;energy+=Math.hypot(n.vx,n.vy);return n;});return{nodes,energy};
}
export function dropResistance(input:PhysicsInput,id:string){const f=forces(input).get(id);return Math.min(10000,(f?Math.hypot(f.x,f.y):0)*1.25+safePhysics(input.settings).friction*2);}
