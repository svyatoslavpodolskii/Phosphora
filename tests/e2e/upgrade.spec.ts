import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {openSettings,closeSettings,readMap,focus} from './helpers';
test('real schema-2 OPFS migration, application rebuild, SW update and offline new tab preserve data',async({page,context})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','tests/legacy.config.ts'],{stdio:'pipe'});
 await page.route('**/legacy-worker.js',route=>route.fulfill({contentType:'text/javascript',headers:{'Cross-Origin-Embedder-Policy':'require-corp'},body:readFileSync('artifacts/legacy/legacy-worker.js')}));
 await page.route('**/sqlite3*.wasm',route=>route.fulfill({contentType:'application/wasm',body:readFileSync('node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm')}));
 await page.route('**/legacy.html',route=>route.fulfill({contentType:'text/html',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'},body:'<!doctype html><title>Legacy fixture</title>'}));
 await page.goto('/legacy.html');await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const w=new Worker('/legacy-worker.js',{type:'module'});w.onmessage=({data})=>{w.terminate();data.ok?resolve():reject(Error(data.error));};w.onerror=e=>reject(Error(e.message));w.postMessage({});}));
 await page.goto('/');await expect(page.locator('footer')).toContainText('2 атомов');const migrated=await readMap(page);const a=migrated.atoms.find(a=>a.title==='Legacy A')!;expect(a.appearance.color).toBe('#aabbcc');expect(a.aliases).toEqual(['Old alias']);expect(a.pinned).toBe(false);expect(a.importance).toBe(2);expect(migrated.links).toHaveLength(1);expect(migrated.atoms.find(a=>a.title==='Legacy B')?.state).toBe('now');
 await focus(page,'Legacy A',false);await page.locator('canvas').click({button:'right',position:{x:640,y:360}});await page.getByRole('button',{name:/Закрепить/}).click();
 await page.locator('canvas').hover({position:{x:640,y:360}});await page.mouse.down();await page.mouse.move(530,300,{steps:10});await page.mouse.up();await page.waitForTimeout(250);const before=await readMap(page);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 try{
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{env:{...process.env,VITE_BUILD_LABEL:'upgrade-acceptance'},stdio:'pipe'});
 await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});await expect.poll(()=>page.evaluate(async()=>Boolean((await navigator.serviceWorker.ready).waiting)),{timeout:20000}).toBe(true);
 await page.close();await context.setOffline(true);const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.goto('/phosphored/');await expect(offline.locator('footer')).toContainText('2 атомов');const after=await readMap(offline);expect(after.atoms.find(a=>a.title==='Legacy A')).toMatchObject(before.atoms.find(a=>a.title==='Legacy A')!);expect(after.links).toEqual(before.links);
 await openSettings(offline);await expect(offline.getByText('Phosphored upgrade-acceptance · схема 3',{exact:true})).toBeVisible();await closeSettings(offline);
 await offline.getByRole('button',{name:'+ Создать',exact:true}).click();await offline.getByRole('textbox',{name:'Название',exact:true}).fill('Created offline after update');await offline.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(offline.getByRole('dialog',{name:'Редактор атома'})).toBeHidden();await expect(offline.locator('footer')).toContainText('3 атомов');await offline.reload();await expect(offline.locator('footer')).toContainText('3 атомов');expect(errors).toEqual([]);await offline.close();
 }finally{execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{stdio:'pipe'});}
});
