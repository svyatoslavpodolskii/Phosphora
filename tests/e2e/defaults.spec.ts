import {test,expect} from '@playwright/test';
import {openSettings,closeSettings} from './helpers';
test('fresh workspace keeps optional plugins off and choices persist',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
 await openSettings(page);
 await expect(page.getByRole('group',{name:'Модель карты'})).toHaveCount(0);
 await page.getByRole('button',{name:'Плагины →',exact:true}).click();
 for(const name of ['Ежедневные заметки','Типы и шаблоны','Молекула','Созвездия'])await expect(page.locator('.plugin-row').filter({hasText:name}).getByRole('button',{name:'Включить',exact:true})).toBeVisible();
 await page.locator('.plugin-row').filter({hasText:'Молекула'}).getByRole('button',{name:'Включить',exact:true}).click();
 await closeSettings(page);await page.reload();await expect(page.locator('canvas')).toBeVisible();await openSettings(page);
 await expect(page.getByRole('group',{name:'Модель карты'}).getByRole('button')).toHaveCount(2);
});
