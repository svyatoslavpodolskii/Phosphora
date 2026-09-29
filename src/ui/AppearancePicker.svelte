<script lang="ts">
 import {readable} from '../core/themes';
 import type {Appearance} from '../core/model';
 let {value=$bindable(),title,defaultShape='circle',defaultIcon='·'}:{value:Appearance;title:string;defaultShape?:string;defaultIcon?:string}=$props();
 const colors=[['#b4ecc1','Мята'],['#9bbef2','Небо'],['#d4a2e5','Сирень'],['#e9b482','Песок'],['#eda8ae','Роза'],['#dce4db','Жемчуг']];
 const shapes=[['circle','○','Круг'],['square','▢','Квадрат'],['diamond','◇','Ромб']] as const;
</script>
<div class="appearance-preview" role="img" aria-label={`Предпросмотр: ${title}`} style:--atom-color={value.color||'#b4ecc1'}>
 <div class="preview-orbit"><span class="preview-atom" class:square={(value.shape||defaultShape)==='square'} class:diamond={value.shape==='diamond'} class:dashed={value.style==='dashed'} style:--preview-size={`${value.size_override||32}px`}><span>{value.icon||defaultIcon}</span></span></div>
</div>
<div class="appearance-options">
 <div class="swatches" role="group" aria-label="Цвет атома">{#each colors as [color,name]}<button class="swatch" style:--swatch={color} style:color={readable(color,[color])} aria-label={name} aria-pressed={value.color===color} onclick={()=>value={...value,color}}>{value.color===color?'✓':''}</button>{/each}<label class="custom-color" title="Свой цвет"><span aria-hidden="true">＋</span><input aria-label="Цвет" type="color" value={value.color||'#b4ecc1'} oninput={e=>value={...value,color:e.currentTarget.value}}/></label></div>
 <div class="shape-options" role="group" aria-label="Форма атома">{#each shapes as [shape,icon,name]}<button aria-label={name} aria-pressed={(value.shape||defaultShape)===shape} onclick={()=>value={...value,shape}}><span aria-hidden="true">{icon}</span>{name}</button>{/each}</div>
 <div class="icon-options" role="group" aria-label="Знак атома">{#each ['·','✦','◎','✓','♡'] as icon}<button aria-label={`Знак ${icon}`} aria-pressed={(value.icon||defaultIcon)===icon} onclick={()=>value={...value,icon}}>{icon}</button>{/each}<input aria-label="Иконка" maxlength="16" placeholder="Свой" value={value.icon||''} oninput={e=>value={...value,icon:e.currentTarget.value}}/></div>
 <details class="appearance-fine"><summary>Размер и контур</summary><div class="details-body"><label>Размер<input aria-label="Размер атома" type="number" min="18" max="64" placeholder="Авто" value={value.size_override??''} oninput={e=>value={...value,size_override:e.currentTarget.value===''?undefined:Number(e.currentTarget.value)}}/></label><label>Контур<select aria-label="Контур" value={value.style||'solid'} onchange={e=>value={...value,style:e.currentTarget.value as Appearance['style']}}><option value="solid">Сплошной</option><option value="dashed">Пунктирный</option></select></label></div></details>
</div>
