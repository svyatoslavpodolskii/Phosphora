import {it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {Core} from '../src/core/core';
import {migrate,type Database} from '../src/storage/schema';
import {snapshot,transact} from '../src/storage/operations';
import {PluginRuntime} from '../src/plugins/runtime';
import {obsidian} from '../src/plugins/obsidian';
import {DIRECT_VAULTS_KEY,migrateObsidianBindings} from '../src/plugins/obsidian-storage';
import type {Plugin,PluginAPI} from '../src/plugins/api';

async function setup(){
 const raw=new DatabaseSync(':memory:');const db:Database={exec(q){if(typeof q==='string')raw.exec(q);else raw.prepare(q.sql).run(...q.bind||[]);},selectValue(q,b=[]){const row=raw.prepare(q).get(...b);return row?Object.values(row)[0]:undefined;},selectObjects(q,b=[]){return raw.prepare(q).all(...b);}};migrate(db);
 const core=new Core({open:async()=>{},snapshot:async()=>snapshot(db),transaction:async ops=>transact(db,ops),getSetting:async key=>{const value=db.selectValue('SELECT value FROM settings WHERE key=?',[key]);return value===undefined?undefined:JSON.parse(value);},close:()=>raw.close(),exportDatabase:async()=>new Uint8Array()});await core.init();core.prefs.linkMode='off';
 const runtime=new PluginRuntime(core,{focus:()=>{},notify:()=>{},changed:()=>{}});
 return {core,runtime,close(){runtime.dispose();raw.close();}};
}
const manifest={id:'test.drafts',name:'Draft policy',version:'1',apiVersion:1,permissions:['atoms.read','atoms.write','links.read','links.write']} satisfies Plugin['manifest'];

it('moves a selection atomically, preserves its internal group and rejects cycles',async()=>{
 const h=await setup();try{
  const old=await h.core.create({title:'Old'}),target=await h.core.create({title:'Target'}),root=await h.core.create({title:'Root'}),child=await h.core.create({title:'Child'});
  await h.core.link(old.id,root.id,'grouped');await h.core.link(root.id,child.id,'grouped');await h.core.link(root.id,old.id,'related');
  await h.core.moveInto([root.id,child.id],target.id);
  expect(h.core.data.links.filter(l=>l.relation==='grouped').map(l=>[l.from,l.to])).toEqual([[root.id,child.id],[target.id,root.id]]);
  expect(h.core.data.links.some(l=>l.relation==='related'&&l.to===old.id)).toBe(true);
  const before=JSON.stringify(h.core.data);await expect(h.core.moveInto([target.id],child.id)).rejects.toThrow();expect(JSON.stringify(h.core.data)).toBe(before);
  await h.core.groupUpdate([root.id,child.id],{importance:2,appearance:{color:'#eda8ae'}});expect(h.core.data.atoms.filter(a=>[root.id,child.id].includes(a.id)).every(a=>a.importance===2&&a.appearance.color==='#eda8ae')).toBe(true);expect(h.core.data.atoms.find(a=>a.id===target.id)?.importance).toBe(0);
 }finally{h.close();}
});
it('map tool registrations require graph permission and disappear when disabled',async()=>{
 const h=await setup();try{
  const plugin:Plugin={manifest:{id:'test.map-tools',name:'Tools',version:'1',apiVersion:1,permissions:['graph']},activate:app=>{app.graph.registerMapTool({id:'selection',name:'Selection',kind:'lasso'});}};
  await h.runtime.enable(plugin);expect(h.runtime.providers.hasTool('lasso')).toBe(true);h.runtime.disable(plugin.manifest.id);expect(h.runtime.providers.hasTool('lasso')).toBe(false);
  await expect(h.runtime.enable({...plugin,manifest:{...plugin.manifest,permissions:[]}})).rejects.toThrow('graph');expect(h.runtime.providers.tools.size).toBe(0);
 }finally{h.close();}
});

it('migrates bindings once and delegates unique file naming to the enabled plugin',async()=>{
 const h=await setup();try{
  const bindings=[{vault:'source',name:'Existing',files:{'old.md':{disk:'disk-hash',local:'local-hash'}}}];
  await h.core.storage.transaction([{kind:'setting',key:'direct-vaults',value:bindings}]);
  await migrateObsidianBindings(h.core.storage);expect(await h.core.storage.getSetting(DIRECT_VAULTS_KEY)).toEqual(bindings);
  expect(await h.core.storage.getSetting('direct-vaults')).toEqual(bindings);
  await h.runtime.enable(obsidian);
  const a=await h.core.create({title:'File',properties:{custom:42}}),b=await h.core.create({title:'file'}),reserved=await h.core.create({title:'CON'});
  expect(a.properties).toEqual({custom:42,vault:{vault:'source',path:'File.md'}});expect(b.properties.vault).toEqual({vault:'source',path:'file 2.md'});expect(reserved.properties.vault).toEqual({vault:'source',path:'_CON.md'});
  const explicit=await h.core.create({title:'Imported',properties:{vault:{vault:'elsewhere',path:'Nested/original.md'}}});expect(explicit.properties.vault).toEqual({vault:'elsewhere',path:'Nested/original.md'});
  await h.core.update(a.id,{title:'Renamed'});expect(h.core.data.atoms.find(n=>n.id===a.id)?.properties.vault).toEqual(a.properties.vault);
  h.runtime.disable(obsidian.manifest.id);const disabled=await h.core.create({title:'Core only'});expect(disabled.properties.vault).toBeUndefined();
  await h.core.storage.transaction([{kind:'setting',key:DIRECT_VAULTS_KEY,value:[]}]);await migrateObsidianBindings(h.core.storage);expect(await h.core.storage.getSetting(DIRECT_VAULTS_KEY)).toEqual([]);
 }finally{h.close();}
});
it('uses parent source when several folders are connected and leaves unassigned notes alone',async()=>{
 const h=await setup();try{
  await h.core.storage.transaction([{kind:'setting',key:DIRECT_VAULTS_KEY,value:[{vault:'one'},{vault:'two'}]}]);await h.runtime.enable(obsidian);
  const root=await h.core.create({title:'Parent',properties:{vault:{vault:'two',path:'Parent.md'}}});
  const child=await h.core.create({title:'Child'},root.id),loose=await h.core.create({title:'Loose'});
  expect(child.properties.vault).toEqual({vault:'two',path:'Child.md'});expect(loose.properties.vault).toBeUndefined();
 }finally{h.close();}
});

it('core works alone; enabling and disabling Markdown policy preserves canonical data',async()=>{
 const h=await setup();try{
  const target=await h.core.create({title:'Target'}),note=await h.core.create({title:'Note',content:'[[Target]]',properties:{unknown:'preserved'}});
  expect(h.core.data.links).toHaveLength(0);
  await h.runtime.enable(obsidian);await h.core.update(note.id,{content:'[[Target]] updated'});expect(h.core.data.links).toHaveLength(1);
  expect(h.core.data.links[0]).toMatchObject({from:note.id,to:target.id,source:'markdown'});
  h.runtime.disable(obsidian.manifest.id);await h.core.update(note.id,{content:'Unlinked text'});expect(h.core.data.links).toHaveLength(1);
  expect(h.core.data.atoms.find(a=>a.id===note.id)?.properties).toEqual({unknown:'preserved'});
  await h.runtime.enable(obsidian);await h.core.update(note.id,{content:'No reference now'});expect(h.core.data.links).toHaveLength(0);
  await h.core.link(note.id,target.id);await h.core.update(note.id,{content:'Manual links remain'});expect(h.core.data.links).toHaveLength(1);
 }finally{h.close();}
});
it('policy effects and the draft commit together, and a later failure writes nothing',async()=>{
 const h=await setup();try{
  const target=await h.core.create({title:'Target'});
  await h.runtime.enable({manifest:{...manifest,permissions:[...manifest.permissions,'settings']},async activate(app){await app.settings.set('value',42);app.atoms.registerDraftPolicy({id:'decorate',name:'Decorate',async prepare(context){context.atom.title='Not a patch';return {properties:{custom:await app.settings.get('value')},add:[{to:target.id,relation:'related',source:'test'}]};}});}});
  const note=await h.core.create({title:'Original'});expect(note.title).toBe('Original');expect(note.properties.custom).toBe(42);expect(h.core.data.links).toHaveLength(1);
  const off=h.core.drafts.register({id:'failure',name:'Failure',prepare(){throw Error('policy failure');}});
  const before=structuredClone(h.core.data);await expect(h.core.update(note.id,{content:'must not commit'})).rejects.toThrow('policy failure');expect(h.core.data).toEqual(before);expect(await h.core.storage.snapshot()).toEqual(before);off();
 }finally{h.close();}
});
it('requires all data permissions and prevents reentrant writes from a policy',async()=>{
 const h=await setup();try{
  await expect(h.runtime.enable({manifest:{...manifest,permissions:['atoms.write']},activate(app){app.atoms.registerDraftPolicy({id:'bad',name:'Bad',prepare:()=>({})});}})).rejects.toThrow('atoms.read');
  await h.runtime.enable({manifest,activate(app){app.atoms.registerDraftPolicy({id:'nested',name:'Nested',async prepare(){await app.atoms.create({title:'Nested'});return {};}});}});
  await expect(h.core.create({title:'Outer'})).rejects.toThrow('return effects');expect(h.core.data.atoms).toHaveLength(0);
 }finally{h.close();}
});
it('rejects effects from a plugin disabled while its asynchronous policy was running',async()=>{
 const h=await setup();let release!:()=>void,started!:()=>void;const running=new Promise<void>(resolve=>started=resolve),gate=new Promise<void>(resolve=>release=resolve);
 try{
  await h.runtime.enable({manifest,activate(app){app.atoms.registerDraftPolicy({id:'slow',name:'Slow',async prepare(){started();await gate;return {properties:{late:true}};}});}});
  const saving=h.core.create({title:'Pending'});await running;h.runtime.disable(manifest.id);release();
  await expect(saving).rejects.toThrow('выключен');expect(h.core.data.atoms).toHaveLength(0);
  await h.core.create({title:'Recovered'});expect(h.core.data.atoms[0].properties).toEqual({});
 }finally{h.close();}
});
it('cannot remove links unrelated to the edited atom or introduce invalid targets',async()=>{
 const h=await setup();try{
  const a=await h.core.create({title:'A'}),b=await h.core.create({title:'B'}),link=await h.core.link(a.id,b.id);
  let off=h.core.drafts.register({id:'bad',name:'Bad',prepare:()=>({remove:[link.id]})});
  await expect(h.core.create({title:'C'})).rejects.toThrow('unrelated link');off();
  off=h.core.drafts.register({id:'bad',name:'Bad',prepare:()=>({add:[{to:'missing',relation:'related'}]})});
  await expect(h.core.create({title:'C'})).rejects.toThrow('target');off();expect(h.core.data.atoms).toHaveLength(2);expect(h.core.data.links).toHaveLength(1);
 }finally{h.close();}
});

it('pause preserves each source state across edits, refresh and bulk resume',async()=>{
 const h=await setup();try{
  const now=await h.core.create({title:'Active',state:'now'}),archived=await h.core.create({title:'Past',state:'archived'});
  await h.core.group([now.id,archived.id],'paused');
  await h.core.setState(now.id,'paused'); // Idempotent plugin API call.
  await h.core.update(now.id,{content:'Edited while paused'});await h.core.refresh();
  expect(h.core.data.atoms.find(a=>a.id===now.id)).toMatchObject({state:'now',paused:true});
  await h.core.group([now.id,archived.id],'resume');
  expect(h.core.data.atoms.find(a=>a.id===now.id)?.state).toBe('now');
  expect(h.core.data.atoms.find(a=>a.id===archived.id)?.state).toBe('archived');
  expect(h.core.data.atoms.every(a=>!('phosphora.pauseState' in a.properties))).toBe(true);
  await h.core.setPaused(now.id,true);await h.core.setState(now.id,'archived');expect(h.core.data.atoms.find(a=>a.id===now.id)).toMatchObject({state:'archived',paused:true});await h.core.group([now.id],'resume');
  expect(h.core.data.atoms.find(a=>a.id===now.id)?.state).toBe('archived');
  const legacy=await h.core.create({title:'Legacy paused',state:'paused'});await h.core.group([legacy.id],'resume');
  expect(h.core.data.atoms.find(a=>a.id===legacy.id)?.state).toBe('normal');
 }finally{h.close();}
});

it('exposes a permission-checked pause modifier through Plugin API',async()=>{
 const h=await setup();try{
  const atom=await h.core.create({title:'Plugin target',state:'now'});
  let api:PluginAPI;await h.runtime.enable({manifest:{...manifest,id:'test.pause'},activate(app){api=app;}});
  await api!.atoms.setPaused(atom.id,true);
  expect(h.core.data.atoms.find(a=>a.id===atom.id)).toMatchObject({state:'now',paused:true});
  let denied:PluginAPI;await h.runtime.enable({manifest:{...manifest,id:'test.pause-readonly',permissions:['atoms.read']},activate(app){denied=app;}});
  await expect(denied!.atoms.setPaused(atom.id,false)).rejects.toThrow();
  await api!.atoms.setPaused(atom.id,false);expect(h.core.data.atoms.find(a=>a.id===atom.id)).toMatchObject({state:'now',paused:false});
 }finally{h.close();}
});
