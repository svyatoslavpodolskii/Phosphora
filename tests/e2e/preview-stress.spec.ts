import {test,expect} from '@playwright/test';
import {stressFixture} from '../stress-fixture';
import {arrangeDynamics} from '../../src/plugins/dynamics/layouts';
import {PRESETS} from '../../src/graph/physics';
import {importMap,focus,readMap} from './helpers';
for(const count of [500,1000])test(`Markdown detail remains bounded in a ${count}-atom world`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:1000});
 const fixture=stressFixture(count);fixture.atoms[0].title='Preview anchor';
 fixture.atoms[0].content='## Контекст\n\n**Мысль для проверки**\n\n- [ ] @task Следующий шаг\n- Связанные материалы';
 const layout=arrangeDynamics('branch',{data:fixture,settings:PRESETS.calm,intent:'reflow'});
 const positions=new Map(layout.positions.map(p=>[p.id,p]));for(const atom of fixture.atoms){Object.assign(atom,positions.get(atom.id));atom.pinned=true;}
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await importMap(page,fixture);
 await focus(page,'Preview anchor',false);for(let i=0;i<5;i++)await page.getByRole('button',{name:'Приблизить',exact:true}).click();
 const preview=page.locator('.content-preview[data-atom="stress-0"]');await expect(preview).toHaveCount(1);
 await expect(preview.locator('strong')).toHaveText('Мысль для проверки');expect(await page.locator('.content-preview').count()).toBeLessThanOrEqual(3);
 await page.screenshot({path:`artifacts/markdown-${count}.png`});
 for(let i=0;i<8;i++)await page.getByRole('button',{name:'Отдалить',exact:true}).click();await expect(page.locator('.content-preview')).toHaveCount(0);
 const after=await readMap(page);expect(after.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(fixture.atoms.map(a=>[a.id,a.x,a.y]).sort());
});
