import {splitNote} from '../../src/core/vault';
import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {unzipSync} from 'fflate';
import {openSettings} from './helpers';
test('imports a real directory including hidden config and attachments while offline',async({page,context})=>{
 const root=resolve('artifacts','folder-vault-'+randomUUID());for(const sub of ['Notes','Attachments','.obsidian'])mkdirSync(join(root,sub),{recursive:true});writeFileSync(join(root,'Notes','First.md'),'---\naliases: [One]\n---\n[[Second]]');writeFileSync(join(root,'Notes','Second.md'),'# Second');const attachment=Buffer.from([0,10,32,255,17]);writeFileSync(join(root,'Attachments','binary.bin'),attachment);writeFileSync(join(root,'.obsidian','app.json'),'{"attachmentFolderPath":"Attachments"}');
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await openSettings(page);await page.getByLabel('Папка Obsidian',{exact:true}).setInputFiles(root);await page.getByRole('button',{name:'Импортировать хранилище',exact:true}).click();await expect(page.locator('footer')).toContainText('2 атомов · 1 связей');await page.getByRole('button',{name:'Закрыть настройки'}).click();await page.reload();await expect(page.locator('footer')).toContainText('2 атомов');await openSettings(page);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт Markdown',exact:true}).click();const stream=await(await pending).createReadStream();const chunks:Buffer[]=[];for await(const c of stream!)chunks.push(c as Buffer);const files=unzipSync(Buffer.concat(chunks));expect(files['Attachments/binary.bin']).toEqual(new Uint8Array(attachment));expect(new TextDecoder().decode(files['.obsidian/app.json'])).toBe('{"attachmentFolderPath":"Attachments"}');expect(splitNote(new TextDecoder().decode(files['Notes/First.md'])).body).toBe('[[Second]]');expect(splitNote(new TextDecoder().decode(files['Notes/First.md'])).yaml).toContain('phosphored_id:');
});
