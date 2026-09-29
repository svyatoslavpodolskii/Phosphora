import {anchorLayout} from '../../graph/anchors';
import {graphFootprints} from '../../graph/geometry';
import {clearFootprints} from '../../graph/clearance';
﻿import {branchingLayout,structure} from '../../graph/structure';
import {composeIslands} from '../../graph/composition';
import {footprint} from '../../graph/footprint';
import type {StructuralInput,StructuralOutput} from '../../graph/providers';
type Point={x:number;y:number};
export type DynamicsKind='branch'|'molecule'|'compact';

function separate(points:Map<string,Point>,boxes:Map<string,ReturnType<typeof footprint>>,passes:number){
 const ids=[...points.keys()].sort(),cell=240;
 for(let pass=0;pass<passes;pass++){const grid=new Map<string,string[]>();for(const id of ids){const p=points.get(id)!,key=Math.floor(p.x/cell)+','+Math.floor(p.y/cell);const list=grid.get(key)||[];list.push(id);grid.set(key,list);}let overlap=0;
  for(const id of ids){const a=points.get(id)!,fa=boxes.get(id)!,gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);for(let x=gx-2;x<=gx+2;x++)for(let y=gy-2;y<=gy+2;y++)for(const other of grid.get(x+','+y)||[]){if(id>=other)continue;const b=points.get(other)!,fb=boxes.get(other)!,dx=b.x-a.x,dy=b.y-a.y,ox=fa.halfWidth+fb.halfWidth+18-Math.abs(dx),oy=Math.min(a.y+fa.bottom,b.y+fb.bottom)-Math.max(a.y-fa.top,b.y-fb.top)+18;if(ox<=0||oy<=0)continue;overlap++;if(ox<oy){const d=Math.min(18,ox/2+.05)*(dx>=0?1:-1);a.x-=d;b.x+=d;}else{const d=Math.min(18,oy/2+.05)*(dy>=0?1:-1);a.y-=d;b.y+=d;}}}
  if(!overlap)break;
 }
}
export function arrangeDynamics(kind:DynamicsKind,{data,settings,intent,locked}:StructuralInput):StructuralOutput{
 if(intent==='resume')return{positions:data.atoms.map(a=>({id:a.id,x:a.x,y:a.y})),skeleton:[...structure(data).edges]};
 const seeded=branchingLayout(data,'calm',settings.distance),points=seeded.points,tree=seeded.tree;
 const finish=()=>{for(const a of data.atoms){if(!a.spatial.resistance||a.pinned)continue;const p=points.get(a.id)!;p.x=a.x*.88+p.x*.12;p.y=a.y*.88+p.y*.12;}const anchored=anchorLayout(data,points,new Set(locked||data.atoms.filter(a=>a.pinned).map(a=>a.id)));return{positions:[...anchored].map(([id,p])=>({id,...p})),skeleton:[...tree.edges]};};
 if(kind==='branch'){const boxes=graphFootprints(data);for(const root of tree.roots){const ids=tree.descendants(root),local=new Map(ids.map(id=>[id,points.get(id)!]));const bonds=data.links.filter(l=>local.has(l.from)&&local.has(l.to));for(let pass=0;pass<48;pass++){for(const l of bonds){const a=local.get(l.from)!,b=local.get(l.to)!,dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));const rest=Math.max(settings.distance,boxes.get(l.from)!.halfWidth+boxes.get(l.to)!.halfWidth+42),t=Math.max(0,d-rest)/d*(tree.edges.has(l.id)?.012:.003);a.x+=dx*t;a.y+=dy*t;b.x-=dx*t;b.y-=dy*t;}separate(local,boxes,1);}const order=ids.sort((a,b)=>tree.size.get(b)!-tree.size.get(a)!);clearFootprints(local,boxes,order);for(const [id,p] of local)points.set(id,p);}clearFootprints(points,boxes,[...points.keys()]);return finish();}
 const boxes=graphFootprints(data);
 for(const p of points.values()){p.x*=kind==='compact'?.48:.7;p.y*=kind==='compact'?.48:.7;}
 const allPoints=points;for(const root of tree.roots){const localIds=tree.descendants(root),points=new Map(localIds.map(id=>[id,allPoints.get(id)!]));
 if(kind==='compact'){
  // Pack leaves around their own branch hub, retaining a quotient structure of hubs.
  for(const [id,children] of tree.children){if(!points.has(id))continue;const leaves=children.filter(k=>!tree.children.get(k)!.length),p=points.get(id)!;leaves.forEach((child,i)=>{const angle=i*2.3999632297,radius=settings.distance*Math.sqrt(i+1)*.8;points.set(child,{x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius});});}
 }else{
  // All real bonds participate in stress relaxation; cycles shape the molecule.
  const edges=data.links.filter(l=>points.has(l.from)&&points.has(l.to)),degree=new Map<string,number>();for(const l of edges){degree.set(l.from,(degree.get(l.from)||0)+1);degree.set(l.to,(degree.get(l.to)||0)+1);}
  for(let pass=0;pass<180;pass++){const force=new Map([...points.keys()].map(id=>[id,{x:0,y:0}]));for(const l of edges){const a=points.get(l.from)!,b=points.get(l.to)!,dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),rest=settings.distance*1.35,scale=Math.max(-5,Math.min(5,(d-rest)*.025))/d;force.get(l.from)!.x+=dx*scale;force.get(l.from)!.y+=dy*scale;force.get(l.to)!.x-=dx*scale;force.get(l.to)!.y-=dy*scale;}
   for(const [id,f] of force){const p=points.get(id)!,scale=1/Math.sqrt(Math.max(1,degree.get(id)||1));p.x+=f.x*scale;p.y+=f.y*scale;}separate(points,boxes,1);
  }
 }
 separate(points,boxes,100);const order=data.atoms.filter(a=>points.has(a.id)).sort((a,b)=>(tree.children.get(b.id)!.length+b.importance*2)-(tree.children.get(a.id)!.length+a.importance*2)||a.id.localeCompare(b.id)).map(a=>a.id);clearFootprints(points,boxes,order);for(const [id,p] of points)allPoints.set(id,p);
 }
 const islands=tree.roots.map(root=>{const ids=tree.descendants(root),xs=ids.map(id=>points.get(id)!.x),ys=ids.map(id=>points.get(id)!.y),left=Math.min(...xs)-110,top=Math.min(...ys)-90;for(const id of ids){const p=points.get(id)!;p.x-=left;p.y-=top;}return{ids,width:Math.max(...xs)-left+110,height:Math.max(...ys)-top+110};});
 composeIslands(points,islands,data.atoms,boxes);return finish();
}

