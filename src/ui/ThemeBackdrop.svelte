<script lang="ts">
 import {onMount} from 'svelte';
 import {getAppliedTheme,decorations,decorationShape,type Theme} from '../core/themes';
 let theme=$state<Theme>(getAppliedTheme());let width=$state(1280),height=$state(800);let root:SVGSVGElement;let sleeping=$state(false);
 const points=$derived(theme.effects.pattern==='none'?[]:decorations(theme.effects.pattern,width,height,theme.effects.density));
 onMount(()=>{theme=getAppliedTheme();const update=(e:Event)=>theme=(e as CustomEvent<Theme>).detail;const visibility=()=>sleeping=document.hidden;const observer=new ResizeObserver(([e])=>{width=e.contentRect.width;height=e.contentRect.height;});observer.observe(root);window.addEventListener('phosphored-theme-change',update);document.addEventListener('visibilitychange',visibility);visibility();return()=>{observer.disconnect();window.removeEventListener('phosphored-theme-change',update);document.removeEventListener('visibilitychange',visibility);};});
</script>
<svg class="theme-backdrop" class:sleeping aria-hidden="true" data-pattern={theme.effects.pattern} bind:this={root} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
 <g opacity={theme.effects.strength}>{#each points as p,i}<g transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.size})`} opacity={p.opacity}><g class:flower={theme.effects.pattern==='daisies'} class:spark={theme.effects.pattern==='stars'||theme.effects.pattern==='night-sky'} class:firefly={theme.effects.pattern==='fireflies'} style:--phase={`${p.phase}s`} style:--duration={`${p.duration}s`}>{@html decorationShape(theme)}</g></g>{/each}</g>
</svg>
