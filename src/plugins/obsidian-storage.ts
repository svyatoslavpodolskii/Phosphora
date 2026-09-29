import type {StorageAdapter} from '../core/model';

export const DIRECT_VAULTS_KEY='plugin:builtin.obsidian:direct-vaults';
/** Copy legacy bindings without changing vault IDs or persisted directory handles.
 * Keep the old value for older backups; after migration only the scoped key is read. */
export async function migrateObsidianBindings(storage:StorageAdapter){
 if(await storage.getSetting(DIRECT_VAULTS_KEY)!==undefined)return;
 const previous=await storage.getSetting('direct-vaults');
 await storage.transaction([{kind:'setting',key:DIRECT_VAULTS_KEY,value:previous??[]}]);
}
