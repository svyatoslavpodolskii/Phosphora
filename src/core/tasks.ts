import type {Atom} from './model';
export type Recurrence='daily'|'weekly';
export interface NoteTask{id:string;text:string;line:number;checked:boolean;recurrence?:Recurrence;history:Record<string,boolean>}
const KEY='phosphora.tasks';
export function dayKey(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function occurrence(rule:Recurrence,now=new Date()){const date=new Date(now);if(rule==='weekly')date.setDate(date.getDate()-(date.getDay()+6)%7);return dayKey(date);}
export function readTasks(atom:Pick<Atom,'content'|'id'|'properties'>):NoteTask[]{
 const currentTexts=new Set(atom.content.split(/\r?\n/).map(line=>/^\s*(?:[-+*]|\d+[.)])\s+\[([ xX])\]\s+(.+)$/.exec(line)?.[2]).filter(Boolean));
 const stored=Array.isArray(atom.properties[KEY])?atom.properties[KEY] as NoteTask[]:[],used=new Set<string>(),result:NoteTask[]=[];let fence='';
 for(const [line,text] of atom.content.split(/\r?\n/).entries()){
  const delimiter=/^\s{0,3}(`{3,}|~{3,})/.exec(text);if(delimiter){if(!fence)fence=delimiter[1];else if(delimiter[1][0]===fence[0]&&delimiter[1].length>=fence.length)fence='';continue;}if(fence)continue;
  const match=/^\s*(?:[-+*]|\d+[.)])\s+\[([ xX])\]\s+(.+)$/.exec(text);if(!match)continue;
  const previous=stored.find(t=>t&&typeof t.id==='string'&&!used.has(t.id)&&t.text===match[2])||stored.find(t=>t&&typeof t.id==='string'&&!used.has(t.id)&&t.line===line&&!currentTexts.has(t.text));let id=previous?.id||`${atom.id}:task:${line}`;while(!previous&&(used.has(id)||stored.some(t=>t?.id===id)))id+=':new';used.add(id);
  const history=previous?.history&&typeof previous.history==='object'&&!Array.isArray(previous.history)?Object.fromEntries(Object.entries(previous.history).filter(([key,value])=>/^\d{4}-\d{2}-\d{2}$/.test(key)&&typeof value==='boolean')):{};
  result.push({id,text:match[2],line,checked:match[1].toLowerCase()==='x',...(previous?.recurrence==='daily'||previous?.recurrence==='weekly'?{recurrence:previous.recurrence}:{}),history});
 }return result;
}
export function tasksAt(atom:Atom,now=new Date()){return readTasks(atom).map(t=>({...t,checked:t.recurrence?Boolean(t.history[occurrence(t.recurrence,now)]):t.checked}));}
export function syncTasks(atom:Atom,before?:Atom,now=new Date(),rolling=false):Atom{
 const tasks=readTasks(atom),old=before?new Map(readTasks(before).map(t=>[t.id,t])):new Map<string,NoteTask>(),lines=atom.content.split(/\r?\n/);let contentChanged=false;
 for(const task of tasks)if(task.recurrence){const key=occurrence(task.recurrence,now),prior=old.get(task.id);
  if(!rolling&&prior&&prior.checked!==task.checked)task.history[key]=task.checked;
  const checked=Boolean(task.history[key]);if(task.checked!==checked){lines[task.line]=lines[task.line].replace(/\[([ xX])\]/,checked?'[x]':'[ ]');contentChanged=true;}task.checked=checked;
 }
 const properties={...atom.properties};if(tasks.length||KEY in properties)properties[KEY]=tasks;
 return {...atom,content:contentChanged?lines.join(atom.content.includes('\r\n')?'\r\n':'\n'):atom.content,properties};
}
export function taskPatch(atom:Atom,id:string,patch:{checked?:boolean;recurrence?:Recurrence|null},now=new Date()){
 if(patch.checked!==undefined&&typeof patch.checked!=='boolean'||patch.recurrence!==undefined&&patch.recurrence!==null&&!['daily','weekly'].includes(patch.recurrence))throw Error('Invalid task update.');
 const tasks=readTasks(atom),task=tasks.find(t=>t.id===id);if(!task)throw Error('Task no longer exists.');
 const lines=atom.content.split(/\r?\n/);if(patch.recurrence!==undefined){if(patch.recurrence){if(task.recurrence!==patch.recurrence&&task.checked)task.history[occurrence(patch.recurrence,now)]=true;task.recurrence=patch.recurrence;}else delete task.recurrence;}
 if(patch.checked!==undefined){task.checked=patch.checked;if(task.recurrence)task.history[occurrence(task.recurrence,now)]=patch.checked;}
 if(task.recurrence)task.checked=Boolean(task.history[occurrence(task.recurrence,now)]);
 lines[task.line]=lines[task.line].replace(/\[([ xX])\]/,task.checked?'[x]':'[ ]');
 return {content:lines.join(atom.content.includes('\r\n')?'\r\n':'\n'),properties:{...atom.properties,[KEY]:tasks}};
}
