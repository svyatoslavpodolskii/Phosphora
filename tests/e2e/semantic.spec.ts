import {test,expect} from '@playwright/test';
import {largeFixture} from '../large-fixture';
import {branchingLayout} from '../../src/graph/structure';
import {importMap,readMap} from './helpers';
test('semantic zoom reverses during transition and preserves pinned world coordinates',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();const fixture=largeFixture();fixture.atoms[4].title='👩🏽‍💻 Обсуждение проекта 日本語';const layout=branchingLayout(fixture);for(const a of fixture.atoms){Object.assign(a,layout.points.get(a.id));a.pinned=true;}await importMap(page,fixture);const toast=page.getByRole('button',{name:'Скрыть уведомление',exact:true});if(await toast.isVisible())await toast.click();const canvas=page.locator('canvas');await page.getByRole('button',{name:'К центру карты',exact:true}).click();await expect(canvas).toHaveAttribute('data-transition','idle');const grouped=Number(await canvas.getAttribute('data-nodes'));expect(grouped).toBeLessThan(120);
 await page.screenshot({path:'artifacts/semantic-overview.png'});
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'Приблизить',exact:true}).click();await expect(canvas).toHaveAttribute('data-nodes','120');await expect(canvas).toHaveAttribute('data-transition','idle');await page.screenshot({path:'artifacts/semantic-detail.png'});
 for(let i=0;i<5;i++){await page.getByRole('button',{name:'Отдалить',exact:true}).click();}for(let i=0;i<5;i++){await page.getByRole('button',{name:'Приблизить',exact:true}).click();}await expect(canvas).toHaveAttribute('data-transition','idle');const restored=await readMap(page);expect(restored.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(fixture.atoms.map(a=>[a.id,a.x,a.y]).sort());
});
