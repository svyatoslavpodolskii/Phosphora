<script lang="ts">
 import {onMount} from 'svelte';
 import {Editor} from '@tiptap/core';
 import {MarkdownSession,richExtensions} from './rich-markdown';
 import type {Format} from './text-edit';
 let {value,onchange,onwiki,disabled=false}:{value:string;onchange:(markdown:string)=>void;onwiki:(target:string)=>void;disabled?:boolean}=$props();
 let host:HTMLDivElement;let editor:Editor|undefined;let lastValue='';let ready=$state(false);
 const session=new MarkdownSession();
 // A native click/Home can move the DOM caret before ProseMirror receives its
 // asynchronous selectionchange. A stale atomic-block selection would replace
 // that whole block on the first printable key. Reconcile only that case.
 function syncCaret(){
  if(!editor||editor.view.composing||editor.state.selection.empty)return;
  const view=editor.view,selection=view.dom.ownerDocument.getSelection(),node=selection?.anchorNode;
  if(!selection?.isCollapsed||!node||!view.dom.contains(node))return;
  const element=node.nodeType===3?node.parentElement:node as Element;
  if(element?.closest('[data-source-block]'))return;
  try{const position=view.posAtDOM(node,selection.anchorOffset);if(view.state.doc.resolve(position).parent.inlineContent)editor.commands.setTextSelection(position);}catch{/* A detached DOM selection is handled by ProseMirror's observer. */}
 }
 function load(markdown:string){if(!editor?.markdown)return;lastValue=markdown;editor.commands.setContent(session.load(markdown,editor.markdown),{emitUpdate:false});session.capture(editor.getJSON());}
 $effect(()=>{const content=value,blocked=disabled;if(ready&&editor){if(editor.isEditable===blocked)editor.setEditable(!blocked,false);if(content!==lastValue&&!editor.isFocused)load(content);}});
 export function focus(){editor?.view.focus();}
 export function format(kind:Format){
  if(!editor)return;editor.view.focus();const chain=editor.chain().focus();
  if(kind==='bold')chain.toggleBold().run();
  else if(kind==='italic')chain.toggleItalic().run();
  else if(kind==='heading')chain.toggleHeading({level:2}).run();
  else if(kind==='list')chain.toggleBulletList().run();
  else if(kind==='quote')chain.toggleBlockquote().run();
  else if(kind==='code')chain.toggleCode().run();
  else if(kind==='checkbox'||kind==='task'){
   chain.toggleTaskList().run();
   if(kind==='task'&&editor.isActive('taskItem')){
    const from=editor.state.selection.$from;
    if(!from.parent.textContent.startsWith('#task '))editor.chain().focus().insertContentAt(from.start(),'#task ').run();
   }
  }
 }
 export function insertWiki(raw:string,target:string,label:string){editor?.view.focus();editor?.chain().focus().insertContent({type:'wikiReference',attrs:{raw,target,label}}).run();}
 function wiki(e:MouseEvent|KeyboardEvent){if(e instanceof KeyboardEvent&&e.key!=='Enter')return;const target=(e.target as Element).closest<HTMLElement>('[data-wiki-reference]');if(target){e.preventDefault();onwiki(target.dataset.wikiReference!);}}
 onMount(()=>{
  editor=new Editor({element:host,extensions:richExtensions(),content:{type:'doc',content:[{type:'paragraph'}]},editorProps:{
   attributes:{role:'textbox','aria-label':'Визуальный текст','aria-multiline':'true'},
   handleKeyDown(_view,event){if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey)syncCaret();return false;},
   handlePaste(view,event){const text=event.clipboardData?.getData('text/plain');if(!text||!editor?.markdown)return false;const fragment=new MarkdownSession();editor.commands.insertContent(fragment.load(text,editor.markdown).content||[]);return true;},
  },onUpdate(){if(!editor?.markdown)return;const markdown=session.serialize(editor.getJSON(),editor.markdown);lastValue=markdown;onchange(markdown);}});
  load(value);ready=true;
  return()=>{ready=false;editor?.destroy();editor=undefined;};
 });
</script>
<!-- svelte-ignore a11y_click_events_have_key_events (Wiki links also handle Enter.) -->
<!-- svelte-ignore a11y_no_static_element_interactions (Delegates native editor and wiki-link input.) -->
<div class="rich-text note-content" bind:this={host} onclick={wiki} onkeydown={wiki}></div>
<style>
 .rich-text{overflow:auto;border:0;border-radius:0;padding:4px 0;background:var(--theme-surface);color:var(--theme-text);resize:vertical}
 .rich-text:focus-within{outline:none}
 .rich-text :global(.tiptap){outline:none;min-height:100%;overflow-wrap:anywhere;white-space:pre-wrap}
 .rich-text :global(.tiptap>p:first-child){margin-top:0}
 .rich-text :global(.tiptap p){font-size:inherit;line-height:inherit;margin:.5em 0}
 .rich-text :global(.tiptap h2){font-size:1.5em;margin:.75em 0 .4em}
 .rich-text :global(.tiptap a),.rich-text :global([data-wiki-reference]){color:var(--theme-accent);text-decoration:underline;cursor:pointer}
 .rich-text :global(.tiptap blockquote){border-left:3px solid var(--theme-accent);padding-left:14px;margin-left:0}
 .rich-text :global(.tiptap code){font-family:monospace;background:var(--theme-surfaceAlt);border-radius:4px;padding:2px 4px}
 .rich-text :global(.tiptap pre){background:var(--theme-surfaceAlt);padding:12px;white-space:pre-wrap;border-radius:8px}
 .rich-text :global(ul[data-type=taskList]){list-style:none;padding-left:0}
 .rich-text :global(li[data-type=taskItem]){display:flex;gap:10px;align-items:flex-start}
 .rich-text :global(li[data-type=taskItem]>label){flex:none;padding-top:4px}
 .rich-text :global(li[data-type=taskItem]>label input){min-height:20px;width:20px;height:20px;accent-color:var(--theme-accent)}
 .rich-text :global(li[data-type=taskItem]>div){flex:1;min-width:0}
 .rich-text :global([data-source-block]){border:1px dashed var(--theme-border);padding:10px;border-radius:8px;margin:12px 0;background:var(--theme-surfaceAlt)}
 .rich-text :global([data-source-block] small){color:var(--theme-muted);font-size:11px}
 .rich-text :global([data-source-block] pre){margin:6px 0 0;padding:0}
</style>
