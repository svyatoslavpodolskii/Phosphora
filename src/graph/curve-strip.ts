export interface Curve {ax:number;ay:number;cx:number;cy:number;bx:number;by:number}
const SEGMENTS=24;
/** Fixed topology: zoom only updates the strip width, never tessellates a path. */
export class CurveStrip {
 readonly vertices=new Float32Array((SEGMENTS+1)*4);
 readonly uvs=new Float32Array((SEGMENTS+1)*4).fill(.5);
 readonly indices=new Uint32Array(SEGMENTS*6);
 private centers=new Float64Array((SEGMENTS+1)*2);
 private normals=new Float64Array((SEGMENTS+1)*2);
 private curve?:Curve;private width=NaN;
 constructor(){for(let i=0;i<SEGMENTS;i++)this.indices.set([i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2],i*6);}
 update(c:Curve,width:number){
  const old=this.curve,rebuilt=!old||old.ax!==c.ax||old.ay!==c.ay||old.cx!==c.cx||old.cy!==c.cy||old.bx!==c.bx||old.by!==c.by;
  if(rebuilt){this.curve={ax:c.ax,ay:c.ay,cx:c.cx,cy:c.cy,bx:c.bx,by:c.by};for(let i=0;i<=SEGMENTS;i++){
   const t=i/SEGMENTS,u=1-t,x=u*u*c.ax+2*u*t*c.cx+t*t*c.bx,y=u*u*c.ay+2*u*t*c.cy+t*t*c.by;
   const dx=2*(u*(c.cx-c.ax)+t*(c.bx-c.cx)),dy=2*(u*(c.cy-c.ay)+t*(c.by-c.cy)),length=Math.hypot(dx,dy)||1;
   this.centers.set([x,y],i*2);this.normals.set([-dy/length,dx/length],i*2);
  }}
  if(!rebuilt&&width===this.width)return {updated:false,rebuilt:false};
  this.width=width;for(let i=0;i<=SEGMENTS;i++){const x=this.centers[i*2],y=this.centers[i*2+1],nx=this.normals[i*2]*width/2,ny=this.normals[i*2+1]*width/2,at=i*4;this.vertices[at]=x+nx;this.vertices[at+1]=y+ny;this.vertices[at+2]=x-nx;this.vertices[at+3]=y-ny;}
  return {updated:true,rebuilt};
 }
}
