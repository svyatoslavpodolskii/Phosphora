import type {Camera,GraphNode} from './model';
import {visualFootprint} from './footprint';
type Placement='right'|'left'|'below'|'above';
export interface Preview {id:string;content:string;x:number;y:number;width:number;height:number;opacity:number;placement:Placement}
interface Box {x:number;y:number;width:number;height:number}
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.width+8&&a.x+a.width+8>b.x&&a.y<b.y+b.height+8&&a.y+a.height+8>b.y;
/** Screen-space detail never changes the saved spatial world or wakes physics. */
export function contentPreviews(nodes:(GraphNode&{opacity?:number})[],camera:Camera,width:number,height:number,selected:string,heights=new Map<string,number>(),previous:Preview[]=[]):Preview[]{
 const detail=Math.max(0,Math.min(1,(camera.zoom-1.35)/1.35));if(!detail)return [];
 const screen=(n:GraphNode)=>({x:width/2+camera.x+n.x*camera.zoom,y:height/2+camera.y+n.y*camera.zoom});
 const local=nodes.filter(n=>{const p=screen(n);return p.x>-400&&p.x<width+400&&p.y>-400&&p.y<height+400;});
 const obstacles=local.map(n=>{const p=screen(n),f=visualFootprint(n.label,n.radius,camera.zoom,width,n.id===selected||camera.zoom>1.2?n.state:'normal');return {id:n.id,x:p.x-f.halfWidth*camera.zoom,y:p.y-f.top*camera.zoom,width:f.halfWidth*2*camera.zoom,height:(f.top+f.bottom)*camera.zoom};});
 const candidates=local.filter(n=>!n.members&&n.content?.trim()&&(n.attention??1)>.5&&(n.opacity??1)>.5).sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||Math.hypot(screen(a).x-width/2,screen(a).y-height/2)-Math.hypot(screen(b).x-width/2,screen(b).y-height/2));
 const result:Preview[]=[];const panelWidth=Math.min(260,width-32),heightBudget=36+Math.max(0,detail-.15)/.85*172;
 for(const node of candidates){if(result.length>=3)break;const p=screen(node);if(p.x<0||p.x>width||p.y<65||p.y>height-65)continue;
  const own=obstacles.find(o=>o.id===node.id)!;
  const panelHeight=Math.min(heightBudget,heights.get(node.id)??heightBudget);
  const positions:({placement:Placement}&Pick<Box,'x'|'y'>)[]=[{placement:'right',x:own.x+own.width+12,y:p.y-18},{placement:'left',x:own.x-panelWidth-12,y:p.y-18},{placement:'below',x:p.x-panelWidth/2,y:own.y+own.height+12},{placement:'above',x:p.x-panelWidth/2,y:own.y-panelHeight-12}];
  // Keep a valid side across camera movement and measured-height updates. A newly
  // available preferred slot must not pull readable content across the atom.
  const prior=previous.find(preview=>preview.id===node.id)?.placement;
  positions.sort((a,b)=>Number(b.placement===prior)-Number(a.placement===prior));
  const box=positions.map(p=>({...p,width:panelWidth,height:panelHeight})).find(box=>box.x>=16&&box.x+box.width<=width-16&&box.y>=65&&box.y+box.height<=height-65&&!obstacles.some(o=>overlaps(box,o))&&!result.some(o=>overlaps(box,o)));
  if(box)result.push({id:node.id,content:node.content!,...box,opacity:Math.min(1,detail*5)*(node.opacity??1)*(node.attention??1)});
 }
 return result;
}
