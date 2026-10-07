import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,readMap} from './helpers';
for(const mobile of [false,true])test(`pause and resume survive reload on ${mobile?'mobile':'desktop'}`,async({page})=>{
 const width=mobile?390:1280,height=mobile?844:800;await page.setViewportSize({width,height});await page.goto('/');
 await importMap(page,{atoms:[makeAtom({title:'Keep my state',state:'now',pinned:true})],links:[]});
 const open=async()=>{await page.locator('canvas.map').click({position:{x:width/2,y:height/2},button:'right'});await expect(page.locator('.atom-menu')).toBeVisible();};
 await open();await page.getByRole('button',{name:'\u041f\u0430\u0443\u0437\u0430',exact:true}).click();
 await page.reload();await expect(page.locator('canvas.map')).toHaveAttribute('data-nodes','1');
 expect((await readMap(page)).atoms[0]).toMatchObject({state:'paused',properties:{'phosphora.pauseState':'now'}});
 await open();await page.getByRole('button',{name:'\u0412\u043e\u0437\u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c',exact:true}).click();
 expect((await readMap(page)).atoms[0].state).toBe('now');
});
