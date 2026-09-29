<script lang="ts">
 import {surface as transientSurface} from './surfaces';
 import {onMount,tick} from 'svelte';
 import type {PluginView} from '../plugins/api';
 import {sanitizeHTML} from './markdown';
 let {view,onclose}:{view:PluginView;onclose:()=>void}=$props();
 let html=$state(''),busy=$state(false),error=$state('');let surface:HTMLDivElement;let dialog:HTMLDivElement;let alive=true;
 async function refresh(){const result=await view.render();if(alive)html=sanitizeHTML(result);}
 async function action(event:MouseEvent|KeyboardEvent){
  const target=event.target as HTMLElement;
  const button=target.closest<HTMLButtonElement>('button[data-action]');
  if(!button||!surface.contains(button)||button.disabled||busy||!view.onAction)return;
  event.preventDefault();const values:Record<string,string>={};
  surface.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input[data-field],select[data-field],textarea[data-field]').forEach(input=>{values[input.dataset.field!]=input.value;});
  const key=button.dataset.action!;busy=true;error='';try{await view.onAction(key,values);await refresh();}catch(e){error=(e as Error).message;}finally{busy=false;await tick();if(alive){const next=[...surface.querySelectorAll<HTMLButtonElement>('button[data-action]')].find(b=>b.dataset.action===key);(key==='add'?surface.querySelector<HTMLInputElement>('input[data-field="title"]'):next)?.focus();}}
 }
 function keyboard(e:KeyboardEvent){if(e.key==='Escape'){e.stopPropagation();onclose();}if(e.key==='Tab'){const els=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')].filter(el=>el.getClientRects().length);if(e.shiftKey&&(document.activeElement===els[0]||document.activeElement===dialog)){e.preventDefault();els.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}}if(e.key==='Enter'&&e.target instanceof HTMLInputElement){const add=surface.querySelector<HTMLButtonElement>('button[data-action="add"]');if(add){e.preventDefault();add.click();}}}
 onMount(()=>{const previous=document.activeElement as HTMLElement;dialog.focus();refresh().catch(e=>error=e.message);let day=new Date().toLocaleDateString('sv-SE');const timer=setInterval(()=>{const next=new Date().toLocaleDateString('sv-SE');if(next!==day&&!busy){day=next;refresh().catch(e=>error=e.message);}},30000);return()=>{alive=false;clearInterval(timer);previous?.focus();};});
</script>
<div class="scrim" use:transientSurface={{close:onclose}}><div bind:this={dialog} class="editor plugin-view" role="dialog" aria-modal="true" aria-label={view.name} tabindex="-1" onkeydown={keyboard}>
 <div class="plugin-heading"><h2>{view.name}</h2><button onclick={onclose}>Закрыть</button></div>
 {#if error}<p role="alert">{error}</p>{/if}
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <div bind:this={surface} data-plugin-surface={view.id.split(':')[0]} aria-busy={busy} onclick={action}><fieldset disabled={busy}>{@html html}</fieldset></div>
</div></div>
<style>
 .plugin-view{width:min(940px,94vw);max-width:940px}.plugin-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.plugin-heading h2{font-size:1.25rem;margin:0}fieldset{border:0;padding:0;margin:0;min-width:0}
 .plugin-view :global(.task-toolbar),.plugin-view :global(.task-add),.plugin-view :global(.task-row){display:flex;gap:.6rem;align-items:center;margin:.7rem 0;flex-wrap:wrap}
 .plugin-view :global(.task-row){padding:.7rem;border:1px solid var(--theme-border);border-radius:14px}
 .plugin-view :global(.task-title){flex:1;min-width:100px;overflow-wrap:anywhere}
 .plugin-view :global(.task-add input){flex:1;min-width:140px}
 .plugin-view :global(.task-board){display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
 .plugin-view :global(.task-column){min-width:0;padding:10px;border:1px solid var(--theme-border);border-radius:16px}
 .plugin-view :global(.task-bars){display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:5px;padding:12px 0}
 .plugin-view :global(.task-bar){text-align:center;min-width:0;font-size:11px;color:var(--theme-muted)}
 .plugin-view :global(.task-bar meter){display:block;writing-mode:vertical-lr;direction:rtl;width:100%;max-width:22px;margin:auto;height:90px;accent-color:var(--theme-accent)}
 .plugin-view :global(meter::-webkit-meter-bar){background:var(--theme-surfaceAlt);border:1px solid var(--theme-border);border-radius:6px}
 .plugin-view :global(meter::-webkit-meter-optimum-value){background:var(--theme-accent);border-radius:5px}
 .plugin-view :global(meter::-moz-meter-bar){background:var(--theme-accent)}
 .plugin-view :global(.task-note){color:var(--theme-muted);font-size:.9rem}
 @media(max-width:640px){.plugin-view :global(.task-board){grid-template-columns:1fr}.plugin-view :global(.task-bar){font-size:9px}}
</style>
