import type {Atom,Snapshot} from './model';

export interface DraftLink {to:string;relation:string;source?:string}
export interface DraftContext {atom:Atom;before?:Atom;data:Snapshot;parent?:string;add:DraftLink[];remove:string[];rejected:string[]}
export interface DraftEffects {properties?:Record<string,unknown>;add?:DraftLink[];remove?:string[]}
export interface DraftPolicy {id:string;name:string;prepare:(context:DraftContext)=>DraftEffects|Promise<DraftEffects>}

/** Policies return data, never write inside the save queue. All effects are committed
 * together with the edited atom, after the complete policy chain succeeds. */
export class DraftPolicies {
 private policies=new Map<string,DraftPolicy>();
 register(policy:DraftPolicy){
  if(this.policies.has(policy.id))throw Error('Draft policy already registered');
  this.policies.set(policy.id,policy);return()=>{if(this.policies.get(policy.id)===policy)this.policies.delete(policy.id);};
 }
 async prepare(context:DraftContext):Promise<Required<DraftEffects>>{
  const current=structuredClone(context),add:DraftLink[]=[],remove:string[]=[];
  for(const policy of [...this.policies.values()]){
   if(this.policies.get(policy.id)!==policy)continue;
   const effects=await policy.prepare(structuredClone(current));
   if(this.policies.get(policy.id)!==policy)throw Error('Плагин выключен во время подготовки сохранения. Повторите сохранение.');
   if(!effects||typeof effects!=='object'||Array.isArray(effects))throw Error('Invalid draft policy result');
   if(effects.properties!==undefined){
    if(!effects.properties||typeof effects.properties!=='object'||Array.isArray(effects.properties))throw Error('Invalid draft properties');
    current.atom.properties={...current.atom.properties,...structuredClone(effects.properties)};
   }
   if(effects.add!==undefined){
    if(!Array.isArray(effects.add)||effects.add.length>10000)throw Error('Invalid draft links');
    for(const link of effects.add){
     if(!link||typeof link.to!=='string'||link.to===current.atom.id||!current.data.atoms.some(a=>a.id===link.to)||typeof link.relation!=='string'||link.source!==undefined&&typeof link.source!=='string')throw Error('Invalid draft link target');
     const copy=structuredClone(link);add.push(copy);current.add.push(copy);
    }
   }
   if(effects.remove!==undefined){
    if(!Array.isArray(effects.remove)||effects.remove.length>10000)throw Error('Invalid draft removals');
    for(const id of effects.remove){
     if(typeof id!=='string'||!current.data.links.some(l=>l.id===id&&(l.from===current.atom.id||l.to===current.atom.id)))throw Error('Draft policy cannot remove an unrelated link');
     if(!current.remove.includes(id)){remove.push(id);current.remove.push(id);}
    }
   }
  }
  return {properties:current.atom.properties,add,remove};
 }
}
