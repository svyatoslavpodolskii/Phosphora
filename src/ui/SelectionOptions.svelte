<script lang="ts">
 import AppearancePicker from './AppearancePicker.svelte';
 import type {Atom,Appearance} from '../core/model';
 let {onpatch,busy=$bindable(false)}:{onpatch:(patch:Partial<Pick<Atom,'importance'|'appearance'>>)=>Promise<void>;busy?:boolean}=$props();
 let appearance=$state<Appearance>({});let error=$state('');
 async function apply(patch:Partial<Pick<Atom,'importance'|'appearance'>>){busy=true;error='';try{await onpatch(patch);}catch(e){error=(e as Error).message;}finally{busy=false;}}
</script>
<details><summary>Важность и оформление</summary>
 <div class="button-wrap" role="group" aria-label="Важность выделения">{#each ['Обычный','Важный','Ключевой'] as name,importance}<button disabled={busy} onclick={()=>apply({importance})}>{name}</button>{/each}</div>
 <AppearancePicker bind:value={appearance} title="Выделенные атомы"/>
 <button disabled={busy} onclick={()=>apply({appearance:$state.snapshot(appearance)})}>Применить оформление ко всем</button>
 {#if error}<p role="alert">{error}</p>{/if}
</details>
