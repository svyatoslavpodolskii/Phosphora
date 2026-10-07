export type AtomState = 'normal' | 'now' | 'paused' | 'archived';
export interface Appearance { color?: string; icon?: string; shape?: 'circle'|'square'|'diamond'; style?: 'solid'|'dashed'; size_override?: number }
export interface Spatial { resistance: number }
export interface Atom { id: string; type: string; title: string; content: string; state: AtomState; importance: number; created_at: string; updated_at: string; properties: Record<string, unknown>; appearance: Appearance; aliases: string[]; x: number; y: number; revision: number; pinned:boolean; spatial:Spatial }
export interface Link { id: string; from: string; to: string; relation: string; source: string; created_at: string }
export interface Snapshot { atoms: Atom[]; links: Link[] }
export interface PositionUpdate {id:string;x:number;y:number;resistance?:number}
export type Mutation = {kind:'atom'; atom:Atom; expectedRevision?:number} | {kind:'link'; link:Link} | {kind:'unlink'; id:string} | {kind:'delete'; id:string} | {kind:'setting'; key:string; value:unknown} | {kind:'positions';positions:PositionUpdate[];manual:boolean};
export interface StorageAdapter { open():Promise<void>; snapshot():Promise<Snapshot>; transaction(operations:Mutation[]):Promise<void>; getSetting<T>(key:string):Promise<T|undefined>; exportDatabase():Promise<Uint8Array>; close():void }
export function validateAtom(a: Atom) {
  if (!a || typeof a.id!=='string' || !a.id || typeof a.title!=='string' || !a.title.trim() || a.title.length>500 || typeof a.content!=='string' || a.content.length>2_000_000 || typeof a.type!=='string' || !a.type || a.type.length>100) throw Error('Некорректный атом: проверьте название, тип и текст.');
  if (!['normal','now','paused','archived'].includes(a.state) || ![0,1,2].includes(a.importance)) throw Error('Некорректное состояние или важность.');
  if(typeof a.pinned!=='boolean'||!a.spatial||!Number.isFinite(a.spatial.resistance)||a.spatial.resistance<0||a.spatial.resistance>10000)throw Error('Некорректные пространственные ограничения.');
  if (![a.x,a.y,a.revision].every(Number.isFinite) || Math.abs(a.x)>1e7 || Math.abs(a.y)>1e7 || !Number.isInteger(a.revision) || a.revision<1) throw Error('Некорректная позиция или версия.');
  if (!Array.isArray(a.aliases) || a.aliases.length>100 || a.aliases.some(x=>typeof x!=='string'||x.length>500)) throw Error('Некорректные алиасы.');
  if (!a.properties || Array.isArray(a.properties) || typeof a.properties!=='object' || !a.appearance || typeof a.appearance!=='object') throw Error('Некорректные свойства.');
  if (JSON.stringify(a.properties).length>100_000 || !Number.isFinite(Date.parse(a.created_at)) || !Number.isFinite(Date.parse(a.updated_at))) throw Error('Некорректные данные атома.');
  const p=a.appearance;
  if ((p.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(p.color)) || (p.icon!==undefined&&(typeof p.icon!=='string'||p.icon.length>16)) || (p.shape!==undefined&&!['circle','square','diamond'].includes(p.shape)) || (p.style!==undefined&&!['solid','dashed'].includes(p.style)) || (p.size_override!==undefined&&(!Number.isFinite(p.size_override)||p.size_override<18||p.size_override>64))) throw Error('Некорректное оформление.');
}
export function validateLink(l:Link) { if (!l || ['id','from','to','relation','source','created_at'].some(k=>typeof l[k as keyof Link]!=='string'||!l[k as keyof Link]||l[k as keyof Link].length>500) || l.from===l.to || !Number.isFinite(Date.parse(l.created_at))) throw Error('Некорректная связь.'); }
export function makeAtom(input:Partial<Atom> & {title:string}):Atom { const now=new Date().toISOString(); const a={id:crypto.randomUUID(),type:'note',content:'',state:'normal' as AtomState,importance:0,created_at:now,updated_at:now,properties:{},appearance:{},aliases:[],x:0,y:0,revision:1,pinned:false,spatial:{resistance:0},...input}; validateAtom(a); return a; }
export function makeLink(from:string,to:string,relation='related',source='manual'):Link {const l={id:crypto.randomUUID(),from,to,relation,source,created_at:new Date().toISOString()}; validateLink(l);return l;}

/** Legacy state-compatible pause metadata. Persisted with the atom, including backups. */
export function resumeState(atom:Pick<Atom,'properties'>):Exclude<AtomState,'paused'>{
 const value=atom.properties['phosphora.pauseState'];
 return value==='now'||value==='archived'?value:'normal';
}
export function transitionState(before:Atom|undefined,atom:Atom):Atom{
 const properties={...atom.properties};
 if(atom.state==='paused')properties['phosphora.pauseState']=before?.state==='paused'?resumeState(before):before?.state??resumeState(atom);
 else delete properties['phosphora.pauseState'];
 return {...atom,properties};
}
