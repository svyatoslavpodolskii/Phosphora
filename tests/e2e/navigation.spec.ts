import {test,expect} from '@playwright/test';
import {makeAtom,makeLink} from '../../src/core/model';
import {importMap,focus,readMap} from './helpers';
test('spatial search, browser history and editor return preserve the world',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();const atoms=[makeAtom({id:'nav-a',title:'Начальная мысль',x:-2400,y:100,pinned:true}),makeAtom({id:'nav-b',title:'Далёкая мысль',x:2400,y:100,pinned:true}),makeAtom({id:'nav-c',title:'Контекст мысли',x:2700,y:250,pinned:true}),makeAtom({id:'nav-d',title:'Другая область',x:0,y:-3000,pinned:true})];await importMap(page,{atoms,links:[makeLink('nav-b','nav-c')]});
 await focus(page,'Начальная мысль',false);await expect(page.locator('canvas.map')).toHaveAttribute('data-focus','nav-a');await focus(page,'Далёкая мысль',false);await expect(page.locator('canvas.map')).toHaveAttribute('data-focus','nav-b');await expect(page.locator('canvas.map')).toHaveAttribute('data-context','2');
 await page.goBack();await expect(page.locator('canvas.map')).toHaveAttribute('data-focus','nav-a');await expect(page.locator('main')).toHaveAttribute('data-navigation','idle');await page.goForward();await expect(page.locator('canvas.map')).toHaveAttribute('data-focus','nav-b');await expect(page.locator('main')).toHaveAttribute('data-navigation','idle');
 await page.locator('canvas.map').press('Enter');await expect(page.getByRole('dialog',{name:'Редактор атома'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Редактор атома'})).toBeHidden();await expect(page.locator('canvas.map')).toHaveAttribute('data-focus','nav-b');
 const after=await readMap(page);expect(after.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(atoms.map(a=>[a.id,a.x,a.y]).sort());
});
