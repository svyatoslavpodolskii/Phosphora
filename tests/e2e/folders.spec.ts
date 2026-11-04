import {test,expect,type Page} from '@playwright/test';
import {makeAtom,makeLink} from '../../src/core/model';
import {FOLDER_DEFINITIONS,FOLDER_MEMBERSHIP} from '../../src/graph/folders';
import {openSettings,closeSettings,importMap,readMap,focus} from './helpers';

async function toggle(page:Page,enabled:boolean){
 await openSettings(page);await page.getByRole('button',{name:'Плагины →',exact:true}).click();
 const row=page.locator('.plugin-row').filter({has:page.locator('strong',{hasText:/^Папки$/})});
 const action=row.getByRole('button',{name:enabled?'Включить':'Выключить',exact:true});
 if(await action.count())await action.click();
 await expect(row.getByRole('button',{name:enabled?'Выключить':'Включить',exact:true})).toBeVisible();await closeSettings(page);
}
async function screen(page:Page,x:number,y:number){
 const map=page.locator('canvas.map'),box=(await map.boundingBox())!;
 const [cx,cy,z]=await Promise.all(['data-camera-x','data-camera-y','data-zoom'].map(k=>map.getAttribute(k)));
 return {x:box.x+box.width/2+Number(cx)+x*Number(z),y:box.y+box.height/2+Number(cy)+y*Number(z)};
}

test('lasso folder stays in one world and survives disable/re-enable with inheritance and cross-links',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();
 const atoms=[makeAtom({id:'folder-root',title:'Folder root',x:-260,y:0,pinned:true}),makeAtom({id:'folder-child',title:'Folder child',x:-80,y:0,pinned:true}),makeAtom({id:'crosslink',title:'Cross link only',x:260,y:0,pinned:true}),makeAtom({id:'outside',title:'Outside',x:420,y:150,pinned:true})];
 const links=[makeLink(atoms[0].id,atoms[1].id,'grouped'),makeLink(atoms[1].id,atoms[2].id,'related','manual')];
 await importMap(page,{atoms,links});await toggle(page,true);
 const map=page.locator('canvas.map');await expect(map).toHaveAttribute('data-layout','idle');
 const a=await screen(page,-320,-70),b=await screen(page,-20,90);
 await page.keyboard.down('Shift');await page.mouse.move(a.x,a.y);await page.mouse.down();
 for(const p of [{x:b.x,y:a.y},b,{x:a.x,y:b.y},a])await page.mouse.move(p.x,p.y,{steps:5});
 await page.mouse.up();await page.keyboard.up('Shift');await expect(map).toHaveAttribute('data-selection-count','2');
 await page.getByRole('button',{name:'Создать папку из выделения',exact:true}).click();await page.getByRole('textbox',{name:'Название папки',exact:true}).fill('Работа');
 await page.locator('.folder-strip').getByRole('button',{name:'Создать',exact:true}).click();
 await expect(page.locator('.folder-strip').getByRole('button',{name:'Работа 2',exact:true})).toBeVisible();
 await expect(page.locator('.folder-territories path').first()).toBeAttached();
 await page.locator('.folder-strip').getByRole('button',{name:'Все',exact:true}).click();await expect(map).toHaveAttribute('data-nodes','4');
 let saved=await readMap(page);expect(saved.links).toEqual(links);expect(saved.atoms.map(a=>[a.id,a.x,a.y])).toEqual(atoms.map(a=>[a.id,a.x,a.y]));
 const owner=saved.atoms.find(a=>Array.isArray(a.properties[FOLDER_DEFINITIONS]))!;
 const folderId=(owner.properties[FOLDER_DEFINITIONS] as Array<{id:string}>)[0].id;
 await map.press('Escape');await focus(page,'Folder root',false);
 const point=await screen(page,atoms[0].x,atoms[0].y);await page.mouse.click(point.x,point.y,{button:'right'});
 await page.getByRole('button',{name:/Связанный атом/}).click();
 await page.getByRole('textbox',{name:'Название',exact:true}).fill('Inherited child');await page.getByRole('button',{name:'Готово',exact:true}).click();
 await expect(page.locator('.folder-strip').getByRole('button',{name:'Работа 3',exact:true})).toBeVisible();
 saved=await readMap(page);expect(saved.atoms.find(a=>a.title==='Inherited child')?.properties[FOLDER_MEMBERSHIP]).toEqual({[folderId]:1});
 expect(saved.atoms.find(a=>a.id==='crosslink')?.properties[FOLDER_MEMBERSHIP]).toBeUndefined();
 for(const link of links)expect(saved.links).toContainEqual(link);
 const definitions=saved.atoms.find(a=>a.id===owner.id)!.properties[FOLDER_DEFINITIONS];
 await toggle(page,false);await expect(page.locator('.folder-strip')).toHaveCount(0);await expect(page.locator('.folder-territories')).toHaveCount(0);
 const disabled=await readMap(page);expect(disabled.atoms.find(a=>a.id===owner.id)!.properties[FOLDER_DEFINITIONS]).toEqual(definitions);expect(disabled.links).toEqual(saved.links);
 await page.reload();await expect(map).toBeVisible();await expect(page.locator('.folder-strip')).toHaveCount(0);
 await toggle(page,true);await expect(page.locator('.folder-strip').getByRole('button',{name:'Работа 3',exact:true})).toBeVisible();
 const restored=await readMap(page);expect(restored.atoms.find(a=>a.id===owner.id)!.properties[FOLDER_DEFINITIONS]).toEqual(definitions);expect(restored.links).toEqual(saved.links);
 expect(restored.atoms.find(a=>a.title==='Inherited child')?.properties[FOLDER_MEMBERSHIP]).toEqual({[folderId]:1});expect(errors).toEqual([]);
});
