import {selectModel} from './helpers';
import {test,expect} from '@playwright/test';
import {stressFixture} from '../stress-fixture';
import {importMap,openSettings,closeSettings,readMap} from './helpers';
test('switching structural models fits around pins and manually stable positions',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();const data=stressFixture(100);Object.assign(data.atoms[0],{x:5000,y:2000,pinned:true});Object.assign(data.atoms[1],{x:5300,y:2000,pinned:true});Object.assign(data.atoms[7],{x:5600,y:2200,spatial:{resistance:10}});await importMap(page,data);
 for(const name of ['Ветви','Молекула','Созвездия']){await openSettings(page);await selectModel(page,name);await closeSettings(page);await expect(page.locator('canvas.map')).toHaveAttribute('data-layout','idle');const actual=await readMap(page);for(const index of [0,1,7]){const a=actual.atoms.find(a=>a.id===data.atoms[index].id)!;expect([a.x,a.y]).toEqual([data.atoms[index].x,data.atoms[index].y]);}const child=actual.atoms.find(a=>a.id==='stress-2')!;expect(Math.hypot(child.x-5000,child.y-2000)).toBeLessThan(3000);await expect(page.getByRole('alert')).toHaveCount(0);}
});
