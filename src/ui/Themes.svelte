<script lang="ts">
 import {THEMES,currentTheme,parseTheme,themeFile} from '../core/themes';
 import ThemeEditor from './ThemeEditor.svelte';
 import {download} from '../core/backup';
 import type {Core} from '../core/core';
 import type {Preferences} from '../core/preferences';
 let {core,prefs}:{core:Core;prefs:Preferences}=$props();let error=$state('');let busy=$state(false);let editing=$state(false);
 async function run(fn:()=>Promise<void>){busy=true;error='';try{await fn();}catch(e){error=(e as Error).message;}finally{busy=false;}}
 async function choose(theme:string){await run(()=>core.setPreferences({...$state.snapshot(prefs),theme}));}
 async function importFile(e:Event){const input=e.currentTarget as HTMLInputElement;const file=input.files?.[0];input.value='';if(!file)return;await run(async()=>{if(file.size>16000)throw Error('Файл темы слишком большой.');const theme=parseTheme(await file.text());const customThemes=[...prefs.customThemes.filter(t=>t.id!==theme.id),theme];if(customThemes.length>30)throw Error('Можно сохранить до 30 тем.');await core.setPreferences({...$state.snapshot(prefs),theme:theme.id,customThemes});});}
</script>
<section class="themes-section"><small>ТЕМА</small>
{#if editing}<ThemeEditor {core} initial={$state.snapshot(currentTheme(prefs.theme,prefs.customThemes))} onclose={()=>editing=false}/>{:else}
<div class="theme-options">{#each [...THEMES,...prefs.customThemes] as theme}<button disabled={busy} aria-pressed={prefs.theme===theme.id} onclick={()=>choose(theme.id)} style:--sample-bg={theme.colors.background} style:--sample-fg={theme.colors.accent}><span class="theme-sample"><i></i><i></i><i></i></span>{theme.name}</button>{/each}</div>
<button class="theme-customize" disabled={busy} onclick={()=>editing=true}>Настроить тему</button>
<div class="button-wrap"><label class="file-button">Импорт темы<input aria-label="Импорт темы" type="file" accept=".phosphored-theme,.json" disabled={busy} onchange={importFile}/></label><button disabled={busy} onclick={()=>download('theme.phosphored-theme',themeFile(currentTheme(prefs.theme,prefs.customThemes)))}>Экспорт темы</button></div>
{#if prefs.theme.startsWith('custom-')}<button class="subtle" disabled={busy} onclick={()=>run(async()=>{await core.setPreferences({...$state.snapshot(prefs),theme:'phosphor',customThemes:prefs.customThemes.filter(t=>t.id!==prefs.theme)});})}>Удалить эту тему</button>{/if}{/if}
{#if error}<p role="alert">{error}</p>{/if}</section>
