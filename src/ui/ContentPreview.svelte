<script lang="ts">
 import {marked} from 'marked';
 import {onMount} from 'svelte';
 import {sanitizeHTML} from './markdown';
 import type {Preview} from '../graph/previews';
 let {preview,onheight}:{preview:Preview;onheight:(id:string,height:number)=>void}=$props();
 let body:HTMLDivElement;
 onMount(()=>{const observer=new ResizeObserver(()=>onheight(preview.id,body.scrollHeight));observer.observe(body);return()=>observer.disconnect();});
 // Recompute only when content changes, never for camera movement or physics frames.
 const content=$derived(preview.content);
 const html=$derived(sanitizeHTML(marked.parse(content.slice(0,12000),{async:false}) as string));
</script>
<div class="content-preview" inert data-atom={preview.id} style:left={`${preview.x}px`} style:top={`${preview.y}px`} style:width={`${preview.width}px`} style:max-height={`${preview.height}px`} style:opacity={preview.opacity}>
 <div class="preview-markdown" bind:this={body}>{@html html}</div>
</div>
<style>
 .content-preview{position:absolute;pointer-events:none;overflow:hidden;color:var(--theme-text);font:14px/1.55 system-ui;mask-image:linear-gradient(to bottom,#000 calc(100% - 16px),transparent);background:color-mix(in srgb,var(--theme-background) 94%,transparent);border-radius:8px;padding:0 8px;box-sizing:border-box;contain:layout paint;}
 .preview-markdown :global(p),.preview-markdown :global(ul),.preview-markdown :global(ol),.preview-markdown :global(pre),.preview-markdown :global(blockquote){margin:0 0 .55em;}
 .preview-markdown :global(h1),.preview-markdown :global(h2),.preview-markdown :global(h3),.preview-markdown :global(h4){font-size:1.05em;line-height:1.4;margin:0 0 .45em;}
 .preview-markdown :global(ul),.preview-markdown :global(ol){padding-left:1.4em;}
 .preview-markdown :global(a){color:var(--theme-accent);text-decoration:underline;}
 .preview-markdown :global(code){font: .9em ui-monospace,monospace;background:color-mix(in srgb,var(--theme-text) 8%,transparent);border-radius:3px;padding:1px 3px;}
 .preview-markdown :global(pre){white-space:pre-wrap;overflow-wrap:anywhere;}
 .preview-markdown :global(blockquote){border-left:2px solid var(--theme-accent);padding-left:10px;color:var(--theme-muted);}
 .preview-markdown :global(input){display:inline-block;width:13px;height:13px;min-height:0;padding:0;margin:0 4px 0 0;vertical-align:baseline;accent-color:var(--theme-accent);}
 .preview-markdown{overflow-wrap:anywhere;}
</style>
