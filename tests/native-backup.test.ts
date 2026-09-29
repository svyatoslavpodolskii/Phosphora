import {it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {migrate,type Database} from '../src/storage/schema';
import {snapshot,transact} from '../src/storage/operations';
import {makeAtom} from '../src/core/model';
import {restoreDatabase} from '../src/storage/restore';
import {backupFilename,packStorage,unpackStorage} from '../src/storage/native-backup';
function db(){const raw=new DatabaseSync(':memory:');const adapter:Database={exec(q){if(typeof q==='string')raw.exec(q);else raw.prepare(q.sql).run(...(q.bind||[]));},selectValue(sql,bind=[]){const row=raw.prepare(sql).get(...bind);return row?Object.values(row)[0]:undefined;},selectObjects(sql,bind=[]){return raw.prepare(sql).all(...bind);}};migrate(adapter);return {raw,adapter};}
it('restores complete records and plugin settings without replacing workspace catalog',()=>{
 const current=db(),source=db();const a=makeAtom({title:'Restored',x:123,pinned:true,aliases:['Alias'],properties:{custom:42}});
 transact(current.adapter,[{kind:'atom',atom:makeAtom({title:'Old'})},{kind:'setting',key:'workspace-catalog',value:{current:'default',items:[{id:'default',name:'Current'}]}}]);
 transact(source.adapter,[{kind:'atom',atom:a},{kind:'setting',key:'plugin:test:setting',value:{data:'kept'}},{kind:'setting',key:'workspace-catalog',value:{untrusted:true}}]);
 source.raw.exec("INSERT INTO plugin_data VALUES('test','key','{\"kept\":true}')");
 restoreDatabase(current.adapter,source.adapter);
 expect(snapshot(current.adapter).atoms).toEqual([a]);expect(current.adapter.selectValue("SELECT value FROM plugin_data WHERE key='key'")).toContain('kept');
 expect(current.adapter.selectValue("SELECT value FROM settings WHERE key='workspace-catalog'")).toContain('Current');
 current.raw.close();source.raw.close();
});
it('rejects broken settings before touching the current database',()=>{
 const current=db(),source=db();transact(current.adapter,[{kind:'atom',atom:makeAtom({title:'Keep'})}]);
 source.raw.exec("INSERT INTO settings VALUES('broken','not-json')");
 expect(()=>restoreDatabase(current.adapter,source.adapter)).toThrow();expect(snapshot(current.adapter).atoms[0].title).toBe('Keep');current.raw.close();source.raw.close();
});
it('migrates a version one copy in staging before activation',()=>{
 const current=db(),source=db();transact(source.adapter,[{kind:'atom',atom:makeAtom({title:'Legacy',aliases:['Old name']})}]);
 source.raw.exec('DROP INDEX atoms_position;ALTER TABLE atoms DROP COLUMN pinned;ALTER TABLE atoms DROP COLUMN spatial;DELETE FROM schema_metadata WHERE version>=2;PRAGMA user_version=1');
 restoreDatabase(current.adapter,source.adapter);
 expect(snapshot(current.adapter).atoms[0]).toMatchObject({title:'Legacy',pinned:false,aliases:['Old name'],spatial:{resistance:0}});
 current.raw.close();source.raw.close();
});
it('rolls back all changes on a write failure',()=>{
 const current=db(),source=db();transact(current.adapter,[{kind:'atom',atom:makeAtom({title:'Keep'})}]);transact(source.adapter,[{kind:'atom',atom:makeAtom({title:'New'})}]);
 current.raw.exec("CREATE TRIGGER fail_restore BEFORE INSERT ON atoms BEGIN SELECT RAISE(ABORT,'disk failure'); END");
 expect(()=>restoreDatabase(current.adapter,source.adapter)).toThrow();expect(snapshot(current.adapter).atoms[0].title).toBe('Keep');current.raw.close();source.raw.close();
});
it('packages one checked file and uses a filesystem-safe timestamp name',async()=>{
 const bytes=new Uint8Array(512);bytes.set(new TextEncoder().encode('SQLite format 3\0'));
 const packed=await packStorage(bytes,'Личные заметки');expect((await unpackStorage(packed)).database).toEqual(bytes);
 packed[packed.length-100]^=1;await expect(unpackStorage(packed)).rejects.toThrow();
 expect(backupFilename('Моя:база/',new Date(2026,8,17,16,30,2))).toBe('Моя_база__2026-09-17_16-30-02.phosphora');
});
