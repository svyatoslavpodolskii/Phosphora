/** Cached canvas geometry and paint for the per-node decorations.
 *
 *  Drawing 500 nodes meant building 500 radial gradients, allocating 500 paths
 *  and asking the text stack to shape and raster 500 emoji glyphs on every frame.
 *  Measured on the 500 atom drag, the decorations were ~2.0s of the 2.3s spent
 *  outside JavaScript. Of that, the gradient and icon raster are inherent to the
 *  look, but *rebuilding* the objects each frame is not: the geometry depends
 *  only on the atom's own shape and size, and the gradient only on its colour.
 *  So the gradient and the path are built once and reused, which removes the
 *  per-frame allocation and colour parsing without changing a pixel. */
const SS=2;
const gradients=new Map<string,CanvasGradient>();
const shapes=new Map<string,{path:Path2D;radius:number}>();
let scratch:OffscreenCanvasRenderingContext2D|null|undefined;

/** A context only used to mint gradients; the result is reused on the real one. */
function painter(){
  if(scratch===undefined){
    const canvas=typeof OffscreenCanvas==='undefined'?null:new OffscreenCanvas(1,1);
    scratch=canvas?canvas.getContext('2d'):null;
  }
  return scratch;
}

export interface NodeShape{path:Path2D;radius:number}
export function nodeShape(kind:string,radius:number):NodeShape{
  const key=kind+'|'+radius;
  const known=shapes.get(key);
  if(known)return known;
  const path=new Path2D();
  if(kind==='square')path.roundRect(-radius,-radius,radius*2,radius*2,10);
  else if(kind==='diamond'){path.moveTo(0,-radius*1.2);path.lineTo(radius*1.2,0);path.lineTo(0,radius*1.2);path.lineTo(-radius*1.2,0);path.closePath();}
  else path.arc(0,0,radius,0,Math.PI*2);
  if(shapes.size>900)shapes.clear();
  const result={path,radius};
  shapes.set(key,result);
  return result;
}

/** The soft body highlight. Same stops, same geometry, built once per colour. */
export function bodyGradient(color:string,radius:number){
  const key=color+'|'+radius;
  const known=gradients.get(key);
  if(known)return known;
  const ctx=painter();
  if(!ctx)return null;
  const fill=ctx.createRadialGradient(-radius*.3,-radius*.4,0,0,0,radius*1.5);
  fill.addColorStop(0,color+'30');fill.addColorStop(1,color+'08');
  if(gradients.size>600)gradients.clear();
  gradients.set(key,fill);
  return fill;
}

/** A colour emoji is the most expensive thing asked of the text stack, and at
 *  small apparent sizes it is not legible anyway. Below this the node reads as a
 *  shape with a title beside it, so the glyph is simply not drawn. */
export const ICON_MIN_PX=13;
export function iconLegible(radius:number,zoom:number){return radius*zoom>=ICON_MIN_PX;}

/** Below this the soft highlight is smaller than a pixel or two of contrast, so
 *  a flat wash is indistinguishable from it and costs a fraction of the raster. */
export const SOFT_MIN_PX=22;
export function softHighlightVisible(radius:number,zoom:number){return radius*zoom>=SOFT_MIN_PX;}

/** How many bodies may carry the soft highlight.

/** How much of the screen the centre glyphs may occupy.
 *
 *  Glyphs are sized in world units, so zooming in multiplies their area. At 500
 *  visible atoms the icons were on their own covering most of the viewport: a
 *  hairball to look at and the single largest thing the raster had to do. The
 *  glyphs that survive are the ones the map already ranks first - selected,
 *  hovered, a branch, a landmark, then by attention - so what is dropped is the
 *  decoration nobody could read anyway, and the labels stay. */
export const ICON_AREA_SHARE=.12;
export function iconBudget(zoom:number,view:{width:number;height:number}){
  const glyph=(22*zoom)**2;
  if(!(glyph>0))return 0;
  return Math.max(8,Math.floor(view.width*view.height*ICON_AREA_SHARE/glyph));
}

/** How many bodies may carry the soft highlight.
 *
 *  This is the single most expensive thing the map draws. A radial gradient is
 *  evaluated per pixel, the bodies are large, and they are translucent, so the
 *  cost grows with the square of the zoom: at 500 atoms and zoom 3 the same
 *  highlight that reads as a gentle sheen on one node was 1.7s of a 2.0s frame.
 *  A flat wash is indistinguishable at these sizes, so the sheen is spent on
 *  the nodes it is actually for - what is selected, hovered or held, and the
 *  branch in focus - in the order the map already ranks them, and the rest of
 *  the field is washed. Nothing about the world changes; only its finish does. */
export const SOFT_BUDGET=24;

const glyphs=new Map<string,HTMLCanvasElement>();
/** The centre glyph, rasterised once.
 *
 *  A colour emoji is the most expensive thing the text stack is ever asked for:
 *  each one is shaped, hinted and rasterised from scratch, every time it is
 *  drawn. Once the body wash is bounded this is what is left, so the glyph is
 *  baked into a small sprite and stamped. Same pixels, once instead of per frame. */
export function iconSprite(icon:string,ink:string,size:number){
  const key=[icon,ink,size].join('|');
  const known=glyphs.get(key);
  if(known)return known;
  const box=Math.ceil(size),span=box*2;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=span*SS;
  const ctx=canvas.getContext('2d')!;
  ctx.scale(SS,SS);
  ctx.translate(box,box);
  ctx.fillStyle=ink;ctx.font=`${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(icon,0,0);
  if(glyphs.size>300)glyphs.clear();
  glyphs.set(key,canvas);
  return canvas;
}

export function clearSprites(){gradients.clear();shapes.clear();glyphs.clear();}
