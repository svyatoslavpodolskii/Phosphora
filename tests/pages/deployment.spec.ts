import {test,expect} from '@playwright/test';
for(const path of ['/','/Different-Repo/'])test(`static deployment ${path}: SQLite, scoped assets, reload and offline new tab`,async({page,context})=>{
 const errors:string[]=[];const requests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 const response=await page.goto(path);expect(response?.headers()['cross-origin-embedder-policy']).toBeUndefined();expect(await page.evaluate(()=>crossOriginIsolated)).toBe(false);
 await page.getByRole('button',{name:'+ Создать',exact:true}).click();await page.getByRole('textbox',{name:'Название',exact:true}).fill('Pages persistence');await page.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.locator('footer')).toContainText('1 атомов');
 await page.reload();await expect(page.locator('footer')).toContainText('1 атомов');
 const scope=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return new URL(r.scope).pathname;});expect(scope).toBe(path);
 const manifestUrl=await page.locator('link[rel="manifest"]').getAttribute('href');const url=new URL(manifestUrl!,page.url());const manifest=await(await page.request.get(url.href)).json();expect(new URL(manifest.start_url,url).pathname).toBe(path);
 for(const icon of manifest.icons)expect((await page.request.get(new URL(icon.src,url).href)).ok()).toBe(true);
 expect(requests.some(u=>u.endsWith('.wasm'))).toBe(true);if(path!=='/')expect(requests.filter(u=>new URL(u).origin==='http://127.0.0.1:4185').every(u=>new URL(u).pathname.startsWith(path))).toBe(true);
 await page.close();await context.setOffline(true);const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.goto(path);await expect(offline.locator('footer')).toContainText('1 атомов');await offline.getByRole('button',{name:'+ Создать',exact:true}).click();await offline.getByRole('textbox',{name:'Название',exact:true}).fill('Offline on Pages');await offline.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(offline.getByRole('dialog',{name:'Редактор атома'})).toBeHidden();await expect(offline.locator('footer')).toContainText('2 атомов');await offline.reload();await expect(offline.locator('footer')).toContainText('2 атомов');expect(errors).toEqual([]);
});
