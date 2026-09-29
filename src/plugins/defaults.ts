import type {StorageAdapter,Mutation} from '../core/model';

export const optionalBuiltins=['builtin.templates','builtin.daily','builtin.molecule','builtin.compact','builtin.daily-tasks'];

/** Persist once per workspace; upgrades retain the previous enabled set. */
export async function initializePluginDefaults(storage:StorageAdapter,hasAtoms:boolean){
 let disabled=await storage.getSetting<string[]>('disabled-builtins');
 if(!await storage.getSetting('daily-tasks-installed')){
  if(disabled!==undefined)disabled=[...new Set([...disabled,'builtin.daily-tasks'])];
  await storage.transaction([{kind:'setting',key:'daily-tasks-installed',value:true},...(disabled!==undefined?[{kind:'setting' as const,key:'disabled-builtins',value:disabled}]:[])]);
 }
 if(await storage.getSetting('plugin-defaults-v2'))return disabled??optionalBuiltins;
 const existing=hasAtoms||disabled!==undefined||await storage.getSetting('map')!==undefined||await storage.getSetting('preferences')!==undefined;
 const next=disabled??(existing?['builtin.daily-tasks']:[...optionalBuiltins]);
 const ops:Mutation[]=[{kind:'setting',key:'disabled-builtins',value:next},{kind:'setting',key:'plugin-defaults-v2',value:true}];
 if(existing)for(const field of ['years','months']){
  const key=`plugin:builtin.daily:${field}`;
  if(await storage.getSetting(key)===undefined)ops.push({kind:'setting',key,value:true});
 }
 await storage.transaction(ops);
 return next;
}
