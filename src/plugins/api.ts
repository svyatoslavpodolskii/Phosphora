import type {Atom,AtomState,Link,Snapshot,Appearance} from '../core/model';
import type {Recurrence} from '../core/tasks';
import type {DraftPolicy} from '../core/drafts';
import type {MapTool,StructuralProvider,PhysicsProvider,LayoutProvider,ClusteringProvider,LinkReductionProvider,NodeWeightProvider} from '../graph/providers';
export type Permission='atoms.read'|'atoms.write'|'links.read'|'links.write'|'graph'|'ui'|'storage'|'settings';
export const PERMISSIONS:Permission[]=['atoms.read','atoms.write','links.read','links.write','graph','ui','storage','settings'];
export type SettingField={key:string;label:string}&({type:'boolean';default:boolean}|{type:'text';default:string});
export interface Manifest {id:string;name:string;version:string;apiVersion:1;permissions:Permission[];description?:string;settings?:SettingField[]}
export interface Command {id:string;name:string;run:(atomId?:string)=>unknown|Promise<unknown>}
export interface PluginView {id:string;name:string;render:()=>string|Promise<string>;onAction?:(action:string,values:Record<string,string>)=>unknown|Promise<unknown>}
export interface AtomType {id:string;name:string;icon?:string;appearance?:Appearance;content?:string}
export interface Layout {id:string;name:string;run:(data:Snapshot)=>Array<{id:string;x:number;y:number}>|Promise<Array<{id:string;x:number;y:number}>>}
export interface PluginAPI {
 atoms:{registerDraftPolicy:(policy:DraftPolicy)=>()=>void;list:()=>Promise<Atom[]>;get:(id:string)=>Promise<Atom|undefined>;create:(input:Partial<Atom>&{title:string},parent?:string)=>Promise<Atom>;update:(id:string,patch:Partial<Atom>)=>Promise<Atom>;setState:(id:string,state:AtomState)=>Promise<Atom>;setPaused:(id:string,paused:boolean)=>Promise<Atom>;setTask:(id:string,taskId:string,patch:{checked?:boolean;recurrence?:Recurrence|null})=>Promise<Atom>;delete:(id:string)=>Promise<void>;search:(query:string)=>Promise<Atom[]>};
 links:{list:()=>Promise<Link[]>;create:(from:string,to:string,relation?:string)=>Promise<Link>;delete:(id:string)=>Promise<void>};
 events:{on:(event:string,handler:(payload:any)=>void)=>()=>void};
 commands:{add:(command:Command)=>()=>void};
 types:{register:(type:AtomType)=>()=>void};
 graph:{registerMapTool:(tool:MapTool)=>()=>void;registerStructuralProvider:(provider:StructuralProvider)=>()=>void;focus:(id:string)=>void;registerLayout:(layout:Layout)=>()=>void;registerPhysicsProvider:(provider:PhysicsProvider)=>()=>void;registerLayoutProvider:(provider:LayoutProvider)=>()=>void;registerClusteringProvider:(provider:ClusteringProvider)=>()=>void;registerLinkReductionProvider:(provider:LinkReductionProvider)=>()=>void;registerNodeWeightProvider:(provider:NodeWeightProvider)=>()=>void};
 ui:{notify:(text:string)=>void;registerContextAction:(command:Command)=>()=>void};
 views:{register:(view:PluginView)=>()=>void};
 storage:{get:<T>(key:string)=>Promise<T|undefined>;set:(key:string,value:unknown)=>Promise<void>};
 settings:{get:<T>(key:string)=>Promise<T|undefined>;set:(key:string,value:unknown)=>Promise<void>};
 assets:{list:()=>Promise<string[]>;read:(path:string)=>Promise<Uint8Array>};
}
export interface Plugin {manifest:Manifest;resources?:{style?:string;assets?:Record<string,number[]>};activate:(app:PluginAPI)=>void|(()=>void)|Promise<void|(()=>void)>}
export function validateManifest(m:Manifest){validateSettings(m); if(!m||!/^([a-z0-9]+[.-])*[a-z0-9]+$/.test(m.id)||m.id.length>80||typeof m.name!=='string'||!m.name||m.name.length>100||typeof m.version!=='string'||m.apiVersion!==1||!Array.isArray(m.permissions)||m.permissions.some(p=>!PERMISSIONS.includes(p)))throw Error('Неподдерживаемый manifest или разрешения. Network, filesystem и sync в MVP недоступны.');}

function validateSettings(m:Manifest){if(!m?.settings)return;const seen=new Set<string>();if(!Array.isArray(m.settings)||m.settings.length>40||!m.permissions?.includes('settings'))throw Error('Invalid plugin settings');for(const f of m.settings){if(!f||!/^[-a-zA-Z0-9_]{1,80}$/.test(f.key)||seen.has(f.key)||typeof f.label!=='string'||f.label.length>200||!['boolean','text'].includes(f.type)||typeof f.default!==(f.type==='boolean'?'boolean':'string')||String(f.default).length>200)throw Error('Invalid plugin setting');seen.add(f.key);}}
