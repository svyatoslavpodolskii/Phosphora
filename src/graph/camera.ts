import {MIN_ZOOM,MAX_ZOOM,type Camera} from './model';

export interface Point{x:number;y:number}
export interface Viewport{width:number;height:number}
/** A world point pinned to a screen point. Zoom is expressed relative to it. */
export interface Anchor{world:Point;screen:Point}

const TAU=.05,MAX_STEP=64;
const ZOOM_EPS=.0004,PAN_EPS=.12;
/** Smoothing is decided by how continuous the input is, not by a fixed constant.
 *  A wheel notch arrives alone and eases in over a few frames; a trackpad pinch
 *  arrives many times per frame and is performed at once. Nothing here depends on
 *  the device, only on the interval the hand actually produced. */
const NOTCH_SHARE=.2,STREAM_SHARE=.85,CONTINUOUS_MS=45,DISCRETE_MS=15,REFERENCE_FRAME=1000/60;
/** Hard perceptual ceiling: the world may not expand or slide faster than this per
 *  frame, whatever the input asked for. Ordinary gestures never reach it, so it
 *  adds no lag, but it guarantees no single frame can ever be a visible jump. */
const MAX_ZOOM_RATE=.13,MAX_PAN_RATE=420,COAST=70;

export const clampZoom=(zoom:number)=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom));

export const fromAnchor=(anchor:Anchor,zoom:number,view:Viewport):Camera=>({
  x:anchor.screen.x-view.width/2-anchor.world.x*zoom,
  y:anchor.screen.y-view.height/2-anchor.world.y*zoom,
  zoom});

export function screenToWorld(point:Point,camera:Camera,view:Viewport):Point{
  return {x:(point.x-view.width/2-camera.x)/camera.zoom,y:(point.y-view.height/2-camera.y)/camera.zoom};
}

/** Normalises mouse wheel, precision trackpad scroll, trackpad pinch and Safari
 *  gesture events into a single multiplicative zoom factor. */
export function wheelZoomFactor(event:{deltaY:number;deltaMode:number;ctrlKey:boolean},viewportHeight:number){
  const unit=event.deltaMode===1?16:event.deltaMode===2?Math.max(1,viewportHeight):1;
  const delta=event.deltaY*unit;
  // Browsers report a trackpad pinch as a ctrl-modified wheel with small pixel deltas.
  if(event.ctrlKey)return Math.exp(-Math.max(-1,Math.min(1,delta*.01)));
  return Math.exp(-Math.max(-400,Math.min(400,delta))*.0016);
}

/** Safari dispatches gesture events rather than ctrl-wheel for trackpad pinch. */
export function gestureZoomFactor(scale:number,previous:number){
  if(!(scale>0)||!(previous>0))return 1;
  return Math.exp(-Math.max(-.5,Math.min(.5,Math.log(scale/previous))*.9));
}

/** Owns the target camera. Input only writes intent here; the renderer consumes
 *  that intent at a stable per-frame rate and never more than the pending amount.
 *
 *  Smoothing the *input* rather than the *position* is what makes direct
 *  manipulation work: a continuous gesture is consumed at exactly the rate it
 *  arrives, so a fast scroll never falls behind and a slow one stays precise,
 *  while a single notch eases in and out instead of jumping. Movement is always
 *  a fraction of what is still outstanding, so the camera can never overshoot,
 *  can never accumulate lag, and comes to rest the moment the input stops. */
export class CameraRig{
  camera:Camera={x:0,y:0,zoom:1};
  private target:Camera={x:0,y:0,zoom:1};
  private pending={x:0,y:0,z:0};
  /** Smoothed interval between input events, in milliseconds. */
  private interval=Infinity;
  private lastEvent=0;
  private anchor:Anchor|null=null;
  /** True while two fingers are down: the focal point they hold must survive. */
  private pinching=false;
  private view:Viewport={width:1,height:1};
  private reduced=false;
  moving=false;
  private settled=true;
  private clock:()=>number;

