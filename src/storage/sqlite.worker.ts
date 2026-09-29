import {restoreDatabase} from './restore';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import {migrate} from './schema';
import {snapshot,transactWithRetry} from './operations';
import {catalog,changeWorkspace} from './workspaces';
let db:any;let sqlite:any;let rootDb:any;let rootPool:any;let restored=false;
async function open(requested?:string) {
 if(db)return;
 sqlite=await sqlite3InitModule();
 const pool=await sqlite.installOpfsSAHPoolVfs({name:'phosphored-opfs',directory:'.phosphored',initialCapacity:8});
 rootPool=pool;const candidate=new pool.OpfsSAHPoolDb('/phosphored.sqlite3');
 try {migrate(candidate);rootDb=candidate;const list=catalog(rootDb);const current=requested||list.current;if(!list.items.some(w=>w.id===current))throw Error('Хранилище не найдено.');if(current==='default')db=rootDb;else{if(!/^[a-f0-9-]{36}$/.test(current))throw Error('Некорректный идентификатор хранилища.');const space=await sqlite.installOpfsSAHPoolVfs({name:'phosphored-opfs-'+current,directory:'.phosphored-'+current,initialCapacity:4});const target=new space.OpfsSAHPoolDb('/phosphored.sqlite3');try{migrate(target);db=target;}catch(e){target.close();throw e;}}if(requested)changeWorkspace(rootDb,'select',current);} catch(e){candidate.close();throw e;}
}
let queue=Promise.resolve();
self.onmessage=({data:{id,method,args}})=>{queue=queue.then(async()=>{
 try {
 let result:any;
 if(method==='open')await open(args[0]);
 else {if(restored)throw Error('Reload required after restore');if(!db)throw Error('База не открыта.');
 if(method==='snapshot')result=snapshot(db);
 else if(method==='workspaces')result=catalog(rootDb);
 else if(method==='createWorkspace')result=changeWorkspace(rootDb,'create',args[0]);
 else if(method==='renameWorkspace')result=changeWorkspace(rootDb,'rename',args[1],args[0]);
 else if(method==='selectWorkspace')result=changeWorkspace(rootDb,'select',args[0]);
 else if(method==='transaction')await transactWithRetry(db,args[0]);
 else if(method==='getSetting'){const raw=db.selectValue('SELECT value FROM settings WHERE key=?',[args[0]]);result=raw===undefined?undefined:JSON.parse(raw);}
 else if(method==='restoreDatabase'){let staged:any;try{rootPool.importDb('/restore.sqlite3',args[0]);staged=new rootPool.OpfsSAHPoolDb('/restore.sqlite3');restoreDatabase(db,staged);restored=true;}finally{try{staged?.close();rootPool.unlink('/restore.sqlite3');}catch(cleanupError){console.warn('Restore staging cleanup',cleanupError);}}}
 else if(method==='exportDatabase')result=sqlite.capi.sqlite3_js_db_export(db);
 else throw Error('Неизвестная операция хранилища.');}
 self.postMessage({id,result});
 }catch(e){self.postMessage({id,error:e instanceof Error?e.message:String(e)});}
 });};
