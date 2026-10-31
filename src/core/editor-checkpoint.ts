import type {Atom,StorageAdapter} from './model';

export const EDITOR_CHECKPOINT='editor-checkpoint-v1';
export interface EditorCheckpoint {
 version:1; initial:Partial<Atom>; draft:Partial<Atom>; aliases:string;
 add:{to:string;relation:string;source?:string}[]; remove:string[]; parent?:string;
}
export function editorCheckpoint(value:unknown):EditorCheckpoint|undefined {
 const v=value as EditorCheckpoint|null;
 if(!v||v.version!==1||!v.initial||!v.draft||typeof v.draft.title!=='string'||typeof v.draft.content!=='string'||typeof v.aliases!=='string'||!Array.isArray(v.add)||!Array.isArray(v.remove))return;
 return v;
}

/** Ordered writes: a pending debounce can never resurrect a discarded draft. */
export class CheckpointWriter {
 private timer:ReturnType<typeof setTimeout>|undefined;
 private pending:EditorCheckpoint|null|(()=>EditorCheckpoint|null)|undefined;
 private queue:Promise<void>=Promise.resolve();
 constructor(private storage:StorageAdapter,private failed:(error:Error)=>void){}
 schedule(value:EditorCheckpoint|null|(()=>EditorCheckpoint|null)){this.pending=value;clearTimeout(this.timer);this.timer=setTimeout(()=>{void this.flush().catch(()=>{});},300);}
 flush(){clearTimeout(this.timer);this.timer=undefined;if(this.pending===undefined)return this.queue;
  const pending=this.pending;this.pending=undefined;const value=typeof pending==='function'?pending():pending;
  const next=this.queue.catch(()=>{}).then(()=>this.storage.transaction([{kind:'setting',key:EDITOR_CHECKPOINT,value}]));
  this.queue=next.catch(error=>{if(this.pending===undefined)this.pending=value;this.failed(error);throw error;});
  // flush callers can handle errors, while background persistence never creates an unhandled rejection.
  void this.queue.catch(()=>{});return this.queue;
 }
 cancel(){clearTimeout(this.timer);this.timer=undefined;this.pending=undefined;}
}
