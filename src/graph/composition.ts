import {footprint} from './footprint';
import type {Atom} from '../core/model';
type Point={x:number;y:number};
interface Box {left:number;right:number;top:number;bottom:number}
/** Pack painted footprints, rather than rectangular rooms around components.
 * Small islands can occupy the negative space between branches. */
export function composeIslands(points:Map<string,Point>,islands:{ids:string[];width:number;height:number}[],atoms:Atom[],footprints?:Map<string,ReturnType<typeof footprint>>){
 const byId=new Map(atoms.map(a=>[a.id,a])),cell=240,grid=new Map<string,Box[]>();
 const cells=(b:Box)=>{const keys:string[]=[];for(let x=Math.floor(b.left/cell);x<=Math.floor(b.right/cell);x++)for(let y=Math.floor(b.top/cell);y<=Math.floor(b.bottom/cell);y++)keys.push(x+','+y);return keys;};
 const intersects=(a:Box,b:Box)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 let bounds:Box|undefined;
 for(const island of [...islands].sort((a,b)=>b.ids.length-a.ids.length||b.width*b.height-a.width*a.height)){
  const local=island.ids.map(id=>{const a=byId.get(id)!,p=points.get(id)!,f=footprints?.get(id)||footprint(a.title,a.appearance.size_override||38,Boolean(a.content));return{id,x:p.x-island.width/2,y:p.y-island.height/2,f};});
  let seed=0;for(const c of island.ids[0])seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;const phase=seed/4294967296*Math.PI*2;
  let offset:Point={x:0,y:0},boxes:Box[]=[];let best:{offset:Point;boxes:Box[];extent:Box;score:number}|undefined,firstValid=-1,valid=0;
  for(let step=0;;step++){
   const angle=phase+step*2.399963229728653,radius=76*Math.sqrt(step);offset={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
   boxes=local.map(p=>({left:p.x+offset.x-p.f.halfWidth-20,right:p.x+offset.x+p.f.halfWidth+20,top:p.y+offset.y-p.f.top-20,bottom:p.y+offset.y+p.f.bottom+20}));
   if(boxes.every(box=>cells(box).every(key=>!(grid.get(key)||[]).some(other=>intersects(box,other))))){const extent={left:Math.min(bounds?.left??Infinity,...boxes.map(b=>b.left)),right:Math.max(bounds?.right??-Infinity,...boxes.map(b=>b.right)),top:Math.min(bounds?.top??Infinity,...boxes.map(b=>b.top)),bottom:Math.max(bounds?.bottom??-Infinity,...boxes.map(b=>b.bottom))};const w=extent.right-extent.left,h=extent.bottom-extent.top,score=Math.max(w,h)+.15*(w+h);if(!best||score<best.score)best={offset,boxes,extent,score};if(firstValid<0)firstValid=step;valid++;if(!bounds||island.ids.length===1||valid>=16)break;}if(firstValid>=0&&step-firstValid>512)break;
  }
  offset=best!.offset;boxes=best!.boxes;bounds=best!.extent;
  local.forEach(p=>points.set(p.id,{x:p.x+offset.x,y:p.y+offset.y}));
  for(const box of boxes)for(const key of cells(box)){const list=grid.get(key)||[];list.push(box);grid.set(key,list);}
 }
}
