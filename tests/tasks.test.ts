import {it,expect} from 'vitest';
import {makeAtom} from '../src/core/model';
import {readTasks,syncTasks,taskPatch,tasksAt,occurrence,taskHistory} from '../src/core/tasks';
it('parses real checklists, ignores fenced examples and retains identity through edits and insertions',()=>{
 let atom=syncTasks(makeAtom({title:'Project',content:'- [ ] First\n- [x] Second\n```md\n- [ ] Example\n```'}));
 const tasks=readTasks(atom);expect(tasks.map(t=>t.text)).toEqual(['First','Second']);
 const renamed=syncTasks({...atom,content:atom.content.replace('First','Renamed')},atom);expect(readTasks(renamed)[0].id).toBe(tasks[0].id);
 const inserted=syncTasks({...atom,content:'- [ ] New\n'+atom.content},atom),next=readTasks(inserted);expect(new Set(next.map(t=>t.id)).size).toBe(3);expect(next[1].id).toBe(tasks[0].id);expect(next[2].id).toBe(tasks[1].id);
});
it('daily recurrence resets the occurrence, keeps history and never creates a new task',()=>{
 const first=new Date(2026,9,8,12),next=new Date(2026,9,9,12);
 let atom=syncTasks(makeAtom({title:'Daily',content:'- [ ] Water plants'}));const id=readTasks(atom)[0].id;
 atom=syncTasks({...atom,...taskPatch(atom,id,{recurrence:'daily'},first)},atom,first);
 atom=syncTasks({...atom,...taskPatch(atom,id,{checked:true},first)},atom,first);expect(tasksAt(atom,first)[0].checked).toBe(true);
 const rolled=syncTasks(atom,undefined,next,true);expect(rolled.content).toBe('- [ ] Water plants');expect(readTasks(rolled)[0].id).toBe(id);expect(readTasks(rolled)[0].history).toEqual({'2026-10-08':true});expect(tasksAt(rolled,next)[0].checked).toBe(false);
 const manuallyChecked=syncTasks({...rolled,content:'- [x] Water plants'},rolled,next);expect(tasksAt(manuallyChecked,next)[0].checked).toBe(true);expect(readTasks(manuallyChecked)[0].history['2026-10-08']).toBe(true);
});
it('weekly occurrences use local Monday and completed one-off tasks stay completed',()=>{
 expect(occurrence('weekly',new Date(2026,9,11,12))).toBe('2026-10-05');expect(occurrence('weekly',new Date(2026,9,12,12))).toBe('2026-10-12');
 const atom=syncTasks(makeAtom({title:'Once',content:'- [x] Done'}));expect(tasksAt(atom,new Date(2030,0,1))[0].checked).toBe(true);
 expect(()=>taskPatch(atom,'missing',{checked:true})).toThrow();expect(()=>taskPatch(atom,readTasks(atom)[0].id,{checked:'yes' as any})).toThrow();
});

it('shows chronological calendar history without counting weekly completions seven times',()=>{
 const atom=syncTasks(makeAtom({title:'Weekly',content:'- [ ] Review'}));const now=new Date(2026,9,8,12),id=readTasks(atom)[0].id;
 const task=readTasks({...atom,...taskPatch(atom,id,{recurrence:'weekly',checked:true},now)})[0];
 const week=taskHistory(task,7,now);expect(week.map(d=>d.key)).toEqual(['2026-09-28','2026-10-05']);expect(week.filter(d=>d.completed)).toHaveLength(1);expect(week.at(-1)?.current).toBe(true);
});
