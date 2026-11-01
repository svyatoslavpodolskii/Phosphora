<script lang="ts">
 import {iconDefinition} from '../core/icons';
 let {value,size=20}:{value:string;size?:number}=$props();
 const icon=$derived(iconDefinition(value));
</script>
{#if icon}<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={icon.path}/></svg>{:else}<span aria-hidden="true">{value}</span>{/if}
