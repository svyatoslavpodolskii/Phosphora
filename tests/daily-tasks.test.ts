import {it,expect,vi} from 'vitest';
import {dailyTasks,progress,taskData,shiftDay} from '../src/plugins/daily-tasks';
import {makeAtom,type Atom} from '../src/core/model';
import type {PluginAPI,PluginView} from '../src/plugins/api';
it('keeps daily marks, excludes pauses and resumes the same task without changing history',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,8,25,12));const atoms:Atom[]=[];let view:PluginView;
 const api={types:{register:()=>()=>{}},views:{register:(v:PluginView)=>{view=v;return()=>{};}},atoms:{list:async()=>structuredClone(atoms),get:async(id:string)=>structuredClone(atoms.find(a=>a.id===id)),create:async(input:any)=>{const a=makeAtom(input);atoms.push(a);return a;},update:async(id:string,patch:any)=>{const i=atoms.findIndex(a=>a.id===id);return atoms[i]={...atoms[i],...patch};}}} as unknown as PluginAPI;
 try{await dailyTasks.activate(api);const action=(a:string,v={})=>view.onAction!(a,v);
 await action('add',{title:'Read <script>alert(1)</script>'});const id=atoms[0].id;
 await action('toggle:'+id);expect(progress(atoms,'2026-09-25')).toEqual({done:1,total:1});
 expect(await view!.render()).not.toContain('<script>');await action('stop:'+id);
 vi.setSystemTime(new Date(2026,8,28,12));await action('resume:'+id);
 expect(atoms).toHaveLength(1);expect(progress(atoms,'2026-09-26')).toEqual({done:0,total:0});expect(progress(atoms,'2026-09-25').done).toBe(1);
 expect(progress(atoms,'2026-09-28')).toEqual({done:0,total:1});await action('advance:'+id);expect(taskData(atoms[0])!.days['2026-09-28']).toBe('doing');await action('advance:'+id);expect(progress(atoms,'2026-09-28').done).toBe(1);
 await action('previous');await action('toggle:'+id);expect(taskData(atoms[0])!.days['2026-09-27']).toBeUndefined();
 }finally{vi.useRealTimers();}
});
it('uses calendar arithmetic across leap days and year boundaries',()=>{expect(shiftDay('2028-03-01',-1)).toBe('2028-02-29');expect(shiftDay('2026-01-01',-1)).toBe('2025-12-31');});
