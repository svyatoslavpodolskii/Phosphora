import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,openSettings,closeSettings,readMap} from './helpers';
test('mobile workspace deletion offers a full backup that restores without affecting the survivor',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});await page.goto('/');
 const survivor=makeAtom({id:'survivor',title:'Keep me',pinned:true});await importMap(page,{atoms:[survivor],links:[]});
 async function spaces(){await page.locator('.workspace-switch').click();}
 async function create(name:string){await spaces();await page.getByRole('button',{name:'\u041d\u043e\u0432\u043e\u0435 \u0445\u0440\u0430\u043d\u0438\u043b\u0438\u0449\u0435',exact:true}).click();await page.locator('.workspace-menu input').fill(name);await page.locator('.workspace-menu form button[type="submit"]').click();await expect(page.locator('.workspace-switch')).toContainText(name);}
 await create('Disposable');const original=makeAtom({id:'saved',title:'Restorable',content:'- [ ] Review',paused:true,state:'now',pinned:true,properties:{custom:{retained:true}}});await importMap(page,{atoms:[original],links:[]});
 await openSettings(page);await page.getByLabel('\u0420\u0435\u0436\u0438\u043c \u0430\u0432\u0442\u043e\u0441\u0432\u044f\u0437\u0435\u0439',{exact:true}).selectOption('off');await closeSettings(page);
 await spaces();await page.locator('.workspace-menu .danger-button').click();const remove=page.locator('.workspace-menu .danger-button');await expect(remove).toBeDisabled();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e',exact:true}).click();const file=await pending;expect(file.suggestedFilename()).toMatch(/^Disposable_.*\.phosphora$/);const stream=await file.createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk as Buffer);const bytes=Buffer.concat(chunks);
 await expect(page.locator('.workspace-menu [role="status"]')).toBeVisible();await page.screenshot({path:'artifacts/workspace-delete-backup-mobile.png'});
 await page.locator('.workspace-menu input').fill('wrong');await expect(remove).toBeDisabled();await page.locator('.workspace-menu input').fill('Disposable');await remove.click();await expect(page.locator('.workspace-switch')).not.toContainText('Disposable');expect((await readMap(page)).atoms).toEqual([survivor]);
 await create('Recovered');await openSettings(page);await page.getByLabel('\u041f\u043e\u043b\u043d\u0430\u044f \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f',{exact:true}).setInputFiles({name:'saved.phosphora',mimeType:'application/octet-stream',buffer:bytes});await page.getByRole('button',{name:'\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u0445\u0440\u0430\u043d\u0438\u043b\u0438\u0449\u0435',exact:true}).click();await expect(page.locator('.workspace-switch')).toContainText('Recovered');await expect(page.locator('.settings')).toHaveCount(0);
 expect((await readMap(page)).atoms).toEqual([original]);await openSettings(page);await expect(page.getByLabel('\u0420\u0435\u0436\u0438\u043c \u0430\u0432\u0442\u043e\u0441\u0432\u044f\u0437\u0435\u0439',{exact:true})).toHaveValue('off');
});
