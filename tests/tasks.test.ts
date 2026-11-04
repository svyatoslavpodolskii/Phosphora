import {it,expect} from 'vitest';
import {makeAtom} from '../src/core/model';
import {readTasks,syncTasks,taskPatch,tasksAt,occurrence,taskHistory} from '../src/core/tasks';
import {formatText} from '../src/ui/text-edit';
it('deletes one task line while retaining other IDs, history, CRLF and ordinary checks',()=>{
 let atom=syncTasks(makeAtom({title:'Deletion',content:'Intro\r\n- [ ] #task First\r\n- [ ] Plain\r\n- [ ] #task Second\r\nOutro',properties:{custom:'keep'}}));
 let tasks=readTasks(atom);atom=syncTasks({...atom,...taskPatch(atom,tasks[1].id,{recurrence:'daily',checked:true})},atom);tasks=readTasks(atom);
 const result=syncTasks({...atom,...taskPatch(atom,tasks[0].id,{remove:true})},atom);expect(result.content).toBe('Intro\r\n- [ ] Plain\r\n- [x] #task Second\r\nOutro');
 expect(readTasks(result)).toEqual([{...tasks[1],line:2}]);expect(result.properties.custom).toBe('keep');expect(()=>taskPatch(result,tasks[0].id,{remove:true})).toThrow();
});
it('distinguishes explicit tasks from Markdown checkboxes and marker-like prose',()=>{
 const atom=makeAtom({title:'Mixed',content:'- [ ] Shopping\n- [x] Done\n- [ ] #task Buy tickets\n  + [X] #task\tBook hotel\n1. [ ] #task Pack\n- [ ] #tasks Nope\n- [ ] Mention #task later\n~~~md\n- [ ] #task Example\n~~~'});
 expect(readTasks(atom).map(t=>[t.text,t.line,t.checked])).toEqual([['Buy tickets',2,false],['Book hotel',3,true],['Pack',4,false]]);
 expect(syncTasks(atom).content).toBe(atom.content);
 expect(readTasks(makeAtom({title:'Checkboxes',content:'- [ ] Plain'}))).toEqual([]);
});
it('migrates stored legacy tasks in place, preserving IDs, recurrence, history and unrelated properties',()=>{
 const legacy={id:'legacy-id',text:'Water plants',line:1,checked:false,recurrence:'daily' as const,history:{'2026-10-08':true}};
 const atom=makeAtom({title:'Legacy',content:'- [ ] New checkbox\r\n  + [ ] Water plants',properties:{'phosphora.tasks':[legacy],custom:'keep'}});
 expect(readTasks(atom)).toEqual([legacy]);
 const migrated=syncTasks(atom,undefined,new Date(2026,9,9,12));
 expect(migrated.content).toBe('- [ ] New checkbox\r\n  + [ ] #task Water plants');
 expect(migrated.properties.custom).toBe('keep');expect(migrated.properties['phosphora.tasks']).toEqual([{...legacy,marker:true}]);
 expect(syncTasks(migrated,undefined,new Date(2026,9,9,12))).toEqual(migrated);
 const patched={...atom,...taskPatch(atom,legacy.id,{checked:true},new Date(2026,9,9,12))};
 expect(readTasks(syncTasks(patched,atom,new Date(2026,9,9,12)))[0].history).toEqual({'2026-10-08':true,'2026-10-09':true});
});
it('keeps legacy identity when a saved checklist moves or is renamed before migration',()=>{
 const legacy={id:'old',text:'Review',line:0,checked:false,history:{'2026-10-08':true}};
 const atom=makeAtom({title:'Legacy',content:'- [ ] Review',properties:{'phosphora.tasks':[legacy]}});
 const moved=syncTasks({...atom,content:'Intro\n- [ ] Review\n- [ ] Plain'},atom);
 expect(readTasks(moved).map(t=>t.id)).toEqual(['old']);expect(moved.content).toContain('- [ ] #task Review');
 const renamed=syncTasks({...atom,content:'- [ ] Renamed'},atom);
 expect(readTasks(renamed)[0]).toMatchObject({id:'old',text:'Renamed',history:legacy.history});
});
it('removing a portable marker demotes a task without promoting adjacent checkboxes',()=>{
 const atom=syncTasks(makeAtom({title:'Demote',content:'- [ ] #task First\n- [ ] Plain\n- [ ] #task Second'}));
 const second=readTasks(atom)[1];
 const next=syncTasks({...atom,content:atom.content.replace('#task First','First')},atom);
 expect(readTasks(next)).toEqual([second]);expect(next.content).toBe('- [ ] First\n- [ ] Plain\n- [ ] #task Second');
 expect(()=>taskPatch(next,readTasks(atom)[0].id,{checked:true})).toThrow('Task no longer exists.');
});
it('ordinary namesakes cannot steal a moved task identity or history',()=>{
 const now=new Date(2026,9,8,12);let atom=syncTasks(makeAtom({title:'Namesake checkbox',content:'- [ ] #task Review\n- [ ] Review'}));const id=readTasks(atom)[0].id;
 atom=syncTasks({...atom,...taskPatch(atom,id,{recurrence:'daily',checked:true},now)},atom,now);
 const changed=syncTasks({...atom,content:'- [ ] Review\nIntro\n- [x] #task Review'},atom,now);
 expect(readTasks(changed)).toEqual([expect.objectContaining({id,line:2,recurrence:'daily',history:{'2026-10-08':true}})]);
});
it('inserts portable tasks and ordinary checkboxes with correct multiline selections',()=>{
 const input='Intro\nBuy tickets\nBook hotel',start=6,end=input.length;
 for(const [format,prefix] of [['task','- [ ] #task '],['checkbox','- [ ] ']] as const){
  const edit=formatText(input,start,end,format);
  expect(edit.text).toBe(`Intro\n${prefix}Buy tickets\n${prefix}Book hotel`);
  expect(edit.start).toBe(start+prefix.length);expect(edit.end).toBe(end+prefix.length*2);
  expect(readTasks(makeAtom({title:'Formatted',content:edit.text}))).toHaveLength(format==='task'?2:0);
 }
 const empty=formatText('',0,0,'task');expect(empty).toEqual({text:'- [ ] #task ',start:12,end:12});
});
it('parses real checklists, ignores fenced examples and retains identity through edits and insertions',()=>{
 let atom=syncTasks(makeAtom({title:'Project',content:'- [ ] #task First\n- [x] #task Second\n```md\n- [ ] #task Example\n```'}));
 const tasks=readTasks(atom);expect(tasks.map(t=>t.text)).toEqual(['First','Second']);
 const renamed=syncTasks({...atom,content:atom.content.replace('First','Renamed')},atom);expect(readTasks(renamed)[0].id).toBe(tasks[0].id);
 const inserted=syncTasks({...atom,content:'- [ ] #task New\n'+atom.content},atom),next=readTasks(inserted);expect(new Set(next.map(t=>t.id)).size).toBe(3);expect(next[1].id).toBe(tasks[0].id);expect(next[2].id).toBe(tasks[1].id);
});
it('daily recurrence resets the occurrence, keeps history and never creates a new task',()=>{
 const first=new Date(2026,9,8,12),next=new Date(2026,9,9,12);
 let atom=syncTasks(makeAtom({title:'Daily',content:'- [ ] #task Water plants'}));const id=readTasks(atom)[0].id;
 atom=syncTasks({...atom,...taskPatch(atom,id,{recurrence:'daily'},first)},atom,first);
 atom=syncTasks({...atom,...taskPatch(atom,id,{checked:true},first)},atom,first);expect(tasksAt(atom,first)[0].checked).toBe(true);
 const rolled=syncTasks(atom,undefined,next,true);expect(rolled.content).toBe('- [ ] #task Water plants');expect(readTasks(rolled)[0].id).toBe(id);expect(readTasks(rolled)[0].history).toEqual({'2026-10-08':true});expect(tasksAt(rolled,next)[0].checked).toBe(false);
 const manuallyChecked=syncTasks({...rolled,content:'- [x] #task Water plants'},rolled,next);expect(tasksAt(manuallyChecked,next)[0].checked).toBe(true);expect(readTasks(manuallyChecked)[0].history['2026-10-08']).toBe(true);
});
it('weekly occurrences use local Monday and completed one-off tasks stay completed',()=>{
 expect(occurrence('weekly',new Date(2026,9,11,12))).toBe('2026-10-05');expect(occurrence('weekly',new Date(2026,9,12,12))).toBe('2026-10-12');
 const atom=syncTasks(makeAtom({title:'Once',content:'- [x] #task Done'}));expect(tasksAt(atom,new Date(2030,0,1))[0].checked).toBe(true);
 expect(()=>taskPatch(atom,'missing',{checked:true})).toThrow();expect(()=>taskPatch(atom,readTasks(atom)[0].id,{checked:'yes' as any})).toThrow();
});