  constructor(clock?:()=>number){this.clock=clock||(()=>performance.now());}

  resize(view:Viewport){this.view=view;}
  setReduced(reduced:boolean){this.reduced=reduced;}

  /** Immediate placement, used for restore, resize and reduced motion only. */
  set(camera:Camera){this.camera={...camera};this.target={...camera};this.pending.x=this.pending.y=this.pending.z=0;this.anchor=null;this.pinching=false;this.lastEvent=0;this.interval=Infinity;this.settled=true;this.moving=false;}

  get value(){return this.camera;}
  get anchored(){return this.anchor!==null;}
  get intended(){return this.target;}

  /** A two finger gesture asks for an absolute zoom, held to the point between the
   *  fingers. Like every other input it is only a request: the renderer consumes it
   *  at a stable rate, so raw touch jitter never reaches the world. The focal
   *  point is re-anchored on each move, which also carries the two finger pan. */
  pinchTo(screen:Point,zoom:number){
   if(this.anchor)this.anchor={...this.anchor,screen};
   else this.anchor={world:screenToWorld(screen,this.camera,this.view),screen};
   const next=clampZoom(zoom);
   this.event();this.pinching=true;
   this.pending.z+=Math.log(next)-Math.log(this.target.zoom);
   this.target=fromAnchor(this.anchor,next,this.view);
   this.wake();
  }
  /** The fingers left. Whatever they were holding is released. */
  endPinch(){this.pinching=false;this.anchor=null;}

  /** Establishes or reuses the anchor, then records the requested zoom. The world
   *  point under the pointer stays under the pointer for the whole gesture. */
  zoomAt(screen:Point,factor:number){
   this.pinching=false;
   if(this.anchor)this.anchor={...this.anchor,screen};
   else this.anchor={world:screenToWorld(screen,this.camera,this.view),screen};
   const zoom=clampZoom(this.target.zoom*factor);
   this.event();this.pending.z+=Math.log(zoom)-Math.log(this.target.zoom);
   this.target=fromAnchor(this.anchor,zoom,this.view);
   this.wake();
  }
  zoomStep(factor:number){
   const zoom=clampZoom(this.target.zoom*factor);
   this.retarget({...this.target,zoom});
  }
  panBy(dx:number,dy:number){this.anchor=null;this.pinching=false;this.event();this.pending.x+=dx;this.pending.y+=dy;this.target={...this.target,x:this.target.x+dx,y:this.target.y+dy};this.wake();}
  /** Keeps an active zoom anchor while the gesture's midpoint travels. */
  moveAnchor(dx:number,dy:number){
   if(!this.anchor)return;
   this.anchor={world:this.anchor.world,screen:{x:this.anchor.screen.x+dx,y:this.anchor.screen.y+dy}};
   this.event();this.pending.x+=dx;this.pending.y+=dy;
   this.target=fromAnchor(this.anchor,this.target.zoom,this.view);
   this.wake();
  }
  /** Sets an absolute destination. Used for focus corrections and fit views. */
  retarget(camera:Camera){
   this.anchor=null;this.pinching=false;this.event();
   this.pending.x+=camera.x-this.target.x;this.pending.y+=camera.y-this.target.y;this.pending.z+=Math.log(camera.zoom)-Math.log(this.target.zoom);
   this.target={...camera};this.wake();
  }
  /** Hands the remaining pan momentum to the camera so it coasts to rest. The
   *  distance is one smoothing window of travel, so a flick is delivered over the
   *  same few frames as the drag was, never as a single lurch. */
  release(velocity:Point){
   if(this.anchor)return;
   const x=Math.max(-MAX_PAN_RATE*8,Math.min(MAX_PAN_RATE*8,velocity.x*COAST)),y=Math.max(-MAX_PAN_RATE*8,Math.min(MAX_PAN_RATE*8,velocity.y*COAST));
   this.pending.x+=x;this.pending.y+=y;
   this.target={...this.target,x:this.target.x+x,y:this.target.y+y};
   this.wake();
  }
  /** Stops all motion where it stands. Used when the user grabs the canvas. */
  halt(){this.target={...this.camera};this.pending.x=this.pending.y=this.pending.z=0;this.anchor=null;this.pinching=false;this.settled=true;this.moving=false;}

