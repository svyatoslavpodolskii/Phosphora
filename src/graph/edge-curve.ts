/** Keep the trimmed endpoints ordered even while atom bodies overlap. */
export function edgeCurve(a:{x:number;y:number;radius:number},b:{x:number;y:number;radius:number}){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<.001)return null;
 const ux=dx/d,uy=dy/d,trimA=Math.min(a.radius,d*.45),trimB=Math.min(b.radius,d*.45);
 const ax=a.x+ux*trimA,ay=a.y+uy*trimA,bx=b.x-ux*trimB,by=b.y-uy*trimB;
 const bend=Math.min(14,(d-trimA-trimB)*.045);
 return {ax,ay,bx,by,cx:(ax+bx)/2-uy*bend,cy:(ay+by)/2+ux*bend};
}
