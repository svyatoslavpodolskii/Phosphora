import type {Atom} from '../core/model';
import type {Plugin} from './api';

type Status='todo'|'doing'|'done';
export type DailyTask={start:string;end?:string;breaks?:{start:string;end:string}[];days:Record<string,Status>};
export const localDay=(date=new Date())=>date.toLocaleDateString('sv-SE');
export function shiftDay(day:string,amount:number){const date=new Date(day+'T12:00:00');date.setDate(date.getDate()+amount);return localDay(date);}
export function taskData(atom:Atom):DailyTask|undefined{
 const value=atom.properties.dailyTask as DailyTask|undefined;
 if(!value||typeof value.start!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.start)||!value.days||typeof value.days!=='object'||Array.isArray(value.days))return;
 if(value.end!==undefined&&(typeof value.end!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.end)))return;
 if(value.breaks!==undefined&&(!Array.isArray(value.breaks)||value.breaks.some(p=>!p||typeof p.start!=='string'||typeof p.end!=='string')))return;
 return value;
}
export function scheduled(task:DailyTask,day:string){return task.start<=day&&(!task.end||day<task.end)&&!(task.breaks||[]).some(p=>day>=p.start&&day<p.end);}
export function progress(atoms:Atom[],day:string){const tasks=atoms.flatMap(a=>{const t=taskData(a);return t&&scheduled(t,day)?[t]:[];});return {total:tasks.length,done:tasks.filter(t=>t.days[day]==='done').length};}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button=(action:string,label:string,extra='')=>`<button data-action="${escape(action)}" ${extra}>${escape(label)}</button>`;

export const dailyTasks:Plugin={manifest:{id:'builtin.daily-tasks',name:'Ежедневные задачи',version:'1.0.0',apiVersion:1,description:'Повторяющиеся задачи, канбан и история выполнения по дням.',permissions:['atoms.read','atoms.write','ui']},activate(app){
 let chosen:string|undefined,board=false;
 app.types.register({id:'daily-task',name:'Ежедневная задача',icon:'✓'});
 app.views.register({id:'today',name:'Ежедневные задачи',async render(){
  const today=localDay(),day=chosen||today,atoms=await app.atoms.list();
  const tasks=atoms.filter(a=>{const t=taskData(a);return t&&scheduled(t,day);});
  const stats=progress(atoms,day);
  const row=(a:Atom)=>{const t=taskData(a)!,status=t.days[day]||'todo';return `<div class="task-row">${button('toggle:'+a.id,status==='done'?'✓':'○',`aria-label="${escape((status==='done'?'Снять отметку: ':'Выполнить: ')+a.title)}" aria-pressed="${status==='done'}"`)}<span class="task-title">${escape(a.title)}</span>${board&&status==='todo'?button('advance:'+a.id,status==='todo'?'Начать':status==='doing'?'Готово':'Вернуть'):''}${day===today&&!t.end?button('stop:'+a.id,'Пауза',`aria-label="${escape('Приостановить: '+a.title)}"`):''}</div>`;};
  const bars=Array.from({length:14},(_,i)=>{const d=shiftDay(today,i-13),p=progress(atoms,d),percent=p.total?Math.round(p.done/p.total*100):0;return `<div class="task-bar"><meter min="0" max="100" value="${percent}" aria-label="${d}: ${p.done} из ${p.total}" title="${d}: ${p.done} из ${p.total}"></meter><span>${d.slice(8)}.${d.slice(5,7)}</span></div>`;}).join('');
  const paused=atoms.filter(a=>taskData(a)?.end);
  return `<div class="task-toolbar">${button('previous','←','aria-label="Предыдущий день"')}<strong>${day===today?'Сегодня':new Date(day+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</strong>${button('next','→',`aria-label="Следующий день" ${day>=today?'disabled':''}`)}${day!==today?button('today','Сегодня'):''}${button('mode',board?'Список':'Канбан')}</div><p aria-live="polite">${stats.done} из ${stats.total} выполнено</p>${day===today?'<div class="task-add"><input data-field="title" aria-label="Новая ежедневная задача" placeholder="Что делать каждый день?" maxlength="200">'+button('add','Добавить')+'</div>':''}${tasks.length?(board?'<div class="task-board">'+(['todo','doing','done'] as Status[]).map((status,i)=>`<section class="task-column"><h3>${['План','В процессе','Готово'][i]}</h3>${tasks.filter(a=>(taskData(a)!.days[day]||'todo')===status).map(row).join('')}</section>`).join('')+'</div>':tasks.map(row).join('')):'<p class="task-note">На этот день задач нет. Добавьте первую — она будет повторяться каждый день.</p>'}<h3>Последние 14 дней</h3><p class="task-note">Доля выполненных задач за каждый день. Прошлые отметки можно исправить стрелками даты.</p><div class="task-bars" role="group" aria-label="График выполнения за 14 дней">${bars}</div>${paused.length&&day===today?'<details><summary>На паузе · '+paused.length+'</summary>'+paused.map(a=>`<div class="task-row"><span class="task-title">${escape(a.title)}</span>${button('resume:'+a.id,'Возобновить')}</div>`).join('')+'</details>':''}`;
 },async onAction(action,values){
  const today=localDay(),day=chosen||today;
  if(action==='previous'){chosen=shiftDay(day,-1);return;}if(action==='next'){if(day<today)chosen=shiftDay(day,1);return;}if(action==='today'){chosen=undefined;return;}if(action==='mode'){board=!board;return;}
  if(action==='add'){const title=(values.title||'').trim();if(!title||title.length>200)throw Error('Введите название задачи (до 200 символов).');await app.atoms.create({title,type:'builtin.daily-tasks:daily-task',properties:{dailyTask:{start:today,days:{}}}});return;}
  const separator=action.indexOf(':'),kind=action.slice(0,separator),id=action.slice(separator+1),atom=await app.atoms.get(id),task=atom&&taskData(atom);if(!atom||!task)throw Error('Задача больше не существует.');
  if(kind==='stop'){if(day!==today)return;await app.atoms.update(id,{properties:{...atom.properties,dailyTask:{...task,end:shiftDay(today,1)}}});return;}
  if(kind==='resume'){
   const {end,...rest}=task;const breaks=[...(task.breaks||[])];if(end&&end<today)breaks.push({start:end,end:today});
   await app.atoms.update(id,{properties:{...atom.properties,dailyTask:{...rest,breaks}}});return;
  }
  if(day>today||!scheduled(task,day))return;
  const before=task.days[day]||'todo',status:Status=kind==='toggle'?(before==='done'?'todo':'done'):kind==='advance'?(before==='todo'?'doing':before==='doing'?'done':'todo'):before;
  await app.atoms.update(id,{properties:{...atom.properties,dailyTask:{...task,days:{...task.days,[day]:status}}}});
 }});
}};
