import type {Snapshot} from '../core/model';
/** Bounded graph-distance transmission from the hand to the connected structure. */
export function dragWeights(data:Snapshot,seeds:string[]){
 const edges=new Map<string,string[]>();for(const l of data.links)for(const [a,b] of [[l.from,l.to],[l.to,l.from]]){const list=edges.get(a)||[];list.push(b);edges.set(a,list);}
 const seen=new Set(seeds),weights=new Map<string,number>();let frontier=seeds;
 for(const weight of [.28,.085,.025]){const next:string[]=[];for(const id of frontier)for(const other of edges.get(id)||[]){if(seen.has(other))continue;seen.add(other);weights.set(other,weight);next.push(other);}frontier=next;}
 return weights;
}
