import type {Snapshot} from '../core/model';

/** Semantic scale is a banded presentation layer. It never changes world
 *  coordinates, never starts physics and never triggers a layout pass. */
export const LOD={clusterIn:.42,clusterOut:.56,overviewIn:.3,overviewOut:.36};

const smooth=(t:number)=>t*t*(3-2*t);

/** Continuous 0 (fully expanded) to 1 (fully collapsed) across the transition
 *  range, so a parent and its children coexist for the whole crossing. */
export function collapseAmount(zoom:number){
  if(zoom>=LOD.clusterOut)return 0;
  if(zoom<=LOD.clusterIn)return 1;
  return smooth((LOD.clusterOut-zoom)/(LOD.clusterOut-LOD.clusterIn));
}

/** True once even clusters stop being individually addressable. */
export function overviewAmount(zoom:number){
  if(zoom>=LOD.overviewOut)return 0;
  if(zoom<=LOD.overviewIn)return 1;
  return smooth((LOD.overviewOut-zoom)/(LOD.overviewOut-LOD.overviewIn));
}

/** Memoises a derived projection against an opaque topology key. A pure zoom
 *  keeps the same key, so grouping is never rebuilt while the camera moves. */
export class DerivedCache<T>{
  private entries=new Map<string,T>();
  get(key:string,compute:()=>T):T{
   const hit=this.entries.get(key);
   if(hit!==undefined)return hit;
   const made=compute();
   if(this.entries.size>=3)this.entries.delete(this.entries.keys().next().value!);
   this.entries.set(key,made);
   return made;
  }
  invalidate(){this.entries.clear();}
}

/** Topology identity for cached grouping. Deliberately excludes positions and
 *  selection so that zooming, panning and focusing never invalidate it. */
export function topologyKey(data:Snapshot){
  const links=data.links;
  let hash=2166136261;
  for(const a of data.atoms){for(let i=0;i<a.id.length;i++)hash=Math.imul(hash^a.id.charCodeAt(i),16777619);}
  hash=Math.imul(hash^links.length,16777619);
  for(const l of links){for(let i=0;i<l.from.length;i++)hash=Math.imul(hash^l.from.charCodeAt(i),16777619);for(let i=0;i<l.to.length;i++)hash=Math.imul(hash^l.to.charCodeAt(i),16777619);}
  return data.atoms.length+':'+hash.toString(36);
}
