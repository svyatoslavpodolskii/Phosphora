import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,readMap} from './helpers';

test('slow contact on the production canvas stays compact and zoom preserves resting positions',async({page})=>{
 await page.goto('/');
 await importMap(page,{atoms:[
  makeAtom({id:'contact-a',title:'A',x:0,y:0,pinned:true,appearance:{size_override:30}}),
  makeAtom({id:'contact-b',title:'B',x:130,y:0,appearance:{size_override:30}}),
 ],links:[]});
 await expect(page.locator('canvas.map')).toHaveAttribute('data-nodes','2');
 await page.mouse.move(640,360);await page.mouse.down();
 await page.mouse.move(690,360,{steps:30});await page.waitForTimeout(300);await page.mouse.up();
 let data=await readMap(page);
 expect(data.atoms.find(a=>a.id==='contact-b')!.x).toBeCloseTo(130,0);
 await page.mouse.move(690,360);await page.mouse.down();
 await page.mouse.move(725,360,{steps:30});await page.waitForTimeout(400);await page.mouse.up();
 await page.waitForTimeout(1800);
 data=await readMap(page);
 const a=data.atoms.find(a=>a.id==='contact-a')!,b=data.atoms.find(a=>a.id==='contact-b')!;
 expect(a.pinned).toBe(true);expect(a.x).toBeCloseTo(85,0);
 expect(b.x-a.x).toBeGreaterThanOrEqual(73);expect(b.x-a.x).toBeLessThan(92);
 let resting=data;await expect.poll(async()=>{const next=await readMap(page);const moved=Math.max(...next.atoms.map(a=>Math.hypot(a.x-resting.atoms.find(b=>b.id===a.id)!.x,a.y-resting.atoms.find(b=>b.id===a.id)!.y)));resting=next;return moved;},{timeout:12000,intervals:[400]}).toBe(0);data=resting;
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'Отдалить',exact:true}).click();
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'Приблизить',exact:true}).click();
 await page.waitForTimeout(500);
 const zoomed=await readMap(page);
 expect(zoomed.atoms.map(n=>[n.id,n.x,n.y])).toEqual(data.atoms.map(n=>[n.id,n.x,n.y]));
 await page.screenshot({path:'artifacts/soft-contact.png'});
 await page.reload();const restored=await readMap(page);
 expect(restored.atoms.map(n=>[n.id,n.x,n.y,n.pinned])).toEqual(zoomed.atoms.map(n=>[n.id,n.x,n.y,n.pinned]));
});
