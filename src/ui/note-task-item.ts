import TaskItem from '@tiptap/extension-task-item';
import {renderNestedMarkdownContent} from '@tiptap/core';
/** #task stays portable Markdown, but never becomes editable label text. */
export const NoteTaskItem=TaskItem.extend({
 addAttributes(){return {...this.parent?.(),noteTask:{default:false,keepOnSplit:true,parseHTML:element=>element.getAttribute('data-note-task')==='true',renderHTML:attrs=>({'data-note-task':String(Boolean(attrs.noteTask))})}};},
 parseMarkdown(token,h){
  const marked=/^#task(?:\s+|$)/.test(token.text||'');let tokens=structuredClone(token.tokens||[]);
  if(marked){let remaining=(token.text||'').match(/^#task(?:\s+|$)/)![0].length;tokens=tokens.flatMap((item:any)=>{if(remaining&&item.type==='text'){const text=item.text||item.raw||'',n=Math.min(remaining,text.length);remaining-=n;return text.length>n?[{...item,text:text.slice(n),raw:(item.raw||text).slice(n)}]:[];}return[item];});}
  const content=[h.createNode('paragraph',{},tokens.length?h.parseInline(tokens):[])];if(token.nestedTokens?.length)content.push(...h.parseChildren(token.nestedTokens));
  return h.createNode('taskItem',{checked:Boolean(token.checked),noteTask:marked},content);
 },
 renderMarkdown(node,h){return renderNestedMarkdownContent(node,h,`- [${node.attrs?.checked?'x':' '}] ${node.attrs?.noteTask?'#task ':''}`,undefined,{indentMainContent:true});},
 addKeyboardShortcuts(){return {...this.parent?.(),Backspace:()=>{const {$from,empty}=this.editor.state.selection;if(empty&&$from.parentOffset===0&&this.editor.isActive('taskItem'))return this.editor.commands.liftListItem('taskItem');return false;}};},
 addNodeView(){const base=this.parent?.();if(!base)return null;return props=>{const result=base(props),dom=result.dom as HTMLElement;dom.dataset.type='taskItem';const indicator=document.createElement('span');indicator.className='task-indicator';indicator.contentEditable='false';indicator.title='Задача в канбане';indicator.setAttribute('aria-hidden','true');indicator.innerHTML='<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14V2h8l-2 3 2 3H4"/></svg>';dom.querySelector('label')?.append(indicator);
   const update=result.update;return {...result,update(node,...args){return update?.(node,...args)??true;}};
  };},
}).configure({nested:true});
