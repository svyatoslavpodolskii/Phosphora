import type {Snapshot} from '../core/model';
import {clearFootprints} from './clearance';
import {graphFootprints} from './geometry';
type Point={x:number;y:number};
/** Fit proposed structures into existing anchored regions before applying any position. */
export function anchorLayout(data:Snapshot,positions:Map<string,Point>,locked:Set<string>){
 if(!locked.size)return positions;
 const points=new Map([...positions].map(([id,p])=>[id,{...p}])),byId=new Map(data.atoms.map(a=>[a.id,a])),adjacent=new Map(data.atoms.map(a=>[a.id,[] as string[]]));for(const l of data.links){if(!adjacent.has(l.from)||!adjacent.has(l.to))continue;adjacent.get(l.from)!.push(l.to);adjacent.get(l.to)!.push(l.from);}
 const seen=new Set<string>();for(const atom of data.atoms){if(seen.has(atom.id))continue;const component=[atom.id];seen.add(atom.id);for(let i=0;i<component.length;i++)for(const id of adjacent.get(component[i])!){if(!seen.has(id)){seen.add(id);component.push(id);}}
  const anchors=component.filter(id=>locked.has(id));if(!anchors.length)continue;
  const center=(source:Map<string,Point>)=>({x:anchors.reduce((s,id)=>s+source.get(id)!.x,0)/anchors.length,y:anchors.reduce((s,id)=>s+source.get(id)!.y,0)/anchors.length}),from=center(points),to=center(byId);let dot=0,cross=0,spread=0;
  for(const id of anchors){const p=points.get(id)!,a=byId.get(id)!,x=p.x-from.x,y=p.y-from.y;dot+=x*(a.x-to.x)+y*(a.y-to.y);cross+=x*(a.y-to.y)-y*(a.x-to.x);spread+=x*x+y*y;}
  const angle=Math.atan2(cross,dot),scale=spread>1?Math.max(.5,Math.min(2,Math.hypot(dot,cross)/spread)):1,c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;
  for(const id of component){const p=points.get(id)!,x=p.x-from.x,y=p.y-from.y;points.set(id,{x:to.x+x*c-y*s,y:to.y+x*s+y*c});}
  let residual=new Map(component.map(id=>{const a=byId.get(id)!,p=points.get(id)!;return[id,locked.has(id)?{x:a.x-p.x,y:a.y-p.y}:{x:0,y:0}];}));
  for(let pass=0;pass<60;pass++){const next=new Map(residual);for(const id of component){if(locked.has(id))continue;const neighbors=adjacent.get(id)!;if(!neighbors.length)continue;next.set(id,{x:neighbors.reduce((sum,k)=>sum+residual.get(k)!.x,0)/neighbors.length,y:neighbors.reduce((sum,k)=>sum+residual.get(k)!.y,0)/neighbors.length});}residual=next;}
  for(const id of component){const p=points.get(id)!,r=residual.get(id)!;points.set(id,locked.has(id)?{x:byId.get(id)!.x,y:byId.get(id)!.y}:{x:p.x+r.x,y:p.y+r.y});}
 }
 const order=[...locked,...data.atoms.filter(a=>!locked.has(a.id)).map(a=>a.id)];clearFootprints(points,graphFootprints(data),order,locked);return points;
}
