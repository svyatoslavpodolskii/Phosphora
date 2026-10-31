import {it,expect,vi} from 'vitest';
import {GraphWorkerClient} from '../src/graph/worker-client';
it('unused model plugins create no worker and active calls reuse one worker',async()=>{
 const workers:any[]=[];class TestWorker{onmessage:any;onerror:any;terminate=vi.fn();constructor(){workers.push(this);}postMessage(data:any){queueMicrotask(()=>this.onmessage({data:{id:data.id,result:data.method}}));}}
 vi.stubGlobal('Worker',TestWorker);const unused=new GraphWorkerClient(),active=new GraphWorkerClient();
 try{expect(workers).toHaveLength(0);unused.close();await expect(unused.call('late',{})).rejects.toThrow('closed');expect(workers).toHaveLength(0);await expect(active.call('first',{})).resolves.toBe('first');await expect(active.call('second',{})).resolves.toBe('second');expect(workers).toHaveLength(1);active.close();expect(workers[0].terminate).toHaveBeenCalledOnce();}finally{active.close();vi.unstubAllGlobals();}
});
it('failed message cloning rejects immediately and leaves no timeout behind',async()=>{
 vi.useFakeTimers();class TestWorker{onmessage:any;onerror:any;terminate(){}postMessage(){throw Error('Cannot clone');}}vi.stubGlobal('Worker',TestWorker);const client=new GraphWorkerClient();
 try{await expect(client.call('bad',{})).rejects.toThrow('Cannot clone');expect(vi.getTimerCount()).toBe(0);}finally{client.close();vi.unstubAllGlobals();vi.useRealTimers();}
});
