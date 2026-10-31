import {it,expect,vi} from 'vitest';
import {CheckpointWriter,editorCheckpoint,EDITOR_CHECKPOINT,type EditorCheckpoint} from '../src/core/editor-checkpoint';
import type {StorageAdapter} from '../src/core/model';

const draft=(title:string):EditorCheckpoint=>({version:1,initial:{title:'',content:''},draft:{title,content:'Unfinished'},aliases:'Alias',add:[{to:'other',relation:'related'}],remove:[]});
it('does not label newer typing as saved when an older write finishes',async()=>{
 let finish!:()=>void,started!:()=>void;const began=new Promise<void>(resolve=>started=resolve),states:string[]=[];
 const transaction=vi.fn().mockImplementationOnce(()=>{started();return new Promise<void>(resolve=>finish=resolve);}).mockResolvedValue(undefined),writer=new CheckpointWriter({transaction} as unknown as StorageAdapter,()=>{},state=>states.push(state));
 writer.schedule(draft('Old'));const old=writer.flush();await began;writer.schedule(draft('New'));finish();await old;expect(states.at(-1)).toBe('pending');await writer.flush();expect(states.at(-1)).toBe('saved');writer.cancel();
});
it('coalesces typing, flushes on backgrounding and never resurrects discarded text',async()=>{
 vi.useFakeTimers();const values:unknown[]=[];const storage={transaction:vi.fn(async ops=>{values.push(ops[0].value);})} as unknown as StorageAdapter;
 const writer=new CheckpointWriter(storage,()=>{});
 try{writer.schedule(draft('a'));writer.schedule(draft('ab'));await vi.advanceTimersByTimeAsync(299);expect(values).toHaveLength(0);await writer.flush();expect(values).toEqual([draft('ab')]);writer.schedule(draft('abc'));writer.cancel();await writer.flush();await storage.transaction([{kind:'setting',key:EDITOR_CHECKPOINT,value:null}]);await vi.advanceTimersByTimeAsync(1000);expect(values).toEqual([draft('ab'),null]);}finally{vi.useRealTimers();}
});
it('retains a failed checkpoint for retry instead of losing the text',async()=>{
 const failed=vi.fn(),transaction=vi.fn().mockRejectedValueOnce(Error('disk full')).mockResolvedValue(undefined),writer=new CheckpointWriter({transaction} as unknown as StorageAdapter,failed);
 writer.schedule(draft('Retry'));await expect(writer.flush()).rejects.toThrow('disk full');await writer.flush();expect(failed).toHaveBeenCalledOnce();expect(transaction.mock.calls[1][0][0].value).toEqual(draft('Retry'));expect(editorCheckpoint(null)).toBeUndefined();expect(editorCheckpoint({version:99})).toBeUndefined();expect(editorCheckpoint(draft('Recovered'))?.draft.title).toBe('Recovered');
});
