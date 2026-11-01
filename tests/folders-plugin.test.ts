import {it,expect,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {Core} from '../src/core/core';
import {migrate,type Database} from '../src/storage/schema';
import {snapshot,transact} from '../src/storage/operations';
import {PluginRuntime} from '../src/plugins/runtime';
import {createFoldersPlugin} from '../src/plugins/folders';
import {FOLDER_DEFINITIONS,FOLDER_MEMBERSHIP,projectFolders} from '../src/graph/folders';

async function setup(){
 const raw=new DatabaseSync(':memory:');const db:Database={exec(q){if(typeof q==='string')raw.exec(q);else raw.prepare(q.sql).run(...q.bind||[]);},selectValue(q,b=[]){const row=raw.prepare(q).get(...b);return row?Object.values(row)[0]:undefined;},selectObjects(q,b=[]){return raw.prepare(q).all(...b);}};migrate(db);
 const core=new Core({open:async()=>{},snapshot:async()=>snapshot(db),transaction:async ops=>transact(db,ops),getSetting:async key=>{const value=db.selectValue('SELECT value FROM settings WHERE key=?',[key]);return value===undefined?undefined:JSON.parse(value);},close:()=>raw.close(),exportDatabase:async()=>new Uint8Array()});await core.init();core.prefs.linkMode='off';
 const notify=vi.fn(),changed=vi.fn(),focus=vi.fn(),requestCreate=vi.fn();let selected:string[]=[];
 const runtime=new PluginRuntime(core,{focus:()=>{},notify,changed:()=>{}});
 const {plugin,controller}=createFoldersPlugin({getSelection:()=>selected,changed,focus,requestCreate});
 await runtime.enable(plugin);
 return {core,runtime,plugin,controller,notify,changed,focus,requestCreate,select(ids:string[]){selected=ids;},close(){runtime.dispose();raw.close();}};
}
it('creates a folder atomically using one public update without moving or linking notes',async()=>{
 const h=await setup();try{
  const a=await h.core.create({title:'A',x:100,y:200,properties:{custom:42}}),b=await h.core.create({title:'B',x:400,y:500});h.select([a.id,b.id,a.id]);
  const commit=vi.spyOn(h.core,'update');const id=await h.controller.create('Work');expect(commit).toHaveBeenCalledTimes(1);
  expect(h.core.data.atoms).toHaveLength(2);expect(h.core.data.links).toEqual([]);
  expect(h.core.data.atoms[0]).toMatchObject({x:100,y:200,properties:{custom:42,[FOLDER_DEFINITIONS]:[{id,name:'Work',roots:[a.id,b.id]}]}});
  expect(projectFolders(h.core.data).memberships.get(b.id)).toEqual({[id]:1});
 }finally{h.close();}
});
it('passes lasso IDs to a naming surface; context atom ID is a fallback',async()=>{
 const h=await setup();try{
  const a=await h.core.create({title:'A'});h.select([a.id]);h.runtime.actions.get('builtin.folders:create')!.run('ignored');expect(h.requestCreate).toHaveBeenLastCalledWith([a.id]);
  h.select([]);h.runtime.actions.get('builtin.folders:create')!.run(a.id);expect(h.requestCreate).toHaveBeenLastCalledWith([a.id]);
  expect(h.core.data.atoms[0].properties[FOLDER_DEFINITIONS]).toBeUndefined();
 }finally{h.close();}
});
it('inherits overlapping memberships via the draft commit and rolls back on policy failure',async()=>{
 const h=await setup();try{
  const parent=await h.core.create({title:'Parent'}),work=await h.controller.create('Work',[parent.id]),music=await h.controller.create('Music',[parent.id]);
  const child=await h.core.create({title:'Child',properties:{custom:true}},parent.id);
  expect(child.properties).toEqual({custom:true,[FOLDER_MEMBERSHIP]:{[work]:.5,[music]:.5}});
  expect(projectFolders(h.core.data).memberships.get(child.id)).toEqual({[work]:.5,[music]:.5});
  const before=structuredClone(h.core.data),off=h.core.drafts.register({id:'failure',name:'Failure',prepare(){throw Error('Stop');}});
  await expect(h.core.create({title:'Fail'},parent.id)).rejects.toThrow('Stop');expect(await h.core.storage.snapshot()).toEqual(before);off();
 }finally{h.close();}
});
it('disable cleans presentation/actions/policy while data survives re-enable',async()=>{
 const h=await setup();try{
  const parent=await h.core.create({title:'Parent'});await h.controller.create('Work',[parent.id]);const before=structuredClone(h.core.data);
  h.runtime.disable(h.plugin.manifest.id);expect(h.changed).toHaveBeenLastCalledWith(null);expect(h.runtime.actions.size).toBe(0);expect(h.runtime.commands.size).toBe(0);expect(h.core.data).toEqual(before);
  await expect(h.controller.create('Disabled',[parent.id])).rejects.toThrow('выключен');
  const child=await h.core.create({title:'While disabled'},parent.id);expect(child.properties[FOLDER_MEMBERSHIP]).toBeUndefined();
  await h.runtime.enable(h.plugin);await h.controller.refresh();expect(h.changed.mock.calls.at(-1)![0].folders[0].count).toBe(2);
 }finally{h.close();}
});
it('returns camera bounds for folders and All without invoking graph focus on one atom',async()=>{
 const h=await setup();try{
  const a=await h.core.create({title:'A',x:100,y:200}),b=await h.core.create({title:'B',x:1000,y:1200});const id=await h.controller.create('Work',[a.id]);
  expect(await h.controller.focus(id)).toMatchObject({folderId:id,center:{x:100,y:200}});expect(h.focus).toHaveBeenCalledTimes(1);
  expect((await h.controller.focus(null))?.bounds.maxX).toBe(b.x+32);expect(await h.controller.focus('missing')).toBeNull();expect(h.focus).toHaveBeenCalledTimes(2);
 }finally{h.close();}
});
it('rejects stale selections and invalid input without writing',async()=>{
 const h=await setup();try{
  const a=await h.core.create({title:'A'}),before=structuredClone(h.core.data);
  await expect(h.controller.create('Work',[])).rejects.toThrow('Выберите');await expect(h.controller.create('Work',['missing'])).rejects.toThrow('Выделение изменилось');
  await expect(h.controller.create(' ',[a.id])).rejects.toThrow('Название');await expect(h.controller.create('Work',[a.id],'url(x)')).rejects.toThrow('цвет');expect(h.core.data).toEqual(before);
 }finally{h.close();}
});
it('does not emit stale presentation after disable with a refresh pending',async()=>{
 const h=await setup();try{
  const pending=h.controller.refresh();h.runtime.disable(h.plugin.manifest.id);const calls=h.changed.mock.calls.length;await pending;expect(h.changed.mock.calls).toHaveLength(calls);expect(h.changed).toHaveBeenLastCalledWith(null);
  await h.runtime.enable(h.plugin);expect(h.changed.mock.calls.at(-1)![0]).not.toBeNull();
 }finally{h.close();}
});
