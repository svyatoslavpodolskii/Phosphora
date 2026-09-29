// Test-only producer of the exact schema-2 OPFS database. Never shipped in the app.
import init from '@sqlite.org/sqlite-wasm';
import {migrate} from '../src/storage/schema';
import {transact} from '../src/storage/operations';
import {makeAtom,makeLink} from '../src/core/model';
self.onmessage=async()=>{try{
 const sqlite=await init();const pool=await sqlite.installOpfsSAHPoolVfs({name:'phosphored-opfs',directory:'.phosphored',initialCapacity:8});const db=new pool.OpfsSAHPoolDb('/phosphored.sqlite3');migrate(db);
 const a=makeAtom({title:'Legacy A',x:-100,y:0,importance:2,appearance:{color:'#aabbcc'},aliases:['Old alias']});const b=makeAtom({title:'Legacy B',state:'now',x:75,y:0});
 transact(db,[{kind:'atom',atom:a},{kind:'atom',atom:b},{kind:'link',link:makeLink(a.id,b.id)},{kind:'setting',key:'legacy-proof',value:'preserve'}]);
 db.exec('BEGIN IMMEDIATE; DROP INDEX atoms_position; ALTER TABLE atoms DROP COLUMN pinned; ALTER TABLE atoms DROP COLUMN spatial; DELETE FROM schema_metadata WHERE version=3; PRAGMA user_version=2; COMMIT;');db.close();await pool.pauseVfs();self.postMessage({ok:true});
}catch(e){self.postMessage({error:String(e)});}};
