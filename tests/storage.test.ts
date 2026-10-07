import {describe,it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {migrate,type Database} from '../src/storage/schema';
import {snapshot,transact,transactWithRetry} from '../src/storage/operations';
import {makeAtom,makeLink} from '../src/core/model';
function db(){const raw=new DatabaseSync(':memory:');const adapter:Database={exec(q){if(typeof q==='string')raw.exec(q);else raw.prepare(q.sql).run(...(q.bind||[]));},selectValue(sql,bind=[]){const row=raw.prepare(sql).get(...bind);return row?Object.values(row)[0]:undefined;},selectObjects(sql,bind=[]){return raw.prepare(sql).all(...bind);}};return{raw,adapter};}
describe('durable data invariants',()=>{
 it('retries a rolled-back busy transaction without duplicate or partial records',async()=>{
  const {adapter}=db();migrate(adapter);const a=makeAtom({title:'A',aliases:['Alias']}),b=makeAtom({title:'B'});
  const exec=adapter.exec.bind(adapter);let failed=false,attempts=0;
  adapter.exec=q=>{if(q==='BEGIN IMMEDIATE')attempts++;if(typeof q!=='string'&&q.sql.startsWith('INSERT INTO atoms')&&q.bind?.[0]===b.id&&!failed){failed=true;throw Object.assign(Error('busy'),{resultCode:5});}return exec(q);};
  await transactWithRetry(adapter,[{kind:'atom',atom:a},{kind:'atom',atom:b},{kind:'link',link:makeLink(a.id,b.id)}]);
  expect(attempts).toBe(2);expect(snapshot(adapter).atoms.map(a=>a.title)).toEqual(['A','B']);expect(snapshot(adapter).atoms[0].aliases).toEqual(['Alias']);expect(snapshot(adapter).links).toHaveLength(1);
 });
 it('bounds lock retries and never retries a revision conflict',async()=>{
  const {adapter}=db();migrate(adapter);const a=makeAtom({title:'A'});transact(adapter,[{kind:'atom',atom:a}]);
  const exec=adapter.exec.bind(adapter);let attempts=0;const busy=Object.assign(Error('locked'),{resultCode:6});
  adapter.exec=q=>{if(q==='BEGIN IMMEDIATE'){attempts++;throw busy;}return exec(q);};
  await expect(transactWithRetry(adapter,[{kind:'delete',id:a.id}])).rejects.toBe(busy);expect(attempts).toBe(3);expect(snapshot(adapter).atoms).toHaveLength(1);
  attempts=0;adapter.exec=q=>{if(q==='BEGIN IMMEDIATE')attempts++;return exec(q);};
  await expect(transactWithRetry(adapter,[{kind:'atom',atom:a,expectedRevision:99}])).rejects.toThrow('Атом уже изменён');expect(attempts).toBe(1);expect(snapshot(adapter).atoms[0]).toMatchObject({title:'A',revision:a.revision});
 });
 it('rolls back a failed create-and-link as one transaction',()=>{const {adapter}=db();migrate(adapter);const a=makeAtom({title:'A'});expect(()=>transact(adapter,[{kind:'atom',atom:a},{kind:'link',link:makeLink(a.id,'missing')}])).toThrow();expect(snapshot(adapter).atoms).toHaveLength(0);});
 it('archive preserves links and appearance, stale edits fail',()=>{const {adapter}=db();migrate(adapter);const a=makeAtom({title:'A',appearance:{color:'#aabbcc'},aliases:['Alias']}),b=makeAtom({title:'B'});transact(adapter,[{kind:'atom',atom:a},{kind:'atom',atom:b},{kind:'link',link:makeLink(a.id,b.id)}]);transact(adapter,[{kind:'atom',atom:{...a,state:'archived',revision:2},expectedRevision:1}]);expect(snapshot(adapter).links).toHaveLength(1);expect(snapshot(adapter).atoms[0].appearance.color).toBe('#aabbcc');expect(()=>transact(adapter,[{kind:'atom',atom:a,expectedRevision:1}])).toThrow();});
 it('migrates version one without losing atoms, aliases or links',()=>{const {raw,adapter}=db();migrate(adapter);const a=makeAtom({title:'До обновления',aliases:['старое']}),b=makeAtom({title:'B'});transact(adapter,[{kind:'atom',atom:a},{kind:'atom',atom:b},{kind:'link',link:makeLink(a.id,b.id)}]);raw.exec('DROP INDEX links_from;DROP INDEX links_to;DROP INDEX atoms_state;DROP INDEX aliases_text;DROP INDEX atoms_updated;DROP INDEX atoms_position;ALTER TABLE atoms DROP COLUMN pinned;ALTER TABLE atoms DROP COLUMN spatial;ALTER TABLE atoms DROP COLUMN paused;DELETE FROM schema_metadata WHERE version>=2;PRAGMA user_version=1');migrate(adapter);migrate(adapter);expect(snapshot(adapter).atoms[0].aliases).toEqual(['старое']);expect(snapshot(adapter).links).toHaveLength(1);expect(adapter.selectValue('PRAGMA user_version')).toBe(4);});
 it('refuses newer schema without touching its records',()=>{const {raw,adapter}=db();migrate(adapter);transact(adapter,[{kind:'atom',atom:makeAtom({title:'Future'})}]);raw.exec('PRAGMA user_version=99');expect(()=>migrate(adapter)).toThrow();expect(snapshot(adapter).atoms).toHaveLength(1);});
 it('does not interpolate content into SQL',()=>{const {adapter}=db();migrate(adapter);transact(adapter,[{kind:'atom',atom:makeAtom({title:"'); DROP TABLE atoms;--"})}]);expect(snapshot(adapter).atoms).toHaveLength(1);});
});

it('migrates v3 pause metadata atomically and keeps graph references',()=>{
 const {raw,adapter}=db();migrate(adapter);
 const a=makeAtom({title:'Paused now',aliases:['Alias']}),b=makeAtom({title:'Legacy paused'});
 transact(adapter,[{kind:'atom',atom:a},{kind:'atom',atom:b},{kind:'link',link:makeLink(a.id,b.id)}]);
 raw.prepare("UPDATE atoms SET state='paused',properties=? WHERE id=?").run(JSON.stringify({'phosphora.pauseState':'now',custom:42}),a.id);
 raw.prepare("UPDATE atoms SET state='paused' WHERE id=?").run(b.id);
 raw.exec('ALTER TABLE atoms DROP COLUMN paused;DELETE FROM schema_metadata WHERE version=4;PRAGMA user_version=3');
 migrate(adapter);migrate(adapter);
 const data=snapshot(adapter);expect(data.atoms[0]).toMatchObject({state:'now',paused:true,properties:{custom:42},aliases:['Alias']});
 expect(data.atoms[0].properties).not.toHaveProperty('phosphora.pauseState');expect(data.atoms[1]).toMatchObject({state:'normal',paused:true});expect(data.links).toHaveLength(1);
 raw.close();
});
