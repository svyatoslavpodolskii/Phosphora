<script lang="ts">
 import type {GraphProviders} from '../graph/providers';
 import type {Core} from '../core/core';
 import type {Preferences} from '../core/preferences';
 import {PRESETS,PHYSICS_RANGES,type PhysicsSettings} from '../graph/physics';
 let {core,prefs,providers,onerror}:{core:Core;prefs:Preferences;providers:GraphProviders;onerror:(e:Error)=>void}=$props();
 const fields:Record<keyof PhysicsSettings,string>={elasticity:'Упругость',repulsion:'Разделение при контакте',distance:'Длина связей',damping:'Сохранение движения',inertia:'Инерция',friction:'Устойчивость после перемещения'};
 async function set(patch:Partial<Preferences>){try{await core.setPreferences({...$state.snapshot(prefs),...patch});}catch(e){onerror(e as Error);}}
</script>
<section><small>ПОВЕДЕНИЕ КАРТЫ</small>{#if providers.structure.size>1}<div class="preset-options" role="group" aria-label="Модель карты">{#each [...providers.structure.values()] as model}<button aria-pressed={providers.structural(prefs.graphModel)?.id===model.id} class:active={providers.structural(prefs.graphModel)?.id===model.id} onclick={()=>set({graphModel:model.id,physics:{...model.defaults}})}>{model.name}</button>{/each}</div><p class="muted">{providers.structural(prefs.graphModel)?.description}</p>{/if}<label>Закрепление атомов<input type="checkbox" checked={prefs.pinning} onchange={e=>set({pinning:e.currentTarget.checked})}/></label>
 <details><summary>Расширенные настройки физики</summary><div class="details-body">{#each Object.entries(PHYSICS_RANGES) as [key,range]}<label class="stack">{fields[key as keyof PhysicsSettings]} · {prefs.physics[key as keyof PhysicsSettings]}<input aria-label={fields[key as keyof PhysicsSettings]} type="range" min={range[0]} max={range[1]} step={(range[1]-range[0])/100} value={prefs.physics[key as keyof PhysicsSettings]} onchange={e=>set({physics:{...prefs.physics,[key]:Number(e.currentTarget.value)}})}/></label>{/each}</div></details>
</section>
<section><small>СВЯЗИ ИЗ ТЕКСТА</small><label>Режим <select aria-label="Режим автосвязей" value={prefs.linkMode} onchange={e=>set({linkMode:e.currentTarget.value as Preferences['linkMode']})}><option value="suggest">Предлагать</option><option value="automatic">Автоматически</option><option value="off">Выключено</option></select></label><p>Автоматически сохраняются только точные совпадения. Похожие имена всегда требуют вашего выбора.</p></section>
