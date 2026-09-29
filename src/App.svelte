<script lang="ts">
  import {surface} from './ui/surfaces';
  import {onMount,flushSync} from 'svelte';
  import {MIN_ZOOM,MAX_ZOOM} from './graph/model';
  import {validLocation,revealCamera,type SpatialLocation} from './graph/navigation';
  import {IntentMachine} from './graph/intent';
  import {excerpt} from './core/search';
  import {Core} from './core/core';
  import {SQLiteAdapter} from './storage/adapter';
  import Map from './graph/Map.svelte';
  import Editor from './ui/Editor.svelte';
  import Settings from './ui/Settings.svelte';
  import ContextMenu from './ui/ContextMenu.svelte';
  import Workspaces from './ui/Workspaces.svelte';
  import BranchMenu from './ui/BranchMenu.svelte';
  import SaveStatus from './ui/SaveStatus.svelte';
  import ThemeBackdrop from './ui/ThemeBackdrop.svelte';
  import {graphBuiltin} from './plugins/graph-builtin';
  import {preferences} from './core/preferences';
  import {applyTheme,currentTheme} from './core/themes';
  import {PluginRuntime} from './plugins/runtime';
  import {templates} from './plugins/builtins';
  import {obsidian} from './plugins/obsidian';
  import {migrateObsidianBindings} from './plugins/obsidian-storage';
  import {dynamicsPlugins} from './plugins/dynamics';
  import {daily} from './plugins/daily';
  import {dailyTasks} from './plugins/daily-tasks';
  import {initializePluginDefaults} from './plugins/defaults';
  import {communityPlugin} from './plugins/sandbox';
  import type {Manifest,Command} from './plugins/api';
  import type {Atom,AtomState,Snapshot} from './core/model';
  import PluginView from './ui/PluginView.svelte';
  import type {PluginView as ViewDefinition} from './plugins/api';
  let editorReturn:SpatialLocation|null=null;let view=$state({width:0,height:0});let revealRequest=$state<{id:string;nonce:number}|null>(null);let revealNonce=0;
  const navigationKey='phosphored:'+location.pathname+location.search;
  function locationState():SpatialLocation{return{camera:$state.snapshot(camera),selected,lens};}
  function remember(){if(ready)history.replaceState({...history.state,[navigationKey]:locationState()},'');}
  // Hover, selected, focused and opened are separate states. Only a user action
  // selects; neither pointer motion nor camera movement can promote itself.
  const intent=new IntentMachine(()=>{if(intent.value.selected!==selected)selected=intent.value.selected;});
 let branch=$state<string[]>([]);let workspaces=$state(false);let workspaceName=$state('Основное');
  let prefs=$state(preferences());let contextId=$state('');let editorSection=$state('');
  let core:Core=$state()!;let runtime:PluginRuntime=$state()!;let data:Snapshot=$state({atoms:[],links:[]});let camera=$state({x:0,y:0,zoom:1});let ready=$state(false);let fatal=$state(false);let error=$state('');let notice=$state('');let editing:Partial<Atom>|null=$state(null);let parent:string|undefined=$state();let selected=$state('');let query=$state('');let lens=$state('all');let persistent=$state(false);let settings=$state(false);let menu=$state(false);let registry=$state(0);let installEvent:any=$state(null);let offlineReady=$state(false);let activeView=$state<ViewDefinition|null>(null);let searchInput:HTMLInputElement;let searchButton:HTMLButtonElement;let searchOpen=$state(false);
  $effect(()=>applyTheme(currentTheme(prefs.theme,prefs.customThemes)));
  const states:Record<AtomState,string>={normal:'Обычный',now:'Сейчас',paused:'Пауза',archived:'Архив'};
  const results=$derived.by(()=>{data;return ready&&query?core.search(query):[];});
  const typeList=$derived.by(()=>{registry;return runtime?[...runtime.types.values()]:[];});
  const current=$derived(data.atoms.find(a=>a.id===selected));
  let noticeTimer:ReturnType<typeof setTimeout>;
  function notify(text:string){notice=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice='',9000);}
  async function persist(){try{persistent=await navigator.storage.persisted();if(!persistent){await navigator.storage.persist();persistent=await navigator.storage.persisted();}if(!persistent&&!await core.storage.getSetting('persistence-notified')){notify('Браузер не предоставил защиту от автоматической очистки. Подробности — в настройках хранилища.');await core.storage.transaction([{kind:'setting',key:'persistence-notified',value:true}]);}}catch{notify('Защита хранилища недоступна. Резервную копию можно скачать в настройках.');}}
  function expandSearch(){flushSync(()=>searchOpen=true);searchInput.focus();}
  function collapseSearch(restore=false){searchOpen=false;query='';if(restore)searchButton.focus();}
  function saveCamera(){remember();if(ready)core.storage.transaction([{kind:'setting',key:'map',value:{camera:$state.snapshot(camera),lens,selected}}]).catch(e=>error=e.message);}
  // Restoring a place is a jump, not a journey: the user asked to go back, not to fly there.
  function travel(target:SpatialLocation){selected=data.atoms.some(a=>a.id===target.selected)?target.selected:'';lens=target.lens;camera={...target.camera};intent.select(selected);saveCamera();}
  function focus(id:string){const a=data.atoms.find(a=>a.id===id);if(!a)return;remember();
   // Selection follows the search result. The camera only helps when the target is
   // off screen or too small to read; otherwise the view is left exactly as it is,
   // and any correction it does make is animated rather than a jump.
   if(revealCamera(camera,{x:a.x,y:a.y},view,1))revealRequest={id,nonce:++revealNonce};
   const lens=a.state==='archived'?'archived':'all';
   history.pushState({...history.state,[navigationKey]:{camera:$state.snapshot(camera),selected:id,lens}},'');
   query='';searchOpen=false;menu=false;contextId='';intent.select(id);saveCamera();}

  onMount(()=>{core=new Core(new SQLiteAdapter());runtime=new PluginRuntime(core,{focus,notify,changed:()=>registry++});const unsub=core.subscribe(()=>{data=core.data;prefs=core.prefs;});core.placementProvider=input=>runtime.providers.active(runtime.providers.layout).place(input);
  core.init().then(async()=>{await runtime.enable(graphBuiltin);await migrateObsidianBindings(core.storage);await runtime.enable(obsidian);const saved=await core.storage.getSetting<any>('map');if(saved&&[saved.camera?.x,saved.camera?.y,saved.camera?.zoom].every(Number.isFinite)&&saved.camera.zoom>=MIN_ZOOM&&saved.camera.zoom<=MAX_ZOOM){camera=saved.camera;lens=['all','now','archived'].includes(saved.lens)?saved.lens:'all';selected=data.atoms.some(a=>a.id===saved.selected)?saved.selected:'';}const disabled=await initializePluginDefaults(core.storage,data.atoms.length>0);for(const p of [templates,daily,dailyTasks,...dynamicsPlugins])if(!disabled.includes(p.manifest.id))await runtime.enable(p);const community=await core.storage.getSetting<{manifest:Manifest;source:string;style?:string;assets?:Record<string,number[]>;enabled:boolean}[]>('community-plugins')||[];for(const p of community)if(p.enabled)try{await runtime.enable(communityPlugin(p.manifest,p.source,p));}catch(e){notify(`Плагин ${p.manifest.name} не запущен: ${(e as Error).message}`);}const spaces=await (core.storage as SQLiteAdapter).workspaces();workspaceName=spaces.items.find(w=>w.id===spaces.current)?.name||'Основное';ready=true;remember();await persist();}).catch(e=>{fatal=true;error=e.message;});
  if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(()=>offlineReady=true);
  const pop=(e:PopStateEvent)=>{const target=e.state?.[navigationKey];if(validLocation(target)){if(editing)editorReturn=target;else editorReturn=null;contextId='';menu=false;travel(target);}};window.addEventListener('popstate',pop);
  const install=(e:Event)=>{e.preventDefault();installEvent=e;};window.addEventListener('beforeinstallprompt',install);
  const keys=(e:KeyboardEvent)=>{if(e.key==='Escape'){menu=false;activeView=null;}if(!editing&&!settings&&!workspaces&&!contextId&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();expandSearch();}};window.addEventListener('keydown',keys);
  return()=>{unsub();runtime.dispose();core.storage.close();window.removeEventListener('beforeinstallprompt',install);window.removeEventListener('keydown',keys);clearTimeout(noticeTimer);window.removeEventListener('popstate',pop);};});
  function create(x?:number,y?:number){editorReturn=locationState();const a=data.atoms.find(a=>a.id===selected);parent=a?.id;editing={title:'',content:'',type:'note',state:'normal',importance:0,pinned:false,spatial:{resistance:0},appearance:{color:'#b4ecc1'},aliases:[],properties:{},...(x!==undefined&&y!==undefined?{x,y}:{})};contextId='';editorSection='';menu=false;}
  function open(id:string,section=''){const a=data.atoms.find(a=>a.id===id);if(a){if(!editing)editorReturn=locationState();contextId='';parent=undefined;editorSection=section;editing=$state.snapshot(a);intent.open(id);}}
  function closeEditor(){editing=null;contextId='';intent.close();if(editorReturn){camera=editorReturn.camera;selected=data.atoms.some(a=>a.id===editorReturn!.selected)?editorReturn!.selected:'';lens=editorReturn.lens;editorReturn=null;}saveCamera();}
  function closeContext(){contextId='';intent.release();selected='';saveCamera();}
  async function save(draft:Partial<Atom>&{title:string},add:{to:string;relation:string}[],remove:string[]){await core.saveDraft(draft,add,remove,parent);closeEditor();}
  async function removeAtom(id:string){await core.delete(id);closeEditor();notify('Атом удалён; локальная копия сохранена.');}
  async function changeState(id:string,state:AtomState){try{await core.setState(id,state);}catch(e){error=(e as Error).message;}}
  async function command(c:Command){menu=false;try{await c.run(selected||undefined);}catch(e){error=(e as Error).message;}}
  async function layout(id:string){menu=false;try{const positions=await runtime.layouts.get(id)!.run(structuredClone(core.data));for(const p of positions){const a=core.data.atoms.find(a=>a.id===p.id);if(!a)throw Error('Unknown atom');if(!a.pinned)await core.update(p.id,{x:p.x,y:p.y,spatial:{resistance:0}});}}catch(e){error=(e as Error).message;}}
