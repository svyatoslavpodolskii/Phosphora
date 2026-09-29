import type {Plugin,PluginAPI} from './api';

/** Calendar containers are ordinary atoms; no private graph entities. */
export async function createDaily(app:PluginAPI,date=new Date()){
 const day=date.toLocaleDateString('sv-SE'),year=day.slice(0,4),month=day.slice(0,7);
 const atoms=await app.atoms.list(),links=await app.links.list();
 const existing=atoms.find(a=>a.properties.dailyDate===day);
 if(existing){app.graph.focus(existing.id);return existing;}
 const format=await app.settings.get<string>('dayFormat')||'{D} {MMMM} {YYYY}';
 const title=format.replace(/\{(YYYY|MMMM|MM|DD|D)\}/g,(_,token:string)=>({YYYY:year,MMMM:date.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}).replace(/^\d+\s*/,''),MM:day.slice(5,7),DD:day.slice(8),D:String(date.getDate())}[token]!));
 async function ensure(key:string,title:string,parent?:string,position={x:0,y:0}){
  let atom=atoms.find(a=>a.properties.calendarKey===key||(key===day&&a.properties.dailyDate===day));
  if(!atom){atom=await app.atoms.create({title,...position,properties:{calendarKey:key,...(key===day?{dailyDate:day}:{})},...(key===day?{state:'now' as const,content:'## Что сегодня важно\n\n- \n\n## Мысли\n\n'}:{})});atoms.push(atom);}
  if(parent&&!links.some(l=>(l.from===parent&&l.to===atom!.id)||(l.to===parent&&l.from===atom!.id)))links.push(await app.links.create(parent,atom.id));
  return atom;
 }
 let parent:typeof atoms[number]|undefined;
 if(await app.settings.get<boolean>('years')===true)parent=await ensure(year,year);
 if(await app.settings.get<boolean>('months')===true)parent=await ensure(month,date.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}),parent?.id,{x:(parent?.x||0)+date.getMonth()*260,y:(parent?.y||0)+240});
 const weeks=await app.settings.get<boolean>('weeks');
 // Weeks are month-local, so a week never belongs to two month containers.
 const week=Math.floor((date.getDate()-1)/7)+1;
 if(weeks)parent=await ensure(`${month}-w${week}`,`${(week-1)*7+1}–${Math.min(week*7,new Date(date.getFullYear(),date.getMonth()+1,0).getDate())} · ${date.toLocaleDateString('ru-RU',{month:'long'})}`,parent?.id,{x:(parent?.x||0)+(week-1)*260,y:(parent?.y||0)+220});
 const atom=await ensure(day,title,parent?.id,{x:(parent?.x||0)+(weeks?(date.getDate()-1)%7:date.getDate()-1)*220,y:(parent?.y||0)+220});
 app.graph.focus(atom.id);return atom;
}
export const daily:Plugin={manifest:{id:'builtin.daily',name:'Ежедневные заметки',version:'1.0.0',apiVersion:1,description:'Календарная иерархия обычных атомов.',permissions:['atoms.read','atoms.write','links.read','links.write','graph','ui','settings'],settings:[{key:'years',label:'Создавать атом года',type:'boolean',default:false},{key:'months',label:'Создавать атом месяца',type:'boolean',default:false},{key:'weeks',label:'Недели месяца (1–7, 8–14…)',type:'boolean',default:false},{key:'dayFormat',label:'Название дня: {D}, {DD}, {MM}, {MMMM}, {YYYY}',type:'text',default:'{D} {MMMM} {YYYY}'}]},activate(app){let pending:Promise<unknown>|undefined;app.commands.add({id:'daily',name:'Создать дневную запись',run(){if(!pending)pending=createDaily(app).finally(()=>pending=undefined);return pending;}});}};
