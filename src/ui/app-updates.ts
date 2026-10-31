import {registerSW} from 'virtual:pwa-register';

export interface UpdateStatus {available:boolean;checking:boolean;message:string}
/** Update the worker on foregrounding; replacing a running app always stays explicit. */
export function appUpdates(changed:(status:UpdateStatus)=>void){
 let registration:ServiceWorkerRegistration|undefined,disposed=false,lastCheck=0,applying=false;
 let status:UpdateStatus={available:false,checking:false,message:''};
 const publish=(patch:Partial<UpdateStatus>)=>{status={...status,...patch};if(!disposed)changed(status);};
 registerSW({immediate:true,onNeedRefresh:()=>publish({available:true,message:'Новая версия готова'}),onNeedReload:()=>publish({available:true,message:'Новая версия готова'}),onRegisteredSW:(_url,value)=>{registration=value;if(value?.waiting)publish({available:true});void check(false);},onRegisterError:()=>publish({message:'Не удалось проверить обновление. Проверьте подключение.'})});
 async function check(manual=true){
  if(disposed||status.checking)return;if(!navigator.onLine){if(manual)publish({message:'Проверим обновление, когда появится интернет.'});return;}
  if(!manual&&Date.now()-lastCheck<60_000)return;lastCheck=Date.now();publish({checking:true,message:''});
  try{registration??=await navigator.serviceWorker?.getRegistration();if(!registration){publish({message:'Обновление станет доступно после первого запуска онлайн.'});return;}await registration.update();if(registration.waiting)publish({available:true});publish({message:status.available?'Новая версия готова':registration.installing?'Новая версия загружается…':'Установлена актуальная версия'});}
  catch{publish({message:'Не удалось проверить обновление. Попробуйте позже.'});}
  finally{publish({checking:false});}
 }
 const foreground=()=>{if(!document.hidden)void check(false);};
 document.addEventListener('visibilitychange',foreground);window.addEventListener('online',foreground);
 const timer=setInterval(foreground,15*60_000);
 async function apply(){
  if(applying)return;const waiting=registration?.waiting;
  // Another tab may already have activated the worker. The current JS still needs a reload.
  if(!waiting){location.reload();return;}
  applying=true;
  await new Promise<void>((resolve,reject)=>{
   const activated=()=>{clearTimeout(timeout);resolve();location.reload();};
   const timeout=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',activated);applying=false;reject(Error('Обновление ещё не завершено. Попробуйте снова.'));},15000);
   navigator.serviceWorker.addEventListener('controllerchange',activated,{once:true});
   waiting.postMessage({type:'SKIP_WAITING'});
  });
 }
 return {check,apply,dispose(){disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',foreground);window.removeEventListener('online',foreground);}};
}
