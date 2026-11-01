import {Extension,Node,mergeAttributes,type JSONContent} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {Markdown,type MarkdownManager} from '@tiptap/markdown';
import {Marked,type Token} from 'marked';

/** Wiki references are atoms, never escaped text or rewritten URLs. */
export const WikiReference=Node.create({
 name:'wikiReference',group:'inline',inline:true,atom:true,
 addAttributes(){return{raw:{default:''},target:{default:''},label:{default:''}};},
 parseHTML(){return[{tag:'span[data-wiki-reference]'}];},
 renderHTML({node,HTMLAttributes}){return['span',mergeAttributes(HTMLAttributes,{'data-wiki-reference':node.attrs.target,role:'link',tabindex:'0'}),node.attrs.label];},
 markdownTokenizer:{name:'wikiReference',level:'inline',start:src=>src.search(/!?\[\[/),tokenize(src){const m=/^(!?)\[\[([^\]\n]+)\]\]/.exec(src);if(m)return{type:'wikiReference',raw:m[0],target:m[2].split('|')[0],label:m[2].split('|')[1]||m[2]};}},
 markdownTokenName:'wikiReference',
 parseMarkdown(token){return{type:'wikiReference',attrs:{raw:token.raw,target:token.target,label:token.label}};},
 renderMarkdown(node){return String(node.attrs?.raw||'');},
});

/** Unknown syntax is visible and removable, but its source never passes through HTML. */
export const SourceBlock=Node.create({
 name:'sourceBlock',group:'block',atom:true,selectable:true,
 addAttributes(){return{raw:{default:''}};},
 parseHTML(){return[{tag:'div[data-source-block]'}];},
 renderHTML({node}){return['div',{'data-source-block':'',contenteditable:'false'},['small',{},'Markdown · редактируется в исходнике'],['pre',{},node.attrs.raw]];},
 renderMarkdown(node){return String(node.attrs?.raw||'');},
});

const SourceIdentity=Extension.create({
 name:'sourceIdentity',
 addGlobalAttributes(){return[{types:['paragraph','heading','bulletList','orderedList','taskList','blockquote','codeBlock','horizontalRule','sourceBlock'],attributes:{sourceKey:{default:null,rendered:false}}}];},
});

export function richExtensions(){return[StarterKit.configure({underline:false,trailingNode:false,link:{openOnClick:false,autolink:false,linkOnPaste:false}}),TaskList,TaskItem.configure({nested:true}),WikiReference,SourceBlock,SourceIdentity,Markdown];}

const lexer=new Marked();
const supported=new Set(['space','paragraph','text','heading','blockquote','list','list_item','code','hr','strong','em','codespan','br','del','link','escape']);
function supportedToken(token:Token):boolean{
 if(!supported.has(token.type))return false;
 // Preserve dialect-specific syntax and ambiguous soft breaks in source blocks.
 if(token.type!=='code'&&(/\$|==|\^\^|%%|^>\s*\[!|\[\^|^\s*\[.+\]:|\s\^[\w-]+\s*$/m.test(token.raw)))return false;
 const nested=token as Token&{tokens?:Token[];items?:Token[]};
 return [...(nested.tokens||[]),...(nested.items||[])].every(supportedToken);
}
function fingerprint(node:JSONContent):string{
 const copy=structuredClone(node);
 function strip(n:JSONContent){if(n.attrs){delete n.attrs.sourceKey;if(!Object.keys(n.attrs).length)delete n.attrs;}n.content?.forEach(strip);}
 strip(copy);return JSON.stringify(copy);
}
type Original={raw:string;json:string};

/** Source ownership stays in this editor session; the persisted format remains Markdown. */
export class MarkdownSession{
 private originals=new Map<string,Original>();
 private source='';private baseline='';private prefix='';private eol='\n';
 load(source:string,manager:MarkdownManager):JSONContent{
  this.source=source;this.originals.clear();this.prefix='';this.baseline='';this.eol=source.includes('\r\n')?'\r\n':'\n';
  // Marked normalizes CRLF. Keep an offset map back into the original bytes.
  let normalized='';const offsets:number[]=[];
  for(let i=0;i<source.length;i++){offsets.push(i);if(source[i]==='\r'){normalized+='\n';if(source[i+1]==='\n')i++;}else normalized+=source[i];}offsets.push(source.length);
  const tokens=lexer.lexer(normalized);
  const frontmatter=/^---\s*\n[\s\S]*?\n(?:---|\.\.\.)\s*(?:\n|$)/.test(normalized);
  // Definitions and frontmatter have no complete token representation. Preserve the whole source.
  if(frontmatter||tokens.map(t=>t.raw).join('')!==normalized)return this.document([this.block(source)]);
  const content:JSONContent[]=[];let offset=0;
  for(const token of tokens){
   const raw=source.slice(offsets[offset],offsets[offset+token.raw.length]);offset+=token.raw.length;
   if(token.type==='space'){const previous=content.at(-1),key=previous?.attrs?.sourceKey;if(key){this.originals.get(key)!.raw+=raw;if(previous.type==='sourceBlock')previous.attrs!.raw+=raw;}else this.prefix+=raw;continue;}
   // A task list may parse as several blocks (mixed checkboxes/bullets); preserve those intact.
   let nodes:JSONContent[]=[];
   if(supportedToken(token))try{nodes=manager.parse(token.raw).content||[];}catch{ /* Use the protected source block below. */ }
   const node=nodes.length===1?nodes[0]:{type:'sourceBlock',attrs:{raw}};
   const key=crypto.randomUUID();node.attrs={...node.attrs,sourceKey:key};
   this.originals.set(key,{raw,json:''});content.push(node);
  }
  return this.document(content);
 }
 private block(raw:string):JSONContent{const key=crypto.randomUUID();this.originals.set(key,{raw,json:''});return{type:'sourceBlock',attrs:{raw,sourceKey:key}};}
 private document(content:JSONContent[]):JSONContent{return{type:'doc',content:content.length?content:[{type:'paragraph'}]};}
 capture(doc:JSONContent){this.baseline=fingerprint(doc);for(const node of doc.content||[]){const original=this.originals.get(node.attrs?.sourceKey);if(original)original.json=fingerprint(node);}}
 serialize(doc:JSONContent,manager:MarkdownManager):string{
  if(fingerprint(doc)===this.baseline)return this.source;
  let result=this.prefix;let previousChanged=false;const used=new Set<string>();
  for(const node of doc.content||[]){
   const key=node.attrs?.sourceKey as string|undefined,original=key&&!used.has(key)?this.originals.get(key):undefined;if(key)used.add(key);
   const unchanged=original?.json===fingerprint(node);
   let raw:string;
   if(unchanged)raw=original!.raw;
   else if(node.type==='sourceBlock')raw=String(node.attrs?.raw||'');
   else{
    raw=manager.serialize({type:'doc',content:[node]}).replace(/\r?\n/g,this.eol);
    if(original)raw+=original.raw.match(/(?:\r?\n)*$/)?.[0]||'';
   }
   if(result&&raw&&(previousChanged||!unchanged)){const trailing=result.match(/(?:\r?\n)*$/)?.[0]||'';if(trailing.replace(/\r/g,'').length<2)result+=this.eol.repeat(2-trailing.replace(/\r/g,'').length);}
   result+=raw;previousChanged=!unchanged;
  }
  return result;
 }
}
