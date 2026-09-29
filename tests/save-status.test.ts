import {it,expect} from 'vitest';
import {observeSave,trackSave,type SaveStatus} from '../src/storage/status';
import {transactWithRetry} from '../src/storage/operations';
import type {Database} from '../src/storage/schema';

it('keeps transient locks internal and reports a persistent failure until recovery',async()=>{
 const frames:SaveStatus[]=[];const off=observeSave(status=>frames.push(status));
 let attempts=0;
 const busy=Object.assign(Error('database busy'),{resultCode:5});
 const db:Database={exec(){if(attempts++===0)throw busy;},selectObjects:()=>[],selectValue:()=>undefined};
 try{
  await trackSave(()=>transactWithRetry(db,[]));
  expect(attempts).toBe(3); // failed BEGIN, then successful BEGIN + COMMIT
  expect(frames.every(frame=>!frame.error)).toBe(true);
  expect(frames.at(-1)).toMatchObject({pending:0,at:expect.any(Number)});
  attempts=0;db.exec=()=>{attempts++;throw busy;};frames.length=0;
  await expect(trackSave(()=>transactWithRetry(db,[]))).rejects.toBe(busy);
  expect(attempts).toBe(3);
  expect(frames.filter(frame=>frame.error)).toHaveLength(1);
  expect(frames.at(-1)).toMatchObject({pending:0,error:'database busy'});
  db.exec=()=>{};await trackSave(()=>transactWithRetry(db,[]));
  expect(frames.at(-1)?.error).toBeUndefined();expect(frames.at(-1)?.pending).toBe(0);
 }finally{off();}
});

it('does not retry when rollback itself failed',async()=>{
 let begins=0;
 const busy=Object.assign(Error('database busy'),{resultCode:5});
 const db:Database={exec(sql){if(sql==='BEGIN IMMEDIATE'){begins++;return;}throw busy;},selectObjects:()=>[],selectValue:()=>undefined};
 await expect(transactWithRetry(db,[])).rejects.toBeInstanceOf(AggregateError);
 expect(begins).toBe(1);
});
