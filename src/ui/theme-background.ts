import type {Camera} from '../graph/model';
import type {Viewport} from '../graph/camera';
import {decorations,type BackgroundMode,type Pattern} from '../core/themes';

// One bounded, deterministic tile, shared across three depths. Camera and viewport
// changes never generate points or add decoration nodes.
export const BACKGROUND_TILE={width:1280,height:800};
export const BACKGROUND_DEPTHS=[.18,.4,.7] as const;
export function backgroundLayers(pattern:Pattern,density:number){
 const points=pattern==='none'?[]:decorations(pattern,BACKGROUND_TILE.width,BACKGROUND_TILE.height,density);
 return BACKGROUND_DEPTHS.map((depth,index)=>({depth,points:points.filter((_,i)=>i%BACKGROUND_DEPTHS.length===index)}));
}

export function backgroundTransform(mode:BackgroundMode|undefined,camera:Camera,view:Viewport,depth:number){
 const d=mode==='world'?1:mode==='parallax'?depth:0;
 // Blend the entire camera affine transform, including zoom about viewport
 // center. Applying only pan would make layers slide apart during a pinch.
 const scale=1+(camera.zoom-1)*d;
 // Keep a fixed world origin. Modulo wrapping a differently scaled tile shifts the
 // apparent layer origin during pinch; SVG patterns already repeat infinitely.
 return {scale,x:view.width/2+camera.x*d-BACKGROUND_TILE.width*scale/2,
  y:view.height/2+camera.y*d-BACKGROUND_TILE.height*scale/2};
}
