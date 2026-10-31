import type {StorageAdapter} from './model';
export interface StoredFile {path:string;key:string;chunks:number;note?:string}
export interface Vault {id:string;name:string;files:StoredFile[]}
export async function storedBytes(storage:StorageAdapter,file:StoredFile){const chunks:Uint8Array[]=[];let size=0;for(let i=0;i<file.chunks;i++){const value=await storage.getSetting<string>(file.key+':'+i);if(value===undefined)throw Error('Не удалось прочитать файл '+file.path);const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));chunks.push(bytes);size+=bytes.length;}const result=new Uint8Array(size);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;}
export async function listVaults(storage:StorageAdapter){return await storage.getSetting<Vault[]>('vaults')||[];}
