<script lang="ts">
 import {surface} from './surfaces';
 import {onMount,tick} from 'svelte';
 import {formatText,type Format} from './text-edit';
 import MarkdownView from './MarkdownView.svelte';

 import type {Atom,Snapshot,AtomState} from '../core/model';
 import type {AtomType} from '../plugins/api';
 import {normalize} from '../core/core';
 import {type Candidate,type Rejection} from '../core/matching';
 import {GraphWorkerClient} from '../graph/worker-client';
 import type {Preferences} from '../core/preferences';
 import type {StorageAdapter} from '../core/model';
 let {initial,data,types,parent,prefs,section,storage,onopen,onsave,onclose,ondelete}:{initial:Partial<Atom>;data:Snapshot;types:AtomType[];parent?:string;prefs:Preferences;section:string;storage:StorageAdapter;onopen:(id:string)=>void;onsave:(draft:Partial<Atom>&{title:string},add:{to:string;relation:string;source?:string}[],remove:string[])=>Promise<void>;onclose:()=>void;ondelete:(id:string)=>Promise<void>}=$props();
 const seed=(()=>JSON.parse(JSON.stringify(initial)) as Partial<Atom>)();
 let draft=$state<Partial<Atom>>({...seed,appearance:{...seed.appearance},aliases:[...(seed.aliases||[])]});
 let matcher=$state<GraphWorkerClient|null>(null);let matches=$state<Candidate[]>([]);let matchVersion=0;
 let rejection=$state<Rejection|undefined>();
 let aliases=$state((seed.aliases||[]).join(', '));let linkQuery=$state('');let relation=$state('related');let add=$state<{to:string;relation:string;source?:string}[]>([]);let remove=$state<string[]>([]);let saving=$state(false);let error=$state('');let preview=$state(Boolean(seed.id&&seed.content));let confirmClose=$state(false);let confirmDelete=$state((()=>section==='delete')());let titleInput:HTMLInputElement;let form:HTMLFormElement;let textArea=$state<HTMLTextAreaElement>(null!);let expanded=$state(false);let quickLinks=$state(false);let quickQuery=$state('');let quickInput=$state<HTMLInputElement>(null!);let selection={start:0,end:0};
 const labels:Record<AtomState,string>={normal:'Обычный',now:'Сейчас',paused:'Пауза',archived:'Архив'};
 const original=JSON.stringify({draft:seed,aliases:(seed.aliases||[]).join(', ')});
 const dirty=()=>JSON.stringify({draft:$state.snapshot(draft),aliases})!==original||add.length>0||remove.length>0;
 const linked=$derived(data.links.filter(l=>(l.from===draft.id||l.to===draft.id)&&!remove.includes(l.id)));
 const candidates=$derived.by(()=>{const excluded=new Set([draft.id||'',parent||'',...linked.flatMap(l=>[l.from,l.to]),...add.map(l=>l.to),...data.links.filter(l=>remove.includes(l.id)).flatMap(l=>[l.from,l.to])]);const q=normalize(linkQuery);if(q)return data.atoms.filter(a=>!excluded.has(a.id)&&[a.title,...a.aliases].some(t=>normalize(t).includes(q))).slice(0,6).map(atom=>({atom,confidence:1,reason:'title' as const}));if(prefs.linkMode==='off')return[];return matches.filter(c=>!excluded.has(c.atom.id)).slice(0,6);});

 $effect(()=>{const text=(draft.title||'')+' '+(draft.content||'');const atoms=$state.snapshot(data.atoms),suppression=$state.snapshot(rejection),enabled=prefs.linkMode!=='off';const version=++matchVersion;if(!matcher||!enabled){matches=[];return;}const worker=matcher;const timer=setTimeout(()=>worker.call<Candidate[]>('match',{text,atoms,exclude:[draft.id||''],rejection:suppression}).then(result=>{if(version===matchVersion)matches=result;}).catch(e=>error=e.message),180);return()=>clearTimeout(timer);});
 function close(){if(dirty())confirmClose=true;else onclose();}
 async function format(kind:Format){preview=false;await tick();const edit=formatText(draft.content||'',selection.start,selection.end,kind);draft.content=edit.text;await tick();textArea.focus();textArea.setSelectionRange(edit.start,edit.end);selection={start:edit.start,end:edit.end};}
 async function showLinks(){quickLinks=!quickLinks;quickQuery='';if(quickLinks){await tick();quickInput.focus();}}
 async function insertLink(atom:Atom){const target=typeof (atom.properties.vault as {path?:string})?.path==='string'?(atom.properties.vault as {path:string}).path.replace(/\.md$/i,''):atom.title;const value=`[[${target}${target!==atom.title?'|'+atom.title:''}]]`;const content=draft.content||'';draft.content=content.slice(0,selection.start)+value+content.slice(selection.end);if(!linked.some(l=>l.from===atom.id||l.to===atom.id)&&!add.some(l=>l.to===atom.id))add=[...add,{to:atom.id,relation:'related',source:'markdown'}];const caret=selection.start+value.length;selection={start:caret,end:caret};quickLinks=false;preview=false;await tick();textArea.focus();textArea.setSelectionRange(caret,caret);}
 async function save(){saving=true;error='';try{await onsave({...$state.snapshot(draft),title:draft.title!.trim(),aliases:aliases.split(',').map(x=>x.trim()).filter(Boolean),properties:$state.snapshot(draft.properties)||{}},$state.snapshot(add),$state.snapshot(remove));}catch(e){error=(e as Error).message;}finally{saving=false;}}
 function applyType(id:string){const t=types.find(t=>t.id===id);draft.type=id.startsWith('builtin.templates:')?id.split(':').pop()!:id;if(t){draft.appearance={...draft.appearance,...t.appearance,icon:t.icon};if(!draft.content&&t.content)draft.content=t.content;}}
 function keyboard(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&['b','i','k'].includes(e.key.toLowerCase())){e.preventDefault();e.stopPropagation();if(e.key.toLowerCase()==='k')showLinks();else format(e.key.toLowerCase()==='b'?'bold':'italic');return;}if(e.key==='Escape'){e.preventDefault();close();}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();save();}if(e.key==='Tab'){const els=[...form.querySelectorAll<HTMLElement>('button:not([disabled]),input,textarea,select,[tabindex="0"]')].filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}}}
 onMount(()=>{matcher=new GraphWorkerClient();if(seed.id)form.focus();else titleInput.focus();if(draft.id)storage.getSetting<Rejection>('rejected:'+draft.id).then(value=>rejection=value).catch(e=>error=e.message);const unload=(e:BeforeUnloadEvent)=>{if(dirty()){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);return()=>{matchVersion++;matcher?.close();window.removeEventListener('beforeunload',unload);};});
</script>
<div class="scrim" use:surface={{close:()=>{if(quickLinks)quickLinks=false;else if(confirmClose)confirmClose=false;else if(confirmDelete)confirmDelete=false;else close();},blocked:()=>saving}}>
 <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role (The form is a focus-trapped editor dialog.) -->
 <form class="editor note-editor" class:expanded tabindex="-1" bind:this={form} role="dialog" aria-modal="true" aria-label="Редактор атома" onsubmit={e=>{e.preventDefault();save();}} onkeydown={keyboard}>
 <div class="row note-heading"><span class="note-identity"><span class="note-dot" style:--atom-color={draft.appearance?.color||'#b4ecc1'}>{draft.appearance?.icon||'·'}</span>{draft.id?'Ваша мысль':parent?'Связанная мысль':'Новая мысль'}</span><div class="button-wrap"><button type="button" class="icon-button" aria-label={expanded?'Свернуть редактор':'Развернуть редактор'} aria-pressed={expanded} onclick={()=>expanded=!expanded}>{expanded?'↙':'↗'}</button><button type="button" class="icon-button" aria-label="Закрыть редактор" disabled={saving} onclick={close}>×</button></div></div>
 {#if error}<p role="alert" class="inline-error">{error}</p>{/if}
 <input class="atom-title" bind:this={titleInput} aria-label="Название" placeholder="О чём вы думаете?" bind:value={draft.title} required maxlength="500"/>
 <div class="note-toolbar"><label class="state-pill"><span aria-hidden="true">{draft.state==='now'?'◉':draft.state==='paused'?'Ⅱ':draft.state==='archived'?'↓':'○'}</span><select aria-label="Состояние" bind:value={draft.state}>{#each Object.entries(labels) as [s,label]}<option value={s}>{label}</option>{/each}</select></label> <label>Тип <select aria-label="Тип" value={types.find(t=>t.id.split(':').pop()===draft.type)?.id||draft.type} onchange={e=>applyType(e.currentTarget.value)}>{#each types as t}<option value={t.id}>{t.name}</option>{/each}{#if !types.some(t=>t.id.split(':').pop()===draft.type)}<option value={draft.type}>{draft.type}</option>{/if}</select></label><button type="button" class="preview-toggle" aria-pressed={preview} onclick={()=>preview=!preview}>{preview?'Редактировать':'Просмотр'}</button></div>
 <div class="writing-tools" role="toolbar" aria-label="Форматирование текста">
 {#if !preview}<button type="button" aria-label="Жирный" title="Жирный · Ctrl+B" onclick={()=>format('bold')}><b>B</b></button><button type="button" aria-label="Курсив" title="Курсив · Ctrl+I" onclick={()=>format('italic')}><i>I</i></button><button type="button" aria-label="Заголовок" onclick={()=>format('heading')}>H</button><button type="button" aria-label="Список" onclick={()=>format('list')}>≡</button><button type="button" aria-label="Список задач" onclick={()=>format('task')}>☑</button><button type="button" aria-label="Цитата" onclick={()=>format('quote')}>❞</button><button type="button" aria-label="Код" onclick={()=>format('code')}>‹›</button>{/if}<button type="button" class="quick-link-button" aria-expanded={quickLinks} onclick={showLinks}>↗ Связать</button>
 </div>
 {#if quickLinks}<div class="quick-link-picker"><input bind:this={quickInput} aria-label="Быстрая связь" placeholder="Найти заметку…" bind:value={quickQuery}/>{#each data.atoms.filter(a=>a.id!==draft.id&&normalize(a.title+' '+a.aliases.join(' ')).includes(normalize(quickQuery))).slice(0,8) as atom}<button type="button" onclick={()=>insertLink(atom)}>{atom.title}</button>{/each}</div>{/if}
 {#if preview}<MarkdownView content={draft.content||''} source={draft as Atom} atoms={data.atoms} {storage} onopen={id=>{if(dirty())confirmClose=true;else onopen(id);}}/>{:else}<textarea bind:this={textArea} oninput={()=>selection={start:textArea.selectionStart,end:textArea.selectionEnd}} onselect={()=>selection={start:textArea.selectionStart,end:textArea.selectionEnd}} onkeyup={()=>selection={start:textArea.selectionStart,end:textArea.selectionEnd}} onclick={()=>selection={start:textArea.selectionStart,end:textArea.selectionEnd}} class="note-content" aria-label="Текст" placeholder="Пишите свободно…" bind:value={draft.content}></textarea>{/if}
 {#if candidates.length}<div class="inline-suggestions"><small>Связать</small>{#each candidates as c}<button type="button" class="suggestion" onclick={()=>{add=[...add,{to:c.atom.id,relation:relation.trim()||'related'}];linkQuery='';}}>+ {c.atom.title}<small>{c.confidence<1?Math.round(c.confidence*100)+'%':''}</small></button>{/each}</div>{/if}
 <details open={section==='links'} class="links-section"><summary>Связи</summary><div class="row"><small>СВЯЗИ</small><span class="muted">{linked.length+add.length+(parent?1:0)}</span></div>
 {#if parent}<p class="link-chip">↗ {data.atoms.find(a=>a.id===parent)?.title} <small>контекст</small></p>{/if}
 {#each linked as l}{@const other=data.atoms.find(a=>a.id===(l.from===draft.id?l.to:l.from))}<div class="link-chip"><span>{l.from===draft.id?'↗':'↙'} {other?.title}<small>{l.relation==='related'?'связано':l.relation}{other?.state==='archived'?' · архив':''}</small></span><button type="button" aria-label={`Удалить связь с ${other?.title}`} onclick={()=>remove=[...remove,l.id]}>×</button></div>{/each}
 {#each add as l,i}<div class="link-chip"><span>↗ {data.atoms.find(a=>a.id===l.to)?.title}<small>{l.relation==='related'?'связано':l.relation} · новая</small></span><button type="button" aria-label="Отменить новую связь" onclick={()=>add=add.filter((_,j)=>i!==j)}>×</button></div>{/each}
 <input aria-label="Связать с атомом" placeholder="Найти существующий атом…" bind:value={linkQuery}/>
 {#if linkQuery}<input aria-label="Смысл связи" placeholder="Смысл связи" bind:value={relation} maxlength="100"/>{/if}

 </details>
 <details class="note-metadata"><summary>Дополнительно</summary><div class="details-body">

 <label class="stack">Алиасы <input aria-label="Алиасы" placeholder="Другие имена через запятую" bind:value={aliases}/></label>

 {#if draft.id}<button type="button" class="subtle" onclick={()=>confirmDelete=true}>Удалить атом</button>{/if}
 <small class="muted">{draft.created_at?new Date(draft.created_at).toLocaleString():''}</small>
 </div></details>
 {#if confirmClose}<div class="confirm"><p>Сохранить изменения перед закрытием?</p><button type="submit" disabled={saving}>Сохранить</button><button type="button" disabled={saving} onclick={onclose}>Закрыть без сохранения</button><button type="button" onclick={()=>confirmClose=false}>Продолжить</button></div>{/if}
 {#if confirmDelete}<div class="confirm"><p>Удалить атом и его связи? Локальная копия останется в настройках.</p><button type="button" disabled={saving} onclick={async()=>{saving=true;try{await ondelete(draft.id!);}catch(e){error=(e as Error).message;}finally{saving=false;}}}>Удалить навсегда</button><button type="button" onclick={()=>confirmDelete=false}>Отмена</button></div>{/if}
 <div class="row editor-actions"><span class="save-hint">Только на вашем устройстве</span><button type="submit" class="primary" disabled={saving}>{saving?'Сохраняем…':'Сохранить'}</button></div>
 </form>
</div>
