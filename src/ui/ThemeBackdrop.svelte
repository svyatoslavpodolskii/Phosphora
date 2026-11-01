<script lang="ts">
 import {onMount} from 'svelte';
 import {getAppliedTheme,decorationShape,type Theme} from '../core/themes';
 import type {Camera} from '../graph/model';
 import type {Viewport} from '../graph/camera';
 import {BACKGROUND_TILE,backgroundLayers,backgroundTransform} from './theme-background';
 let {camera={x:0,y:0,zoom:1},viewport}:{camera?:Camera;viewport?:Viewport}=$props();
 const id=$props.id();
 let theme=$state<Theme>(getAppliedTheme());let width=$state(1280),height=$state(800);let root:SVGSVGElement;let sleeping=$state(false),reduced=$state(false);
 const view=$derived(viewport??{width,height});
 const mode=$derived(reduced?'static':theme.effects.mode??'static');
 const layers=$derived(backgroundLayers(theme.effects.pattern,theme.effects.density));
 const shape=$derived(decorationShape(theme));
 onMount(()=>{
  theme=getAppliedTheme();
  const update=(e:Event)=>theme=(e as CustomEvent<Theme>).detail;
  const visibility=()=>sleeping=document.hidden;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>reduced=media.matches;
  const observer=new ResizeObserver(([e])=>{width=e.contentRect.width;height=e.contentRect.height;});
  observer.observe(root);window.addEventListener('phosphora-theme-change',update);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);visibility();motion();
  return()=>{observer.disconnect();window.removeEventListener('phosphora-theme-change',update);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);};
 });
</script>
<svg class="theme-backdrop" class:sleeping aria-hidden="true" data-pattern={theme.effects.pattern} data-mode={mode} bind:this={root} viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="none">
 <defs>
  {#each layers as layer,i}
   {@const transform=backgroundTransform(mode,camera,view,layer.depth)}
   <pattern id={`${id}-layer-${i}`} width={BACKGROUND_TILE.width} height={BACKGROUND_TILE.height} patternUnits="userSpaceOnUse" patternTransform={`matrix(${transform.scale} 0 0 ${transform.scale} ${transform.x} ${transform.y})`}>
    {#each layer.points as p}
     <g transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.size})`} opacity={p.opacity}>
      <g class:flower={theme.effects.pattern==='daisies'} class:spark={theme.effects.pattern==='stars'||theme.effects.pattern==='night-sky'} class:firefly={theme.effects.pattern==='fireflies'} style:--phase={`${p.phase}s`} style:--duration={`${p.duration}s`}>{@html shape}</g>
     </g>
    {/each}
   </pattern>
  {/each}
 </defs>
 <g opacity={theme.effects.strength}>{#each layers as _,i}<rect width="100%" height="100%" fill={`url(#${id}-layer-${i})`}/>{/each}</g>
</svg>

<style>
 /* Low-amplitude twinkle; global motion and hidden-tab rules still apply. */
 .theme-backdrop :global(.spark){animation-name:subtle-twinkle}
 @keyframes subtle-twinkle{0%,100%{opacity:.72}45%{opacity:1}72%{opacity:.84}}
</style>
