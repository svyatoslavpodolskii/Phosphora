import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,readMap} from './helpers';
for(const mobile of [false,true])test(`task board persists tasks and source state on ${mobile?'mobile':'desktop'}`,async({page})=>{
 await page.setViewportSize({width:mobile?390:1280,height:844});await page.goto('/');
 await importMap(page,{atoms:[makeAtom({id:'tasks',title:'Project',content:'- [ ] First task\n- [ ] Second task',pinned:true})],links:[]});
 await page.locator('.view-toggle button').last().click();
 const group=page.locator('[data-source="tasks"]');await expect(group).toBeVisible();
 await group.getByRole('checkbox',{name:'First task',exact:true}).check();
 await group.locator('details').first().locator('summary').click();
 await group.locator('details').first().locator('select').first().selectOption('daily');
 await group.locator('.group-controls select').selectOption('now');
 await expect(page.locator('[data-task-lane="now"] [data-source="tasks"]')).toBeVisible();
 let data=await readMap(page);expect(data.atoms[0].content).toContain('- [x] First task');expect(data.atoms[0].state).toBe('now');
 const tasks=data.atoms[0].properties['phosphora.tasks'] as any[];expect(tasks[0].recurrence).toBe('daily');expect(Object.values(tasks[0].history)).toContain(true);expect(new Set(tasks.map(t=>t.id)).size).toBe(2);
 await page.reload();await expect(group).toBeVisible();await expect(group.getByRole('checkbox',{name:'First task',exact:true})).toBeChecked();
 await page.screenshot({path:`artifacts/task-board-${mobile?'mobile':'desktop'}.png`});
 await page.locator('.view-toggle button').first().click();await expect(page.locator('canvas.map')).toBeVisible();
});