</script>
<svelte:window onpointerdown={e=>{if(searchOpen&&!(e.target as Element).closest('.search'))collapseSearch();}}/>
<svelte:head><title>Phosphora — ваша живая карта</title></svelte:head>
<main data-navigation="idle"><ThemeBackdrop/>
 <header><button class="workspace-switch" aria-label="Выбрать хранилище" disabled={!ready||Boolean(editing)} onclick={()=>{workspaces=true;menu=false;contextId='';}}><span>✳</span><span>{workspaceName}</span><small>⌄</small></button><div class="search" class:search-open={searchOpen}><button bind:this={searchButton} class="search-trigger" aria-label="Открыть поиск" aria-expanded={searchOpen} disabled={!ready} onclick={expandSearch}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button><input bind:this={searchInput} tabindex={searchOpen?0:-1} aria-hidden={!searchOpen} aria-label="Поиск" placeholder="Найти на карте…" bind:value={query} onkeydown={e=>{if(e.key==='Enter'&&results[0])focus(results[0].id);if(e.key==='Escape'){e.preventDefault();e.stopPropagation();collapseSearch(true);}}}/>{#if searchOpen}<button class="search-close" aria-label="Закрыть поиск" onclick={()=>collapseSearch(true)}>×</button>{/if}{#if searchOpen&&query}<div class="search-results" aria-label="Результаты поиска">{#each results as a}<button onclick={()=>focus(a.id)}><span>{#each excerpt(a.title,query,100) as part}{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</span>{#if a.content}<span class="search-excerpt">{#each excerpt(a.content,query) as part}{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</span>{/if}<small>{a.type} · {states[a.state]}</small></button>{:else}<p>Ничего не найдено. Можно создать новый атом.</p>{/each}</div>{/if}</div><SaveStatus/><button onclick={()=>create()} disabled={!ready}>+ Создать</button><button aria-label="Меню карты" aria-expanded={menu} disabled={!ready} onclick={()=>menu=!menu}>•••</button></header>
 {#if error}<div role="alert" class="notice">{error}{#if fatal}<button onclick={()=>location.reload()}>Повторить запуск</button><button onclick={()=>location.search='?workspace=default'}>Открыть основное хранилище</button>{:else}<button onclick={()=>error=''}>Закрыть</button>{/if}</div>{/if}
 {#if notice&&!editing&&!contextId&&!searchOpen}<div role="status" class="toast"><span>{notice}</span><button aria-label="Скрыть уведомление" onclick={()=>notice=''}>×</button></div>{/if}
 {#if !ready}<div class="empty"><h1>{fatal?'Карта не открыта':'Открываем вашу карту'}</h1><p>{fatal?'Данные не удалены. Закройте другую вкладку или повторите запуск.':'Локальные данные остаются на этом устройстве.'}</p></div>{:else}
 <Map {data} {selected} {lens} bind:camera providers={runtime.providers} {prefs} providerVersion={registry} paused={Boolean(activeView||editing||settings||contextId||menu||workspaces||branch.length)} onviewport={(size:any)=>view=size} {revealRequest} onselect={id=>{intent.select(id);contextId='';saveCamera();}} onhover={id=>intent.hover(id)} onopen={open} oncontext={id=>{editing=null;intent.select(id);contextId=id;menu=false;}} onbranch={ids=>branch=ids} oncreate={(x,y)=>create(x,y)} onpositions={(positions,manual)=>core.positions(positions,manual)} onstate={changeState} oncamera={saveCamera} onerror={e=>error=e.message}/>
 {#if !data.atoms.length}<div class="empty"><small>ВАШЕ ПРОСТРАНСТВО ДЛЯ МЫСЛЕЙ</small><h1>Всё начинается<br/>с одной мысли.</h1><p>Запишите её. Свяжи с другой.<br/>Постепенно появится ваша карта.</p><button onclick={()=>create()}>+ Первый атом</button></div>{/if}
 {#if data.atoms.length&&lens==='now'&&!data.atoms.some(a=>a.state==='now')}<div class="empty lens-empty"><h2>Что важно сейчас?</h2><p>Выберите атом на карте и измените его состояние на «Сейчас».</p><button onclick={()=>{lens='all';saveCamera();}}>Посмотреть всю карту</button></div>{/if}
 {#if contextId&&current}<ContextMenu atom={current} pinning={prefs.pinning} onappearance={async appearance=>{await core.update(contextId,{appearance});closeContext();}} ondelete={async()=>{await removeAtom(contextId);closeContext();}} onclose={closeContext} onstate={async s=>{await changeState(contextId,s);closeContext();}} onpin={async()=>{try{await core.setPinned(contextId,!current.pinned);closeContext();}catch(e){error=(e as Error).message;}}} onedit={section=>open(contextId,section)} oncreate={()=>create()} onimportance={async importance=>{try{await core.update(contextId,{importance});closeContext();}catch(e){error=(e as Error).message;}}}/>{/if}
 <footer><button class="storage-status" onclick={()=>settings=true}>{data.atoms.length} атомов · {data.links.length} связей <span>· {offlineReady?'готово offline':'локально'}{persistent?' · защищено':''}</span></button><nav aria-label="Линзы карты">{#each [['now','Сейчас'],['all','Всё'],['archived','Архив']] as [s,label]}<button class:active={lens===s} aria-pressed={lens===s} onclick={()=>{lens=s;saveCamera();}}>{label}</button>{/each}</nav></footer>
 {/if}
 {#if menu}<div class="main-menu" use:surface={{close:()=>menu=false}}>{#key registry}{#each [...runtime.commands.values()] as c}<button onclick={()=>command(c)}>{c.name}</button>{/each}{#each [...runtime.layouts.values()] as l}<button onclick={()=>layout(l.id)}>{l.name}</button>{/each}{#if selected}{#each [...runtime.actions.values()] as c}<button onclick={()=>command(c)}>{c.name}</button>{/each}{/if}{#each [...runtime.views.values()] as v}<button onclick={async()=>{menu=false;try{activeView=v;}catch(e){error=(e as Error).message;}}}>{v.name}</button>{/each}{/key}{#if installEvent}<button onclick={async()=>{await installEvent.prompt();installEvent=null;menu=false;}}>Установить приложение</button>{/if}<button onclick={()=>{settings=true;menu=false;}}>Настройки и резервные копии</button></div>{/if}
 {#if editing}{#key editing}<Editor initial={$state.snapshot(editing)} {data} types={typeList} {parent} {prefs} section={editorSection} storage={core.storage} onopen={open} onsave={save} onclose={closeEditor} ondelete={removeAtom}/>{/key}{/if}
 {#if branch.length}<BranchMenu ids={branch} pinned={branch.every(id=>data.atoms.find(a=>a.id===id)?.pinned)} onaction={action=>core.group(branch,action)} onclose={()=>branch=[]}/>{/if}
 {#if workspaces}<Workspaces storage={core.storage as SQLiteAdapter} onclose={async()=>{workspaces=false;const spaces=await (core.storage as SQLiteAdapter).workspaces();workspaceName=spaces.items.find(w=>w.id===spaces.current)?.name||'Основное';}}/>{/if}
 {#if settings}<Settings {core} {runtime} {persistent} {prefs} onclose={()=>settings=false} onpersist={persist} onnotify={notify}/>{/if}
 {#if activeView}<PluginView view={activeView} onclose={()=>activeView=null}/>{/if}
</main>
