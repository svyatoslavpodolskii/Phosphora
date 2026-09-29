import type {Snapshot} from '../core/model';
import type {Body} from './physics';
/** Graph-local wake set, independent of camera and insertion order in the database. */
export function activeNeighborhood(data:Snapshot,bodies:Map<string,Body>,seeds:string[],limit=450){
 const adjacency=new Map<string,string[]>();for(const l of data.links){for(const [a,b] of [[l.from,l.to],[l.to,l.from]]){const list=adjacency.get(a)||[];list.push(b);adjacency.set(a,list);}}
 const selected=new Set(seeds.filter(id=>bodies.has(id)).slice(0,32));
 for(const b of bodies.values())if(Math.hypot(b.vx,b.vy)>.05&&selected.size<limit)selected.add(b.id);
 if(!selected.size)for(const b of bodies.values()){selected.add(b.id);if(selected.size>=limit)break;}
 let frontier=[...selected];for(let depth=0;depth<3&&selected.size<limit;depth++){const next:string[]=[];grow:for(const id of frontier)for(const other of adjacency.get(id)||[]){if(selected.has(other)||!bodies.has(other))continue;selected.add(other);next.push(other);if(selected.size>=limit)break grow;}frontier=next;}
 const grid=new Map<string,Body[]>(),cell=260;for(const b of bodies.values()){const key=Math.floor(b.x/cell)+','+Math.floor(b.y/cell),list=grid.get(key)||[];list.push(b);grid.set(key,list);}
 for(const id of [...selected]){if(selected.size>=limit)break;const a=bodies.get(id)!;const x=Math.floor(a.x/cell),y=Math.floor(a.y/cell);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const b of grid.get((x+dx)+','+(y+dy))||[]){if(selected.size>=limit)break;if(Math.hypot(a.x-b.x,a.y-b.y)<360)selected.add(b.id);}}
 return selected;
}
