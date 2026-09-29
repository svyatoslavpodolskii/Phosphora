<script lang="ts">
 import {surface} from './surfaces';
 import {onMount} from 'svelte';
 import type {SQLiteAdapter} from '../storage/adapter';
 import type {WorkspaceCatalog} from '../storage/workspaces';
 let {storage,onclose}:{storage:SQLiteAdapter;onclose:()=>void}=$props();let catalog=$state<WorkspaceCatalog>({current:'',items:[]});let mode=$state<'list'|'create'|'rename'>('list');let name=$state('');let busy=$state(false);let error=$state('');let root:HTMLDivElement;
 onMount(()=>{root.focus();run(async()=>{catalog=await storage.workspaces();});});
 async function run(fn:()=>Promise<void>){busy=true;error='';try{await fn();}catch(e){error=(e as Error).message;}finally{busy=false;}}
 async function select(id:string){await storage.transaction([]);await storage.selectWorkspace(id);const url=new URL(location.href);url.searchParams.delete('workspace');location.replace(url.href);}
 function keys(e:KeyboardEvent){if(e.key==='Escape'&&!busy){e.preventDefault();onclose();}if(e.key==='Tab'){const els=[...root.querySelectorAll<HTMLElement>('button:not([disabled]),input')].filter(el=>el.getClientRects().length);if(e.shiftKey&&(document.activeElement===els[0]||document.activeElement===root)){e.preventDefault();els.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}}}
</script>
<div class="context-scrim" use:surface={{close:onclose,blocked:()=>busy}}><div class="atom-menu workspace-menu" role="dialog" aria-modal="true" aria-label="Хранилища" tabindex="-1" bind:this={root} onkeydown={keys}>
 <div class="context-heading"><div><small>ВАШИ ПРОСТРАНСТВА</small><strong>Хранилища</strong></div><button class="icon-button" aria-label="Закрыть хранилища" disabled={busy} onclick={onclose}>×</button></div>
 {#if error}<p role="alert">{error}</p>{/if}
 {#if mode==='list'}<div class="workspace-list">{#each catalog.items as item}<button aria-pressed={item.id===catalog.current} disabled={busy} onclick={()=>item.id===catalog.current?onclose():run(()=>select(item.id))}><span>◈</span><strong>{item.name}</strong>{#if item.id===catalog.current}<small>Открыто</small>{/if}</button>{/each}</div><button class="primary" disabled={busy} onclick={()=>{mode='create';name='';}}>Новое хранилище</button><button class="quiet-button" disabled={busy} onclick={()=>{mode='rename';name=catalog.items.find(w=>w.id===catalog.current)?.name||'';}}>Переименовать текущее</button>
 {:else}<form onsubmit={e=>{e.preventDefault();run(async()=>{if(mode==='create'){const before=new Set(catalog.items.map(w=>w.id));catalog=await storage.createWorkspace(name);await select(catalog.items.find(w=>!before.has(w.id))!.id);}else{catalog=await storage.renameWorkspace(catalog.current,name);mode='list';}});}}><label class="stack">{mode==='create'?'Название нового хранилища':'Новое название'}<input aria-label="Название хранилища" bind:value={name} maxlength="80" required disabled={busy}/></label><p>Отдельная карта, заметки, настройки и вложения. Всё хранится на этом устройстве.</p><div class="button-wrap"><button class="primary" type="submit" disabled={busy}>{mode==='create'?'Создать и открыть':'Сохранить название'}</button><button type="button" disabled={busy} onclick={()=>mode='list'}>Отмена</button></div></form>{/if}
</div></div>
