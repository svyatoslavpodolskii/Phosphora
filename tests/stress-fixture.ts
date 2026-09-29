import {makeAtom,makeLink,type Snapshot} from '../src/core/model';
export function stressFixture(count:number):Snapshot{
 const topics=['Исследования','Работа','Личное','Книги','Путешествия','Phosphored','Идеи','Обучение'];
 const atoms=Array.from({length:count},(_,i)=>makeAtom({id:'stress-'+i,title:i%80===0?topics[Math.floor(i/80)%topics.length]:i%17===0?'👩🏽‍💻 Обсуждение длинного названия проекта и следующего шага':`${['Наблюдение','Встреча','Материалы','Гипотеза','План'][i%5]} ${i}`,created_at:'2026-01-01T00:00:00Z',type:i%80===0?'project':i%11===0?'task':'note',importance:i%80===0?2:0,state:i%29===0?'now':i%37===0?'paused':'normal',content:i%7===0?'## Контекст\n\n**Важная мысль** и [ссылка](https://example.com).\n\n- [ ] @task Проверить гипотезу':''}));
 const links=[];const connected=Math.floor(count*.9);for(let i=1;i<connected;i++){const base=Math.floor(i/80)*80;if(i===base)continue;links.push(makeLink(atoms[base+Math.floor((i-base-1)/4)].id,atoms[i].id,'related','context'));if(i%13===0&&i-base>8)links.push(makeLink(atoms[i-7].id,atoms[i].id,'supports'));}
 for(let i=80;i<connected;i+=160)links.push(makeLink(atoms[i-80].id,atoms[i].id,'related'));links.forEach((l,i)=>l.id='stress-edge-'+String(i).padStart(5,'0'));return{atoms,links};
}
