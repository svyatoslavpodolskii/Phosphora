<script lang="ts">
 import {onMount} from 'svelte';
 import type {Atom,AtomState,Appearance} from '../core/model';
 import AppearancePicker from './AppearancePicker.svelte';
 let {atom,pinning,onclose,onstate,onpin,onedit,oncreate,onimportance,onappearance,ondelete}:{atom:Atom;pinning:boolean;onclose:()=>void;onstate:(state:AtomState)=>unknown;onpin:()=>unknown;onedit:(section?:string)=>void;oncreate:()=>void;onimportance:(importance:number)=>unknown;onappearance:(appearance:Appearance)=>Promise<void>;ondelete:()=>Promise<void>}=$props();
 const states:Record<AtomState,string>={normal:'Обычный',now:'Сейчас',paused:'Пауза',archived:'Архив'};
 const symbols:Record<AtomState,string>={normal:'○',now:'◉',paused:'Ⅱ',archived:'↓'};
 let root:HTMLDivElement;let panel=$state<'actions'|'appearance'|'delete'>('actions');let appearance=$state<Appearance>((()=>JSON.parse(JSON.stringify(atom.appearance)))());let busy=$state(false);let error=$state('');
 async function run(action:()=>unknown){if(busy)return;busy=true;error='';try{await action();}catch(e){error=(e as Error).message;}finally{busy=false;}}
 function back(){if(busy)return;if(panel==='actions')onclose();else panel='actions';}
 function keys(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();back();}if(e.key==='Tab'){const els=[...root.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,summary')].filter(el=>el.getClientRects().length);if(e.shiftKey&&(document.activeElement===els[0]||document.activeElement===root)){e.preventDefault();els.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}}}
 onMount(()=>root.focus());
</script>
<div class="context-scrim"><div class="atom-menu" bind:this={root} role="dialog" aria-modal="true" aria-label="Действия с атомом" tabindex="-1" onkeydown={keys}>
 <div class="context-heading">{#if panel!=='actions'}<button class="icon-button" aria-label="Назад" disabled={busy} onclick={back}>←</button>{/if}<div><small>{panel==='appearance'?'ОФОРМЛЕНИЕ':panel==='delete'?'УДАЛЕНИЕ':'АТОМ'}</small><strong>{atom.title}</strong></div><button class="icon-button" aria-label="Закрыть меню атома" disabled={busy} onclick={onclose}>×</button></div>
 {#if error}<p role="alert" class="inline-error">{error}</p>{/if}
 {#if panel==='appearance'}
  <AppearancePicker bind:value={appearance} title={atom.title} defaultShape={atom.type==='task'?'square':'circle'} defaultIcon={({task:'✓',person:'♙',project:'◈',idea:'✦'} as Record<string,string>)[atom.type]||'·'}/><button class="primary" disabled={busy} onclick={()=>run(()=>onappearance($state.snapshot(appearance)))}>{busy?'Сохраняем…':'Готово'}</button>
 {:else if panel==='delete'}
  <p class="delete-explanation">Удалить атом и его связи? Локальная копия останется в настройках.</p><button class="danger-button" disabled={busy} onclick={()=>run(ondelete)}>Удалить навсегда</button><button class="quiet-button" onclick={back}>Отмена</button>
 {:else}
  <div class="state-shortcuts">{#each Object.entries(states).filter(([s])=>s!==atom.state) as [s,label]}<button disabled={busy} onclick={()=>run(()=>onstate(s as AtomState))}><span aria-hidden="true">{symbols[s as AtomState]}</span>{atom.state==='archived'&&s==='normal'?'Восстановить':label}</button>{/each}</div>
  <div class="context-actions"><button onclick={oncreate}><span aria-hidden="true">＋</span>Связанный атом</button><button onclick={()=>onedit('links')}><span aria-hidden="true">↗</span>Связи</button><button onclick={()=>panel='appearance'}><span class="appearance-dot" style:--atom-color={atom.appearance.color||'#b4ecc1'}></span>Оформление</button>{#if pinning}<button disabled={busy} aria-pressed={atom.pinned} onclick={()=>run(onpin)}><span aria-hidden="true">⌖</span>{atom.pinned?'Открепить':'Закрепить'}</button>{/if}</div>
  <div class="importance-control"><span>Важность</span><div role="group" aria-label="Важность">{#each ['Обычный','Важный','Ключевой'] as name,i}<button disabled={busy} aria-label={name} title={name} aria-pressed={i===atom.importance} onclick={()=>run(()=>onimportance(i))}>{['○','✦','✦✦'][i]}</button>{/each}</div></div>
  <button class="context-delete" onclick={()=>panel='delete'}>Удалить атом</button>
 {/if}
</div></div>
