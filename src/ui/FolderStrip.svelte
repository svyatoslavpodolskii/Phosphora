<script lang="ts">
 import type {FolderSummary} from '../graph/folders';
 import {FOLDER_COLORS} from '../plugins/folders';
 let {folders,selectionIds=[],activeId=$bindable(null),oncreate,onfocus}:{
  folders:FolderSummary[];selectionIds?:readonly string[];activeId?:string|null;
  oncreate:(name:string,ids:readonly string[],color:string)=>Promise<string>;
  onfocus:(id:string|null)=>unknown|Promise<unknown>;
 }=$props();
 let creating=$state(false),name=$state(''),color=$state(FOLDER_COLORS[0]),ids=$state<string[]>([]),busy=$state(false),error=$state('');
 let input=$state<HTMLInputElement>();
 /** Host context-action callback: strip?.beginCreate(rawAtomIds). */
 export function beginCreate(selected:readonly string[]){
  if(busy)return;ids=[...new Set(selected)];if(!ids.length)return;
  name='';color=FOLDER_COLORS[folders.length%FOLDER_COLORS.length];error='';creating=true;
 }
 $effect(()=>{if(creating)input?.focus();});
 async function create(event:SubmitEvent){event.preventDefault();if(busy)return;busy=true;error='';
  try{const id=await oncreate(name,ids,color);creating=false;await focus(id);}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function focus(id:string|null){try{await onfocus(id);activeId=id;error='';}catch(e){error=(e as Error).message;}}
</script>

<div class="folder-strip" aria-label="Папки">
 <div class="folder-tabs" role="group" aria-label="Области карты">
  <button class:chosen={activeId===null} aria-pressed={activeId===null} onclick={()=>focus(null)}>Все</button>
  {#each folders as folder (folder.id)}
   <button class:chosen={activeId===folder.id} aria-pressed={activeId===folder.id} title={`${folder.name}: ${folder.count}`} onclick={()=>focus(folder.id)}>
    <i style:background={folder.color} aria-hidden="true"></i><span>{folder.name}</span><small>{folder.count}</small>
   </button>
  {/each}
 </div>
 <button class="create-folder" disabled={busy||!selectionIds.length} onclick={()=>beginCreate(selectionIds)} title="Создать папку из выделенных заметок">Новая папка</button>
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

<style>
 .folder-strip{position:absolute;top:var(--folder-strip-top,88px);left:50%;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:max-content;max-width:calc(100% - 32px);padding:5px;border:1px solid color-mix(in srgb,var(--theme-border),transparent 35%);border-radius:18px;background:color-mix(in srgb,var(--theme-surface),transparent 18%);backdrop-filter:blur(10px);color:var(--theme-text);font:inherit}
 .folder-tabs{display:flex;gap:3px;overflow-x:auto;min-width:0;flex:1;scrollbar-width:thin}.folder-tabs button{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 13px;white-space:nowrap;background:transparent;border:1px solid transparent;border-radius:12px}.folder-tabs button.chosen{background:color-mix(in srgb,var(--theme-text),transparent 91%);border-color:color-mix(in srgb,var(--theme-border),transparent 25%)}
 .folder-tabs span{overflow:hidden;text-overflow:ellipsis;max-width:180px}.folder-tabs i{width:7px;height:7px;border-radius:50%;flex-shrink:0}.folder-tabs small{font-size:11px;opacity:.65;font-variant-numeric:tabular-nums}.create-folder{background:transparent;border-color:transparent;font-size:12px;white-space:nowrap}
 form{display:flex;align-items:end;gap:8px;flex-wrap:wrap;width:100%;padding:10px;border-top:1px solid var(--theme-border)}label{display:flex;flex-direction:column;align-items:start;gap:5px;font-size:12px}.name{flex:1;min-width:150px}.name input{width:100%}.color input{padding:5px;width:44px;height:44px}.selection-count{font-size:12px;opacity:.7;align-self:center}p{flex-basis:100%;margin:0;padding:6px 10px;font-size:12px}
 button:focus-visible,input:focus-visible{outline:2px solid var(--theme-accent);outline-offset:2px}
 @media(max-width:650px){.folder-strip{top:var(--folder-strip-top,128px);max-width:calc(100% - 20px)}.create-folder{padding-inline:8px}.folder-tabs span{max-width:110px}}
</style>
