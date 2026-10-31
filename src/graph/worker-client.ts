export class GraphWorkerClient {
 private stopped=false;
 private worker?:Worker;
 private seq=0;
 private pending=new Map<number,{resolve:(value:any)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 private start(){
  if(this.worker)return this.worker;
  const worker=new Worker(new URL('./graph.worker.ts',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{const request=this.pending.get(data.id);if(!request)return;clearTimeout(request.timer);this.pending.delete(data.id);data.error?request.reject(Error(data.error)):request.resolve(data.result);};
  worker.onerror=()=>this.close();this.worker=worker;return worker;
 }
 call<T>(method:string,input:unknown):Promise<T>{
  if(this.stopped)return Promise.reject(Error('Graph worker is closed'));
  return new Promise((resolve,reject)=>{
   let worker:Worker;try{worker=this.start();}catch(error){reject(error);return;}
   const id=++this.seq,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Расчёт карты не ответил.'));},5000);
   this.pending.set(id,{resolve,reject,timer});
   try{worker.postMessage({id,method,input});}catch(error){clearTimeout(timer);this.pending.delete(id);reject(error);}
  });
 }
 close(){this.stopped=true;this.worker?.terminate();this.worker=undefined;for(const request of this.pending.values()){clearTimeout(request.timer);request.reject(Error('Worker карты остановлен.'));}this.pending.clear();}
}
