import type {Snapshot} from '../core/model';
import {structure} from './structure';

/** Visual attention only: never changes world positions or real links. */
export function neighborhood(data:Snapshot,selected:string,zoom=1):Map<string,number>{
 const atoms=new Map(data.atoms.map(a=>[a.id,a])),focus=atoms.get(selected),result=new Map<string,number>();
 if(!focus)return result;
 const adjacent=new Map(data.atoms.map(a=>[a.id,[] as {id:string;cost:number}[]]));
 for(const l of data.links){if(!atoms.has(l.from)||!atoms.has(l.to))continue;const cost=l.relation==='related'?1:.7;adjacent.get(l.from)!.push({id:l.to,cost});adjacent.get(l.to)!.push({id:l.from,cost});}
 const direct=new Set(adjacent.get(selected)!.map(n=>n.id));
 const distances=new Map<string,number>([[selected,0]]),hops=new Map<string,number>([[selected,0]]),queue=[selected];
 for(let i=0;i<queue.length;i++){const id=queue[i],depth=hops.get(id)!;if(depth>=4)continue;for(const edge of adjacent.get(id)!){const degree=adjacent.get(id)!.length;
  // Crossing a large hub is a weaker contextual signal than staying in a branch.
  const distance=distances.get(id)!+edge.cost+(id===selected?0:Math.log2(1+degree)*.13);
  if(distance>4.6||distance>=(distances.get(edge.id)??Infinity))continue;distances.set(edge.id,distance);hops.set(edge.id,depth+1);queue.push(edge.id);
 }}
 const candidates=[...distances].filter(([id])=>id!==selected).map(([id,distance])=>{const a=atoms.get(id)!,degree=adjacent.get(id)!.length,common=adjacent.get(id)!.filter(n=>direct.has(n.id)).length;
  const significance=Math.min(.3,Math.log2(1+degree)*.035+a.importance*.04+common*.04);
  return{id,score:direct.has(id)?.9:Math.min(.78,Math.exp(-distance*.48)+significance)};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const budget=Math.max(24,Math.min(100,Math.round(60/Math.sqrt(Math.max(.5,zoom)))));
 result.set(selected,1);for(const c of candidates.slice(0,Math.max(budget,Math.min(120,direct.size))))result.set(c.id,c.score);
 // Nearby thoughts provide spatial bearings even when there is no explicit link.
 const nearby=data.atoms.filter(a=>!result.has(a.id)).map(a=>({id:a.id,d:Math.hypot(a.x-focus.x,a.y-focus.y)})).filter(a=>a.d<650).sort((a,b)=>a.d-b.d||a.id.localeCompare(b.id)).slice(0,6);
 for(const a of nearby)result.set(a.id,.25+.15*(1-a.d/650));
 // A structural branch stays legible as a whole; crossing a bridge must not
 // give another branch the same visual weight as the one being explored.
 const tree=structure(data),children=tree.children.get(selected)||[];
 if(children.length){
  const branch=new Set(tree.descendants(selected));
  for(const id of result.keys())if(!branch.has(id))result.set(id,Math.min(.22+(atoms.get(id)?.importance||0)*.08,result.get(id)!));
  for(const id of branch)result.set(id,1);
  const parent=tree.parent.get(selected);if(parent)result.set(parent,.5);
 }
 return result;
}
