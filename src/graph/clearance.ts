type Point={x:number;y:number};
type Footprint={halfWidth:number;top:number;bottom:number};
type Box={left:number;right:number;top:number;bottom:number};
/** Resolve remaining dense contacts at the nearest free footprint, preserving earlier anchors. */
export function clearFootprints(points:Map<string,Point>,footprints:Map<string,Footprint>,order=[...points.keys()],locked=new Set<string>()){
 const grid=new Map<string,Box[]>(),cell=240;
 const cells=(b:Box)=>{const keys:string[]=[];for(let x=Math.floor(b.left/cell);x<=Math.floor(b.right/cell);x++)for(let y=Math.floor(b.top/cell);y<=Math.floor(b.bottom/cell);y++)keys.push(x+','+y);return keys;};
 for(const id of order){const origin=points.get(id)!,f=footprints.get(id)!;for(let step=0;;step++){const angle=step*2.399963229728653,radius=20*Math.sqrt(step),p={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius},b={left:p.x-f.halfWidth-9,right:p.x+f.halfWidth+9,top:p.y-f.top-9,bottom:p.y+f.bottom+9},keys=cells(b);
   if(!locked.has(id)&&keys.some(key=>(grid.get(key)||[]).some(a=>b.left<a.right&&b.right>a.left&&b.top<a.bottom&&b.bottom>a.top)))continue;
   points.set(id,p);for(const key of keys){const list=grid.get(key)||[];list.push(b);grid.set(key,list);}break;
  }
 }
}
