<script lang="ts">
 import {onDestroy} from 'svelte';
 import type {FolderSummary} from '../graph/folders';
 import {FOLDER_COLORS} from '../plugins/folders';
 let {folders,selectionIds=[],activeId=$bindable(null),oncreate,onfocus,onremove,onadd,onupdate}:{
  folders:FolderSummary[];selectionIds?:readonly string[];activeId?:string|null;
  oncreate:(name:string,ids:readonly string[],color:string)=>Promise<string>;
  onfocus:(id:string|null)=>unknown|Promise<unknown>;
  onupdate:(id:string,name:string,color:string)=>Promise<void>;onremove:(id:string)=>Promise<void>;onadd:(id:string,ids:readonly string[])=>Promise<void>;
 }=$props();
 let creating=$state(false),name=$state(''),color=$state(FOLDER_COLORS[0]),ids=$state<string[]>([]),busy=$state(false),error=$state('');
 let input=$state<HTMLInputElement>();
 let collapsed=$state(false),context=$state<string|null>(null);let hold:ReturnType<typeof setTimeout>;let held=false;let pressPoint={x:0,y:0};onDestroy(()=>clearTimeout(hold));let rename=$state(''),tint=$state('#9bbef2');
 function showContext(id:string){const f=folders.find(f=>f.id===id);if(f){context=id;rename=f.name;tint=f.color;}}
 async function updateFolder(){if(!context||busy)return;busy=true;try{await onupdate(context,rename,tint);context=null;}catch(e){error=(e as Error).message;}finally{busy=false;}}

 async function action(remove=false){if(!context)return;busy=true;try{if(remove){await onremove(context);if(activeId===context)activeId=null;}else await onadd(context,selectionIds);context=null;}catch(e){error=(e as Error).message;}finally{busy=false;}}
 /** Host context-action callback: strip?.beginCreate(rawAtomIds). */
 export function beginCreate(selected:readonly string[]){
  if(busy)return;collapsed=false;ids=[...new Set(selected)];if(!ids.length)return;
  name='';color=FOLDER_COLORS[folders.length%FOLDER_COLORS.length];error='';creating=true;
 }
 $effect(()=>{if(creating)input?.focus();});
 async function create(event:SubmitEvent){event.preventDefault();if(busy)return;busy=true;error='';
  try{const id=await oncreate(name,ids,color);creating=false;await focus(id);}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function focus(id:string|null){try{await onfocus(id);activeId=id;error='';}catch(e){error=(e as Error).message;}}
</script>

{#if folders.length||creating||selectionIds.length>1}
<div class="folder-strip" class:collapsed aria-label="Папки">
 <button aria-label={collapsed?'Развернуть папки':'Свернуть папки'} aria-expanded={!collapsed} onclick={()=>{collapsed=!collapsed;if(collapsed){creating=false;context=null;}}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d={collapsed?'m9 12 3 3 3-3':'m9 15 3-3 3 3'}/></svg></button>
 {#if !collapsed}
 <div class="folder-tabs" role="group" aria-label="Области карты">
  <button class:chosen={activeId===null} aria-pressed={activeId===null} onclick={()=>focus(null)}>Все</button>
  {#each folders as folder (folder.id)}
   <button data-folder-id={folder.id} class:chosen={activeId===folder.id} aria-pressed={activeId===folder.id} title={`${folder.name}: ${folder.count}`} onpointerdown={e=>{pressPoint={x:e.clientX,y:e.clientY};held=false;hold=setTimeout(()=>{held=true;showContext(folder.id);},550);}} onpointermove={e=>{if(Math.hypot(e.clientX-pressPoint.x,e.clientY-pressPoint.y)>10)clearTimeout(hold);}} onpointerup={()=>clearTimeout(hold)} onpointercancel={()=>clearTimeout(hold)} onpointerleave={()=>clearTimeout(hold)} oncontextmenu={e=>{e.preventDefault();held=true;showContext(folder.id);}} onclick={()=>{if(!held)void focus(folder.id);held=false;}}>
    <i style:background={folder.color} aria-hidden="true"></i><span>{folder.name}</span><small>{folder.count}</small>
   </button>
  {/each}
 </div>
 {/if}
 {#if !collapsed&&selectionIds.length>1}<button class="create-folder" disabled={busy} onclick={()=>beginCreate(selectionIds)} title="Создать папку из выделенных заметок" aria-label="Создать папку из выделения">＋</button>{/if}
 {#if context}<div class="folder-actions"><input aria-label="Имя папки" bind:value={rename} maxlength="80"/><input aria-label="Цвет папки" type="color" bind:value={tint}/><button disabled={busy||!rename.trim()} onclick={updateFolder}>Готово</button>{#if selectionIds.length}<button disabled={busy} onclick={()=>action()}>Добавить выделение</button>{/if}<button disabled={busy} onclick={()=>action(true)}>Удалить папку</button><button onclick={()=>context=null}>Закрыть</button><small>Заметки останутся на карте</small></div>{/if}
 {#if creating}
  <form onsubmit={create}>
   <label class="name">Название папки<input bind:this={input} bind:value={name} maxlength="80" required placeholder="Работа, музыка…" disabled={busy}/></label>
   <label class="color">Цвет<input type="color" bind:value={color} disabled={busy}/></label>
   <span class="selection-count">Выбрано: {ids.length}</span>
   <button type="submit" disabled={busy||!name.trim()}>Создать</button>
   <button type="button" disabled={busy} onclick={()=>{creating=false;error='';}}>Отмена</button>
  </form>
 {/if}
 {#if error}<p role="alert">{error}</p>{/if}
</div>
{/if}

<style>
 .folder-strip{position:absolute;top:var(--folder-strip-top,70px);left:max(16px,env(safe-area-inset-left));z-index:4;display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:max-content;max-width:calc(100% - 32px);padding:5px;border:1px solid color-mix(in srgb,var(--theme-border),transparent 35%);border-radius:18px;background:color-mix(in srgb,var(--theme-surface),transparent 18%);backdrop-filter:blur(10px);color:var(--theme-text);font:inherit}
 .folder-tabs{display:flex;gap:3px;overflow-x:auto;min-width:0;flex:1;scrollbar-width:thin}.folder-tabs button{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 13px;white-space:nowrap;background:transparent;border:1px solid transparent;border-radius:12px}.folder-tabs button.chosen{background:color-mix(in srgb,var(--theme-text),transparent 91%);border-color:color-mix(in srgb,var(--theme-border),transparent 25%)}
 .folder-tabs span{overflow:hidden;text-overflow:ellipsis;max-width:180px}.folder-tabs i{width:7px;height:7px;border-radius:50%;flex-shrink:0}.folder-tabs small{font-size:11px;opacity:.65;font-variant-numeric:tabular-nums}.create-folder{background:transparent;border-color:transparent;font-size:12px;white-space:nowrap}
 form{display:flex;align-items:end;gap:8px;flex-wrap:wrap;width:100%;padding:10px;border-top:1px solid var(--theme-border)}label{display:flex;flex-direction:column;align-items:start;gap:5px;font-size:12px}.name{flex:1;min-width:150px}.name input{width:100%}.color input{padding:5px;width:44px;height:44px}.selection-count{font-size:12px;opacity:.7;align-self:center}p{flex-basis:100%;margin:0;padding:6px 10px;font-size:12px}
 button:focus-visible,input:focus-visible{outline:2px solid var(--theme-accent);outline-offset:2px}
 @media(max-width:650px){.folder-strip{top:var(--folder-strip-top,72px);max-width:calc(100% - 20px)}.create-folder{padding-inline:8px}.folder-tabs span{max-width:110px}}
.folder-actions{flex-basis:100%;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px}.folder-actions small{width:100%;color:var(--theme-muted)}
.folder-actions input:not([type=color]){flex:1;min-width:130px;width:140px}.folder-actions input[type=color]{width:44px;padding:5px}
</style>
