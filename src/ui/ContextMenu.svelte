<script lang="ts">
 import {surface} from './surfaces';
 import {onMount} from 'svelte';
 import type {Atom,AtomState,Appearance} from '../core/model';
 import AppearancePicker from './AppearancePicker.svelte';
 import type {AtomType} from '../plugins/api';
 let {count=1,atom,types=[],ontype,pinning,onclose,onstate,onpin,onedit,oncreate,onconnect,onmove,onimportance,onappearance,ondelete}:{count?:number;atom:Atom;types?:AtomType[];ontype?:(type:string)=>Promise<void>;pinning:boolean;onclose:()=>void;onstate:(state:AtomState|'resume')=>unknown;onpin:()=>unknown;onedit:(section?:string)=>void;oncreate:()=>void;onconnect:()=>void;onmove:()=>void;onimportance:(importance:number)=>unknown;onappearance:(appearance:Appearance)=>Promise<void>;ondelete:()=>Promise<void>}=$props();
 const offeredTypes=$derived(types.filter(t=>t.id!=='task'&&t.id!=='builtin.templates:task'));
 const currentType=$derived(offeredTypes.find(t=>t.id===atom.type||t.id.startsWith('builtin.templates:')&&t.id.split(':').pop()===atom.type));
 const states={normal:'Поле',now:'Сейчас',archived:'Архив'};
 const symbols:Record<AtomState,string>={normal:'○',now:'◉',paused:'Ⅱ',archived:'↓'};
 let root:HTMLDivElement;let panel=$state<'actions'|'appearance'|'delete'>('actions');let appearance=$state<Appearance>((()=>JSON.parse(JSON.stringify(atom.appearance)))());let busy=$state(false);let error=$state('');
 async function run(action:()=>unknown){if(busy)return;busy=true;error='';try{await action();}catch(e){error=(e as Error).message;}finally{busy=false;}}
 function back(){if(busy)return;if(panel==='actions')onclose();else panel='actions';}
 function keys(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();back();}if(e.key==='Tab'){const els=[...root.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,summary')].filter(el=>el.getClientRects().length);if(e.shiftKey&&(document.activeElement===els[0]||document.activeElement===root)){e.preventDefault();els.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}}}
 onMount(()=>root.focus());
</script>
<div class="context-scrim" use:surface={{close:back,blocked:()=>busy}}><div class="atom-menu" bind:this={root} role="dialog" aria-modal="true" aria-label="Действия с атомом" tabindex="-1" onkeydown={keys}>
 <div class="context-heading">{#if panel!=='actions'}<button class="icon-button" aria-label="Назад" disabled={busy} onclick={back}>←</button>{/if}<div><small>{panel==='appearance'?'ОФОРМЛЕНИЕ':panel==='delete'?'УДАЛЕНИЕ':'АТОМ'}</small><strong>{count>1?`Выделено: ${count}`:atom.title}</strong></div><button class="icon-button" aria-label="Закрыть меню атома" disabled={busy} onclick={onclose}>×</button></div>
 {#if error}<p role="alert" class="inline-error">{error}</p>{/if}
 {#if panel==='appearance'}
  <AppearancePicker bind:value={appearance} title={atom.title} defaultShape={atom.type==='task'?'square':'circle'} defaultIcon={({task:'✓',person:'♙',project:'◈',idea:'✦'} as Record<string,string>)[atom.type]||'·'}/><button class="primary" disabled={busy} onclick={()=>run(()=>onappearance($state.snapshot(appearance)))}>{busy?'Сохраняем…':'Готово'}</button>
 {:else if panel==='delete'}
  <p class="delete-explanation">{count>1?`Удалить ${count} атомов и их связи?`:'Удалить атом и его связи?'} Локальная копия останется в настройках.</p><button class="danger-button" disabled={busy} onclick={()=>run(ondelete)}>Удалить</button><button class="quiet-button" onclick={back}>Отмена</button>
 {:else}
  <div class="state-shortcuts">{#each Object.entries(states).filter(([s])=>count>1||s!==atom.state) as [s,label]}<button disabled={busy} onclick={()=>run(()=>onstate(s as AtomState))}><span aria-hidden="true">{symbols[s as AtomState]}</span>{label}</button>{/each}</div>
  {#if ontype}<label>Тип <select aria-label={count>1?'Тип выделенных атомов':'Тип'} value={currentType?.id||atom.type} disabled={busy} onchange={e=>{const id=e.currentTarget.value;void run(()=>ontype!(id.startsWith('builtin.templates:')?id.split(':').pop()!:id));}}>{#each offeredTypes as t}<option value={t.id}>{t.name}</option>{/each}{#if !currentType}<option value={atom.type} disabled>{atom.type==='task'||atom.type==='builtin.templates:task'?'Задача (устаревший тип)':atom.type==='note'?'Заметка':atom.type}</option>{/if}</select></label>{/if}
  <div class="context-actions">{#if count===1}<button onclick={oncreate}><span aria-hidden="true">＋</span>Связанный атом</button><button onclick={onconnect}>Связать на карте</button>{/if}<button onclick={()=>panel='appearance'}><span class="appearance-dot" style:--atom-color={atom.appearance.color||'#b4ecc1'}></span>Оформление</button>{#if pinning}<button disabled={busy} aria-pressed={atom.pinned} onclick={()=>run(onpin)}><svg width="19" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="rotate(32 12 12)"><path d="M7 3h10l-2 7c3 1 4 3 4 5H5c0-2 1-4 4-5Z"/><path d="M12 15v7"/></g></svg>{atom.pinned?'Открепить':'Закрепить'}</button>{/if}</div>
  <details class="context-details"><summary>Дополнительно</summary><div class="importance-control"><span>Важность</span><div role="group" aria-label="Важность">{#each ['Обычный','Важный','Ключевой'] as name,i}<button disabled={busy} aria-label={name} title={name} aria-pressed={i===atom.importance} onclick={()=>run(()=>onimportance(i))}>{['○','✦','✦✦'][i]}</button>{/each}</div></div></details>
  <div class="context-tail"><button class="context-move" disabled={busy} onclick={()=>run(()=>onstate(atom.paused?'resume':'paused'))}>{atom.paused?'Возобновить':'Отложить'}</button><button class="context-move" onclick={onmove}>В другую группу…</button><button class="context-delete" onclick={()=>panel='delete'}>Удалить атом</button></div>
 {/if}
</div></div>
