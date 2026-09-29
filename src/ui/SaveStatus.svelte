<script lang="ts">
 import {onMount} from 'svelte';import {observeSave,type SaveStatus} from '../storage/status';
 let status=$state<SaveStatus>({pending:0}),open=$state(false),hover=$state(false);
 onMount(()=>observeSave(value=>status=value));
 const title=$derived(status.error?'Не удалось сохранить':status.pending?'Сохраняем…':'Сохранено локально');
</script>
<svelte:window onpointerdown={e=>{if(!(e.target as Element).closest('.save-status'))open=false;}} onkeydown={e=>{if(e.key==='Escape')open=false;}}/>
<div class="save-status" onpointerenter={()=>hover=true} onpointerleave={()=>hover=false} role="presentation">
 <button class:error={Boolean(status.error)} aria-label={status.error?'Не удалось сохранить':'Сохранение на устройстве'} aria-expanded={open||hover} onclick={()=>open=!open}><span aria-hidden="true">{status.error?'!':'✓'}</span></button>
 {#if open||hover}<div class="save-popover" role="status"><strong>{title}</strong><p>{status.error||'Изменения хранятся на этом устройстве.'}</p>{#if status.at}<small>Последнее сохранение: {new Date(status.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small>{/if}</div>{/if}
</div>
