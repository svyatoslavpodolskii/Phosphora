import type {PhysicsInput} from '../../graph/physics';

/** Soft spatial envelopes, calculated from occupied area rather than node count.
 * Targets only apply to untouched free bodies: pins, boundaries and manual placement win.
 * No saved coordinates or topology are rewritten. */
export function cohesiveInput(input:PhysicsInput,compact:boolean):PhysicsInput{
 if(input.nodes.length<2)return input;
 const byId=new Map(input.nodes.map(n=>[n.id,n])),parent=new Map(input.nodes.map(n=>[n.id,n.id]));
 const root=(id:string):string=>{let p=id;while(parent.get(p)!==p)p=parent.get(p)!;while(id!==p){const next=parent.get(id)!;parent.set(id,p);id=next;}return p;};
 for(const link of input.links)if(byId.has(link.from)&&byId.has(link.to))parent.set(root(link.from),root(link.to));
 type Cloud={x:number;y:number;count:number;area:number};
 const clouds=new Map<string,Cloud>(),all:Cloud={x:0,y:0,count:0,area:0};
 for(const n of input.nodes){const id=root(n.id),cloud=clouds.get(id)||{x:0,y:0,count:0,area:0};const area=Math.max(n.radius*2,n.halfWidth? n.halfWidth*2:0)*Math.max(n.radius*2,(n.top||0)+(n.bottom||0));for(const c of [cloud,all]){c.x+=n.x;c.y+=n.y;c.count++;c.area+=area;}clouds.set(id,cloud);}
 for(const c of [...clouds.values(),all]){c.x/=c.count;c.y/=c.count;}
 const envelope=(n:{x:number;y:number},c:Cloud,spacing:number)=>{const dx=n.x-c.x,dy=n.y-c.y,d=Math.hypot(dx,dy),radius=Math.max(100,Math.sqrt(c.area/Math.PI)*spacing);const excess=Math.max(0,d-radius);return d?{x:-dx/d*excess,y:-dy/d*excess}:{x:0,y:0};};
 return {...input,nodes:input.nodes.map(n=>{
  if(n.pinned||n.dragged||n.boundary||n.resistance>0||n.target)return n;
  const cloud=clouds.get(root(n.id))!,local=cloud.count>1?envelope(n,cloud,compact?1.15:1.7):{x:0,y:0},global=envelope(n,all,compact?2:2.8);
  const dx=local.x+global.x*.45,dy=local.y+global.y*.45;
  return Math.hypot(dx,dy)>1?{...n,target:{x:n.x+dx,y:n.y+dy}}:n;
 })};
}
