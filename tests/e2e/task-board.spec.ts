import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,readMap} from './helpers';
test.use({hasTouch:true});
for(const mobile of [false,true])test(`task board persists tasks and source state on ${mobile?'mobile':'desktop'}`,async({page})=>{
 await page.setViewportSize({width:mobile?390:1280,height:844});await page.goto('/');
 await importMap(page,{atoms:[makeAtom({id:'tasks',title:'Project',content:'- [ ] First task\n- [ ] Second task',pinned:true})],links:[]});
 await page.locator('.view-toggle button').last().click();
 const group=page.locator('[data-source="tasks"]');await expect(group).toBeVisible();
 await group.getByRole('checkbox',{name:'First task',exact:true}).check();
 await group.locator('details').first().locator('summary').click();
 await group.locator('details').first().locator('select').first().selectOption('daily');
 await expect(group.locator('.task-history [role="listitem"]')).toHaveCount(7);
 await expect(group.locator('.task-history .complete')).toHaveCount(1);
 await group.locator('details').first().locator('select').last().selectOption('30');
 await expect(group.locator('.task-history [role="listitem"]')).toHaveCount(30);
 await page.screenshot({path:`artifacts/task-history-${mobile?'mobile':'desktop'}.png`});
 await group.locator('.group-controls select').selectOption('now');
 await expect(page.locator('[data-task-lane="now"] [data-source="tasks"]')).toBeVisible();
 let data=await readMap(page);expect(data.atoms[0].content).toContain('- [x] First task');expect(data.atoms[0].state).toBe('now');
 const tasks=data.atoms[0].properties['phosphora.tasks'] as any[];expect(tasks[0].recurrence).toBe('daily');expect(Object.values(tasks[0].history)).toContain(true);expect(new Set(tasks.map(t=>t.id)).size).toBe(2);
 await page.reload();await expect(group).toBeVisible();await expect(group.getByRole('checkbox',{name:'First task',exact:true})).toBeChecked();
 await page.screenshot({path:`artifacts/task-board-${mobile?'mobile':'desktop'}.png`});
 const handle=group.locator('.group-drag');await handle.scrollIntoViewIfNeeded();const box=(await handle.boundingBox())!;
 const start={x:box.x+box.width/2,y:box.y+box.height/2};
 const cdp=await page.context().newCDPSession(page);
 if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});else{await page.mouse.move(start.x,start.y);await page.mouse.down();}
 const target=page.locator('.task-destinations [data-task-lane="archived"]');await expect(target).toBeVisible();const end=(await target.boundingBox())!;const dest={x:end.x+end.width/2,y:end.y+end.height/2};
 if(mobile){for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(dest.x-start.x)*i/8,y:start.y+(dest.y-start.y)*i/8,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(dest.x,dest.y,{steps:8});await page.mouse.up();}
 await expect(page.locator('[data-task-lane="archived"] [data-source="tasks"]')).toBeVisible();
 expect((await readMap(page)).atoms[0].state).toBe('archived');
 await page.locator('.search-trigger').click();await page.locator('.search input').fill('Project');await page.locator('.search-results button').first().click();await expect(page.locator('canvas.map')).toBeVisible();await expect(page.locator('.kanban')).toHaveCount(0);
});
