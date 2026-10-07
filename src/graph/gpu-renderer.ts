import {Container,Graphics,Sprite,Texture,WebGLRenderer} from 'pixi.js';
import type {Camera} from './model';
export interface GpuEdge{ax:number;ay:number;cx:number;cy:number;bx:number;by:number;width:number;color:string;alpha:number}
export interface GpuNode{id:string;x:number;y:number;left:number;top:number;width:number;height:number;signature:string;alpha:number;paint:(ctx:CanvasRenderingContext2D)=>void}
/** Retained GPU scene: positions/opacity update without rasterising text and
 * gradients again. GPU output sits beneath the existing gesture surface;
 * accessibility, hit testing and plugin APIs keep their original contract. */
export class GpuMapRenderer{
 constructor(private onchange:()=>void=()=>{}){}
 private renderer=new WebGLRenderer();private stage=new Container();private world=new Container();private lines=new Graphics();private field=new Container();
 private nodes=new Map<string,{sprite:Sprite;texture:Texture;signature:string;scale:number}>();private width=0;private height=0;private resolution=0;private edgesSignature='';
 private lost=false;private onlost=(event:Event)=>{event.preventDefault();this.lost=true;this.onchange();};private onrestored=()=>{this.lost=false;this.invalidate();this.onchange();};
 static async create(onchange:()=>void=()=>{}){const value=new GpuMapRenderer(onchange);try{await value.renderer.init({width:1,height:1,antialias:true,backgroundAlpha:0,clearBeforeRender:true,autoDensity:false,failIfMajorPerformanceCaveat:false});const gl=value.renderer.gl,info=gl.getExtension('WEBGL_debug_renderer_info');const device=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';if(/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(device))throw Error('Hardware WebGL unavailable');value.stage.eventMode='none';value.field.sortableChildren=true;value.stage.addChild(value.world);value.world.addChild(value.lines,value.field);value.canvas.addEventListener('webglcontextlost',value.onlost);value.canvas.addEventListener('webglcontextrestored',value.onrestored);return value;}catch(error){try{value.renderer.destroy();}catch{}throw error;}}
 get canvas(){return this.renderer.canvas as HTMLCanvasElement;}
 get available(){return !this.lost;}
 invalidate(){this.edgesSignature='';for(const n of this.nodes.values())n.signature='';}
 paint(width:number,height:number,resolution:number,camera:Camera,edges:GpuEdge[],nodes:GpuNode[]){
  if(this.lost)return false;
  let changed=width!==this.width||height!==this.height||resolution!==this.resolution||this.world.x!==width/2+camera.x||this.world.y!==height/2+camera.y||this.world.scale.x!==camera.zoom;
  if(width!==this.width||height!==this.height||resolution!==this.resolution){this.renderer.resize(width,height,resolution);this.width=width;this.height=height;this.resolution=resolution;}
  this.world.position.set(width/2+camera.x,height/2+camera.y);this.world.scale.set(camera.zoom);const edgesSignature=edges.map(e=>[e.ax,e.ay,e.cx,e.cy,e.bx,e.by,e.width,e.color,e.alpha].join(',')).join('|');
  if(edgesSignature!==this.edgesSignature){changed=true;this.edgesSignature=edgesSignature;this.lines.clear();
  // Stroke same-style curves as one GPU geometry batch.
  const batches=new Map<string,GpuEdge[]>();for(const e of edges){const key=[e.color,e.alpha,e.width].join('|');const batch=batches.get(key)||[];batch.push(e);batches.set(key,batch);}
  for(const batch of batches.values()){for(const e of batch)this.lines.moveTo(e.ax,e.ay).quadraticCurveTo(e.cx,e.cy,e.bx,e.by);const e=batch[0];this.lines.stroke({color:e.color,alpha:e.alpha,width:e.width});}
  }
  const used=new Set<string>();const scale=Math.max(.125,Math.min(4,2**Math.ceil(Math.log2(camera.zoom*resolution))));
  let order=0;for(const n of nodes){const signature=[n.signature,n.left,n.top,n.width,n.height].join('|');used.add(n.id);let cached=this.nodes.get(n.id);
   if(!cached||cached.signature!==signature||cached.scale!==scale){changed=true;
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(n.width*scale));canvas.height=Math.max(1,Math.ceil(n.height*scale));
    const ctx=canvas.getContext('2d')!;ctx.scale(scale,scale);ctx.translate(-n.x-n.left,-n.y-n.top);n.paint(ctx);
    const texture=Texture.from(canvas);
    if(cached){const old=cached.texture;cached.sprite.texture=texture;cached.texture=texture;cached.signature=signature;cached.scale=scale;old.destroy(true);}
    else{const sprite=new Sprite(texture);this.field.addChild(sprite);cached={sprite,texture,signature,scale};this.nodes.set(n.id,cached);}
   }
   if(cached.sprite.x!==n.x+n.left||cached.sprite.y!==n.y+n.top||cached.sprite.alpha!==n.alpha||cached.sprite.zIndex!==order)changed=true;
   cached.sprite.zIndex=order++;cached.sprite.position.set(n.x+n.left,n.y+n.top);cached.sprite.scale.set(1/scale);cached.sprite.alpha=n.alpha;
  }
  for(const [id,n] of this.nodes)if(!used.has(id)){changed=true;n.sprite.destroy();n.texture.destroy(true);this.nodes.delete(id);}
  if(changed)this.renderer.render(this.stage);return true;
 }
 destroy(){this.canvas.removeEventListener('webglcontextlost',this.onlost);this.canvas.removeEventListener('webglcontextrestored',this.onrestored);for(const n of this.nodes.values())n.texture.destroy(true);this.nodes.clear();this.stage.destroy({children:true});this.renderer.destroy();}
}
