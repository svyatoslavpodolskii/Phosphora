import type {Plugin,PluginAPI} from './api';
import type {DraftPolicy,DraftLink} from '../core/drafts';
import {references,resolveAtom} from '../core/vault';

export function vaultPaths(app:PluginAPI):DraftPolicy{return {id:'paths',name:'Vault source paths',async prepare({atom,before,data,parent}){
 if(before||atom.properties.vault)return {};
 const connected=await app.storage.get<{vault:string}[]>('direct-vaults')||[];
 const parentSource=data.atoms.find(a=>a.id===parent)?.properties.vault as {vault?:string}|undefined;
 const source=parentSource?.vault||(connected.length===1?connected[0].vault:undefined);
 if(!source)return {};
 let name=atom.title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().replace(/[. ]+$/,'')||'Note';
 if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='_'+name;
 const used=new Set(data.atoms.flatMap(a=>{const v=a.properties.vault as {vault?:string;path?:string}|undefined;return v?.vault===source&&typeof v.path==='string'?[v.path.toLocaleLowerCase('en-US')]:[];}));
 let path=name+'.md',suffix=1;while(used.has(path.toLocaleLowerCase('en-US')))path=name+' '+(++suffix)+'.md';
 return {properties:{vault:{vault:source,path}}};
}};}

export const markdownReferences:DraftPolicy={id:'references',name:'Markdown references',prepare({atom,before,data,add,remove,rejected}){
 if(before&&before.content===atom.content)return {};
 const mentioned=new Set(references(atom.content).map(ref=>resolveAtom(ref,atom,data.atoms)?.id).filter((id):id is string=>Boolean(id)));
 const removed=before?data.links.filter(l=>l.from===atom.id&&l.source==='markdown'&&!mentioned.has(l.to)&&!remove.includes(l.id)).map(l=>l.id):[];
 const targets=new Set(add.map(l=>l.to)),links:DraftLink[]=[];
 for(const id of mentioned)if(id!==atom.id&&!targets.has(id)&&!rejected.includes(id)&&!data.links.some(l=>(l.from===atom.id&&l.to===id)||(l.to===atom.id&&l.from===id))){targets.add(id);links.push({to:id,relation:'related',source:'markdown'});}
 return {add:links,remove:removed};
}};

/** First extracted policy; Vault adapters will join this same lifecycle. */
export const obsidian:Plugin={manifest:{id:'builtin.obsidian',name:'Obsidian',version:'1.0.0',apiVersion:1,permissions:['atoms.read','atoms.write','links.read','links.write','storage'],description:'Совместимость с Markdown и Obsidian.'},activate(app){app.atoms.registerDraftPolicy(vaultPaths(app));app.atoms.registerDraftPolicy(markdownReferences);}};
