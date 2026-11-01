import type {Snapshot} from '../core/model';
import type {Body} from './physics';

export const DRAG_LIMIT=256;
const MAX_HOPS=6;
type Point=Pick<Body,'x'|'y'|'pinned'|'mass'>;

/** Built once per gesture. Pins stop traversal, including pinned seeds.
 * A seed-rooted forest measures branch load without counting cycles or duplicate
 * links twice. Held nodes are handled separately from the bounded response set.
 */
export function dragWeights(data:Snapshot,seeds:string[],bodies?:ReadonlyMap<string,Point>,distance=175){
 const points=bodies||new Map(data.atoms.map(a=>[a.id,{x:a.x,y:a.y,pinned:a.pinned,mass:1+a.importance*.3}]));
 const edges=new Map<string,Set<string>>();
 for(const l of data.links){if(l.from===l.to||!points.has(l.from)||!points.has(l.to))continue;for(const [a,b] of [[l.from,l.to],[l.to,l.from]]){const list=edges.get(a)||new Set<string>();list.add(b);edges.set(a,list);}}
 const adjacency=new Map([...edges].map(([id,list])=>[id,[...list].sort()]));
 const held=[...new Set(seeds)].filter(id=>points.has(id)&&!points.get(id)!.pinned).sort();
 const parent=new Map<string,string>(),depth=new Map(held.map(id=>[id,0])),path=new Map(held.map(id=>[id,0]));
 const queue=[...held];
 for(let i=0;i<queue.length;i++){
  const id=queue[i],a=points.get(id)!;
  for(const other of adjacency.get(id)||[]){
   const b=points.get(other)!;if(b.pinned||depth.has(other))continue;
   parent.set(other,id);depth.set(other,depth.get(id)!+1);path.set(other,path.get(id)!+Math.hypot(a.x-b.x,a.y-b.y));queue.push(other);
  }
 }
 const load=new Map(queue.map(id=>[id,Math.max(.5,points.get(id)!.mass)]));
 for(let i=queue.length-1;i>=0;i--){const id=queue[i],p=parent.get(id);if(p!==undefined)load.set(p,load.get(p)!+load.get(id)!);}
 const transmission=new Map(held.map(id=>[id,1])),weights=new Map<string,number>();
 const reach=Math.max(1,Number.isFinite(distance)?distance:175)*3;
 for(const id of queue){
  const p=parent.get(id);if(p===undefined)continue;
  const hop=depth.get(id)!;if(hop>MAX_HOPS)continue;
  const hub=Math.max(0,(adjacency.get(id)?.length||0)-1);
  const resistance=1+.12*Math.sqrt(Math.max(0,load.get(id)!-1))+.08*Math.sqrt(hub);
  const transfer=transmission.get(p)!*.55/resistance;transmission.set(id,transfer);
  const weight=transfer/(1+(path.get(id)!/reach)**2);
  if(weight>=.001)weights.set(id,weight);
 }
 return new Map([...weights].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,DRAG_LIMIT));
}
