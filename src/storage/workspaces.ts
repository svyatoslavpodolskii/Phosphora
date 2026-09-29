import type {Database} from './schema';
export interface Workspace {id:string;name:string}
export interface WorkspaceCatalog {current:string;items:Workspace[]}
export function catalog(db:Database):WorkspaceCatalog{const raw=db.selectValue('SELECT value FROM settings WHERE key=?',['workspace-catalog']);return raw===undefined?{current:'default',items:[{id:'default',name:'Основное'}]}:JSON.parse(raw);}
export function changeWorkspace(db:Database,action:'create'|'rename'|'select',nameOrId:string,id?:string):WorkspaceCatalog{
 const next=catalog(db);
 if(action==='select'){if(!next.items.some(w=>w.id===nameOrId))throw Error('Хранилище не найдено.');next.current=nameOrId;}
 else{const name=nameOrId.trim();if(!name||name.length>80)throw Error('Введите название от 1 до 80 символов.');if(next.items.some(w=>w.id!==id&&w.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('Хранилище с таким названием уже есть.');if(action==='create')next.items.push({id:crypto.randomUUID(),name});else{const item=next.items.find(w=>w.id===id);if(!item)throw Error('Хранилище не найдено.');item.name=name;}}
 db.exec('BEGIN IMMEDIATE');try{db.exec({sql:'INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',bind:['workspace-catalog',JSON.stringify(next)]});db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return next;
}
