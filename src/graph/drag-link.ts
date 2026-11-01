import type {Link} from '../core/model';
import type {Camera,GraphNode} from './model';

export const LINK_DWELL_MS=420;
export const LINK_DWELL_SLOP=10;
export interface LinkDwell {target:string;x:number;y:number;since:number}
/** Dwell is measured in screen pixels: moving through a body cannot arm a drop. */
export function dwellLink(previous:LinkDwell|null,target:string,point:{x:number;y:number},now:number):LinkDwell|null {
 if(!target)return null;
 if(previous?.target===target&&Math.hypot(point.x-previous.x,point.y-previous.y)<=LINK_DWELL_SLOP)return previous;
 return {target,...point,since:now};
}
export function linkReady(dwell:LinkDwell|null,now:number){return Boolean(dwell&&now-dwell.since>=LINK_DWELL_MS);}
export function linkedPair(links:Link[],from:string,to:string){return links.some(l=>l.from===from&&l.to===to||l.from===to&&l.to===from);}
export function dragLinkTarget(nodes:(GraphNode&{opacity?:number})[],source:string,point:{x:number;y:number},camera:Camera,view:{width:number;height:number}){
 let target='',best=Infinity;
 for(const n of nodes){if(n.id===source||n.members||(n.opacity??1)<.5)continue;
  const d=Math.hypot(point.x-(view.width/2+camera.x+n.x*camera.zoom),point.y-(view.height/2+camera.y+n.y*camera.zoom));
  if(d<=Math.max(24,n.radius*camera.zoom+12)&&d<best){best=d;target=n.id;}
 }
 return target;
}
