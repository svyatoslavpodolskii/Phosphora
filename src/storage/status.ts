export interface SaveStatus {pending:number;at?:number;error?:string}
let status:SaveStatus={pending:0};const listeners=new Set<(value:SaveStatus)=>void>();
export function observeSave(fn:(value:SaveStatus)=>void){listeners.add(fn);fn(status);return()=>{listeners.delete(fn);};}
const emit=()=>listeners.forEach(fn=>fn({...status}));
export async function trackSave<T>(operation:()=>Promise<T>):Promise<T>{status={...status,pending:status.pending+1};emit();try{const result=await operation();status={pending:status.pending-1,at:Date.now()};emit();return result;}catch(e){status={...status,pending:status.pending-1,error:(e as Error).message};emit();throw e;}}
