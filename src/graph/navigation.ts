import {MIN_ZOOM,MAX_ZOOM,type Camera} from './model';
export interface SpatialLocation{camera:Camera;selected:string;lens:string}
export function validLocation(value:unknown):value is SpatialLocation{
 const v=value as SpatialLocation;return Boolean(v&&typeof v.selected==='string'&&['all','now','archived'].includes(v.lens)&&v.camera&&[v.camera.x,v.camera.y,v.camera.zoom].every(Number.isFinite)&&v.camera.zoom>=MIN_ZOOM&&v.camera.zoom<=MAX_ZOOM);
}
/** Interpolate world centers and zoom separately: translation must not orbit the target. */
export function flightCamera(from:Camera,to:Camera,progress:number):Camera{
  const t=Math.max(0,Math.min(1,progress)),ease=t*t*(3-2*t),ax=-from.x/from.zoom,ay=-from.y/from.zoom,bx=-to.x/to.zoom,by=-to.y/to.zoom;
  const distance=Math.hypot(ax-bx,ay-by),travelZoom=Math.max(MIN_ZOOM,Math.min(from.zoom,to.zoom,900/Math.max(900,distance)));
  const logZoom=(1-ease)*Math.log(from.zoom)+ease*Math.log(to.zoom),dip=Math.sin(Math.PI*t)**2;
  const zoom=Math.exp(logZoom*(1-dip)+Math.log(travelZoom)*dip);
  return {x:-(ax+(bx-ax)*ease)*zoom,y:-(ay+(by-ay)*ease)*zoom,zoom};
}

/** Focus helps the camera only when the target is genuinely poorly placed. An atom
 *  that is already comfortably visible is left exactly where the user put it, so
 *  following the map never means fighting it. Returns null when nothing is needed. */
export function revealCamera(camera:Camera,point:{x:number;y:number},view:{width:number;height:number},desired:number):Camera|null{
  if(!(view.width>0&&view.height>0))return null;
  const zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Math.max(camera.zoom,desired))),margin=Math.min(150,view.width*.22);
  let x=camera.x,y=camera.y;
  const sx=view.width/2+x+point.x*zoom,sy=view.height/2+y+point.y*zoom;
  if(sx<margin)x+=(margin-sx);else if(sx>view.width-margin)x-=(sx-(view.width-margin));
  if(sy<margin)y+=(margin-sy);else if(sy>view.height-margin)y-=(sy-(view.height-margin));
  const moved=Math.abs(x-camera.x)+Math.abs(y-camera.y)<1&&Math.abs(zoom-camera.zoom)<.001;
  return moved?null:{x,y,zoom};
}
export class CameraFlight{
 private frame=0;
 cancel(){cancelAnimationFrame(this.frame);this.frame=0;}
 go(from:Camera,to:Camera,update:(camera:Camera)=>void,done:()=>void,reduced=false){
  this.cancel();if(reduced){update({...to});done();return;}
  const start=performance.now(),distance=Math.hypot(from.x/from.zoom-to.x/to.zoom,from.y/from.zoom-to.y/to.zoom),duration=Math.min(700,300+Math.sqrt(distance)*7);
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration);update(flightCamera(from,to,t));if(t<1)this.frame=requestAnimationFrame(tick);else{this.frame=0;done();}};
  this.frame=requestAnimationFrame(tick);
 }
}
