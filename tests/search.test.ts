import {it,expect} from 'vitest';
import {NoteSearch,excerpt,wordStem} from '../src/core/search';
import {makeAtom} from '../src/core/model';
import {candidates} from '../src/core/matching';
it('matches Russian inflections symmetrically and searches note bodies',()=>{
 expect(wordStem('Макару')).toBe(wordStem('Макара'));
 const a=makeAtom({title:'Макара',content:'Обсудили с Макаром поездку к морю.'}),b=makeAtom({title:'Поездка',content:'Список вещей'});const index=new NoteSearch();index.sync([a,b]);expect(index.search('Макару поездку',[a,b])).toEqual([a]);expect(candidates('Написать Макару',[a])[0].reason).toBe('form');
 a.content='Новая запись';index.sync([a,b]);expect(index.search('морю',[a,b])).toEqual([]);index.sync([b]);expect(index.search('Макара',[b])).toEqual([]);
});
it('shows exact source spelling with surrounding context and safely separates highlights',()=>{
 const text='Начало. '.repeat(40)+'Поговорить с Макаром завтра о поездке. '+'Продолжение. '.repeat(40);const parts=excerpt(text,'Макару');expect(parts.filter(p=>p.match).map(p=>p.text)).toEqual(['Макаром']);expect(parts.map(p=>p.text).join('')).toContain('завтра');expect(parts[0].text).toBe('…');expect(parts.map(p=>p.text).join('').length).toBeLessThan(165);
});
