import {visualFootprint} from './footprint';
import type {Camera,GraphNode} from './model';

export interface Point{x:number;y:number}
interface Box{x:number;y:number;halfWidth:number;top:number;bottom:number}
interface Circle{x:number;y:number;r:number}

/** One painted thing the user can actually see and aim at. */
export interface HitRegion{
  id:string;kind:'atom'|'cluster';members?:string[];
  body:Circle;label?:Box;depth:number;opacity:number;
}

const DEPTH_PENALTY=.45,LABEL_PENALTY=.14,MOUSE_TOLERANCE=10,TOUCH_TOLERANCE=26;
/** A challenger must be this much better before the incumbent is released. */
const HANDOVER=.25;

const toScreen=(x:number,y:number,camera:Camera,view:{width:number;height:number})=>({x:view.width/2+camera.x+x*camera.zoom,y:view.height/2+camera.y+y*camera.zoom});

/** Mirrors the painted footprint exactly: the body outline, the icon, the wrapped
 *  label and the state caption the canvas actually draws. */
export function hitRegions(nodes:(GraphNode&{opacity?:number})[],camera:Camera,view:{width:number;height:number},selected='',states:Record<string,string>={}):HitRegion[]{
  const regions:HitRegion[]=[];
  const grouped=new Set(nodes.filter(n=>n.members&&(n.opacity??1)>.003).flatMap(n=>n.members!));
  for(const node of nodes){
   const opacity=node.opacity??1;
   if(opacity<=.02)continue;
   const center=toScreen(node.x,node.y,camera,view);
   const r=Math.max(4,node.radius*camera.zoom);
   const foot=visualFootprint(node.label,node.radius,camera.zoom,view.width,node.id===selected||camera.zoom>1.2?states[node.id]||node.state:'normal');
   const region:HitRegion={id:node.id,kind:node.members?'cluster':'atom',members:node.members,body:{x:center.x,y:center.y,r},depth:node.members?1:0,opacity};
   if(camera.zoom>.55||node.members||node.landmark||node.radius>36||!grouped.has(node.id)||node.id===selected)region.label={x:center.x,y:center.y,halfWidth:foot.halfWidth*camera.zoom,top:foot.top*camera.zoom,bottom:foot.bottom*camera.zoom};
   regions.push(region);
  }
  return regions;
}

interface Measurement{score:number;miss:boolean;part:'body'|'label'}
function measure(region:HitRegion,point:Point,tolerance:number):Measurement{
  const d=Math.hypot(region.body.x-point.x,region.body.y-point.y);
  if(d<=region.body.r)return{score:region.depth*DEPTH_PENALTY,miss:false,part:'body'};
  if(region.label){
   const l=region.label;
   if(point.x>=l.x-l.halfWidth&&point.x<=l.x+l.halfWidth&&point.y>=l.y-l.top&&point.y<=l.y+l.bottom)
    return{score:region.depth*DEPTH_PENALTY+LABEL_PENALTY,miss:false,part:'label'};
  }
  const reach=region.body.r+tolerance;
  if(d<=reach)return{score:region.depth*DEPTH_PENALTY+LABEL_PENALTY+.35+(d-region.body.r)/Math.max(1,reach-region.body.r),miss:true,part:'label'};
  return{score:Infinity,miss:true,part:'body'};
}

/** Chooses the target the pointer is actually aimed at, and keeps it there.
 *  Specific representations outrank the containers that hold them, so a large
 *  cluster can never swallow the atom drawn inside it. */
export function pickTarget(regions:HitRegion[],point:Point,previous='',touch=false){
  const tolerance=touch?TOUCH_TOLERANCE:MOUSE_TOLERANCE;
  let best:string='',bestScore=Infinity,part:'body'|'label'='body';
  const scores=new Map<string,number>(),parts=new Map<string,'body'|'label'>();
  for(const region of regions){
   const measured=measure(region,point,tolerance);
   const value=measured.score/(region.kind==='cluster'?1:1.35);
   scores.set(region.id,value);parts.set(region.id,measured.part);
   if(value<bestScore){bestScore=value;best=region.id;part=measured.part;}
  }
  if(!best)return{id:'',changed:previous!=='',part:'body' as const};
  // Intent stability: an aimed target is only released for a clearly better one.
  if(previous&&previous!==best&&scores.has(previous)&&bestScore>=scores.get(previous)!-HANDOVER)return{id:previous,changed:false,part:parts.get(previous)??'body'};
  return{id:best,changed:previous!==best,part};
}

export type IntentPhase='idle'|'hover'|'selected'|'focused'|'opened';
export interface Intent{phase:IntentPhase;hover:string;selected:string;focused:string;opened:string}

/** Selection follows a user action. Hover is a separate, reversible signal and
 *  never promotes itself; camera motion cannot move selection. */
export class IntentMachine{
  private state:Intent={phase:'idle',hover:'',selected:'',focused:'',opened:''};
  constructor(private notify:(intent:Intent)=>void){}
  get value(){return this.state;}
  private commit(next:Partial<Intent>){
   const merged={...this.state,...next};
   if(merged.phase===this.state.phase&&merged.hover===this.state.hover&&merged.selected===this.state.selected&&merged.focused===this.state.focused&&merged.opened===this.state.opened)return;
   this.state=merged;this.notify(merged);
  }
  hover(id:string){const active:IntentPhase=this.state.opened?'opened':this.state.focused?'focused':this.state.selected?'selected':'hover';const released:IntentPhase=this.state.selected?'selected':this.state.focused?'focused':this.state.opened?'opened':'idle';this.commit({hover:id,phase:id?active:released});}
  /** A click or tap is the only thing that selects. */
  select(id:string){this.commit({selected:id,focused:id,opened:'',phase:id?'selected':'idle'});}
  focus(id:string){this.commit({focused:id,selected:id||this.state.selected,phase:id?'focused':(this.state.selected?'selected':'idle')});}
  open(id:string){this.commit({selected:id,focused:id,opened:id,phase:'opened'});}
  close(){this.commit({opened:'',phase:this.state.focused?'focused':this.state.selected?'selected':'idle'});}
  release(){this.commit({selected:'',focused:'',opened:'',phase:'idle'});}
}

/** Keeps the same thing selected while the representation under it changes.
 *  A collapsed branch hands its identity to the branch root, never to a random child. */
export function resolveSelection(selected:string,nodes:GraphNode[]){
  if(!selected.startsWith('cluster:'))return selected;
  const root=selected.slice(8);
  return nodes.some(n=>n.id===root||n.members?.includes(root))?root:'';
}
