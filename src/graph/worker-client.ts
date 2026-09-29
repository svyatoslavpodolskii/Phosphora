export class GraphWorkerClient {
 private stopped=false;
 private worker=new Worker(new URL('./graph.worker.ts',import.meta.url),{type:'module'});private seq=0;private pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 constructor(){this.worker.onmessage=({data})=>{const p=this.pending.get(data.id);if(p){clearTimeout(p.timer);this.pending.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.result);}};this.worker.onerror=()=>this.close();}
 call<T>(method:string,input:unknown):Promise<T>{if(this.stopped)return Promise.reject(Error('Graph worker is closed'));return new Promise((resolve,reject)=>{const id=++this.seq,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Расчёт карты не ответил.'));},5000);this.pending.set(id,{resolve,reject,timer});this.worker.postMessage({id,method,input});});}
 close(){this.stopped=true;this.worker.terminate();for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('Worker карты остановлен.'));}this.pending.clear();}
}