  /** Records that the hand produced another event, and how long since the last one. */
  private event(){
   const now=this.clock(),gap=this.lastEvent?now-this.lastEvent:Infinity;
   this.lastEvent=now;
   this.interval=Number.isFinite(this.interval)?Math.min(gap,this.interval*.6+gap*.4):gap;
  }
    private wake(){if(this.reduced){this.camera=this.anchor?fromAnchor(this.anchor,this.target.zoom,this.view):{...this.target};this.settled=true;this.moving=false;return;}this.settled=false;this.moving=true;}

  step(dt:number):Camera{
   if(this.settled)return this.camera;
   // Smoothing is decided by how continuous the hand is, not by a fixed constant.
   // A wheel notch arrives alone and eases in; a trackpad pinch or a drag arrives
   // many times per frame and is performed almost at once. The exponent makes this
   // identical at 30, 60 and 144Hz, so a gesture always lands in the same place.
   const span=Number.isFinite(this.interval)?this.interval:Infinity;
   const continuity=Math.max(0,Math.min(1,(CONTINUOUS_MS-span)/(CONTINUOUS_MS-DISCRETE_MS)));
   const share=NOTCH_SHARE+(STREAM_SHARE-NOTCH_SHARE)*continuity;
   const frames=Math.max(.25,Math.max(0,Math.min(MAX_STEP,dt))/REFERENCE_FRAME);
   const alpha=1-Math.pow(1-share,frames),zoomCap=MAX_ZOOM_RATE*frames,panCap=MAX_PAN_RATE*frames;
   // Movement is a share of what is outstanding, capped by what the eye can follow.
   const move=(wanted:number,remaining:number,cap:number)=>{
    const bounded=Math.abs(wanted)<=Math.abs(remaining)?wanted:Math.sign(wanted)*Math.abs(remaining);
    return Math.abs(bounded)<=cap?bounded:Math.sign(bounded)*cap;
   };
   if(this.anchor){
    const gap=Math.log(this.target.zoom)-Math.log(this.camera.zoom);
    const take=move(alpha*this.pending.z,gap,zoomCap);
    this.pending.z-=take;
    this.camera=fromAnchor(this.anchor,Math.exp(Math.log(this.camera.zoom)+take),this.view);
    if(Math.abs(gap)<ZOOM_EPS&&Math.abs(this.pending.z)<ZOOM_EPS){
     this.camera=fromAnchor(this.anchor,this.target.zoom,this.view);this.pending.z=0;this.settled=true;this.moving=false;if(!this.pinching)this.anchor=null;
    }
    return this.camera;
   }
   const gapX=this.target.x-this.camera.x,gapY=this.target.y-this.camera.y,gapZ=Math.log(this.target.zoom)-Math.log(this.camera.zoom);
   const stepX=move(alpha*this.pending.x,gapX,panCap),stepY=move(alpha*this.pending.y,gapY,panCap),stepZ=move(alpha*this.pending.z,gapZ,zoomCap);
   this.pending.x-=stepX;this.pending.y-=stepY;this.pending.z-=stepZ;
   this.camera={x:this.camera.x+stepX,y:this.camera.y+stepY,zoom:Math.exp(Math.log(this.camera.zoom)+stepZ)};
   if(Math.hypot(gapX,gapY)<PAN_EPS&&Math.abs(gapZ)<ZOOM_EPS&&Math.abs(this.pending.z)<ZOOM_EPS){
    this.camera={...this.target};this.pending.x=this.pending.y=this.pending.z=0;this.settled=true;this.moving=false;
   }
   return this.camera;
  }
}