it('shows chronological calendar history without counting weekly completions seven times',()=>{
 const atom=syncTasks(makeAtom({title:'Weekly',content:'- [ ] #task Review'}));const now=new Date(2026,9,8,12),id=readTasks(atom)[0].id;
 const task=readTasks({...atom,...taskPatch(atom,id,{recurrence:'weekly',checked:true},now)})[0];
 const week=taskHistory(task,7,now);expect(week.map(d=>d.key)).toEqual(['2026-09-28','2026-10-05']);expect(week.filter(d=>d.completed)).toHaveLength(1);expect(week.at(-1)?.current).toBe(true);
});

it('preserves renamed duplicate identity and ignores fenced copies during matching',()=>{
 const now=new Date(2026,9,8,12);let atom=syncTasks(makeAtom({title:'Duplicate',content:'- [ ] #task Review\n- [ ] #task Review'}));const ids=readTasks(atom).map(t=>t.id);
 atom=syncTasks({...atom,...taskPatch(atom,ids[0],{recurrence:'daily',checked:true},now)},atom,now);
 const changed=syncTasks({...atom,content:'- [x] #task Renamed\n- [ ] #task Review\n```md\n- [ ] #task Review\n```'},atom,now);
 const tasks=readTasks(changed);expect(tasks.map(t=>t.id)).toEqual(ids);expect(tasks[0].recurrence).toBe('daily');expect(tasks[0].history['2026-10-08']).toBe(true);expect(tasks[1].recurrence).toBeUndefined();
});

it('does not give a renamed task the existing namesake identity',()=>{
 const atom=syncTasks(makeAtom({title:'Namesakes',content:'- [ ] #task First\n- [ ] #task Second'}));const ids=readTasks(atom).map(t=>t.id);
 expect(readTasks({...atom,content:'- [ ] #task Second\n- [ ] #task Second'}).map(t=>t.id)).toEqual(ids);
 expect(readTasks({...atom,content:'- [ ] #task Second\n- [ ] #task First'}).map(t=>t.id)).toEqual([...ids].reverse());
});
