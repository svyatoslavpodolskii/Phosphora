import {test,expect} from '@playwright/test';
import {makeAtom} from '../../src/core/model';
import {importMap,readMap} from './helpers';
test.use({hasTouch:true});
for(const mobile of [false,true])test(`physical relationships create, reconnect, break and undo on ${mobile?'mobile':'desktop'}`,async({page})=>{
 const width=mobile?390:1280,height=mobile?844:800;await page.setViewportSize({width,height});await page.goto('/');
 const atoms=[makeAtom({id:'link-a',title:'Source',x:-90,y:0,pinned:true}),makeAtom({id:'link-b',title:'Target',x:90,y:0,pinned:true}),makeAtom({id:'link-c',title:'Other',x:0,y:170,pinned:true})];
 await importMap(page,{atoms,links:[]});await expect(page.locator('canvas.map')).toHaveAttribute('data-nodes','3');
 const cdp=await page.context().newCDPSession(page);
 async function drag(a:{x:number;y:number},b:{x:number;y:number}){
  if(mobile){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*i/8,y:a.y+(b.y-a.y)*i/8,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();}
 }
 const source={x:width/2-90,y:height/2};
 if(mobile){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...source,id:1}]});await page.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else await page.mouse.click(source.x,source.y,{button:'right'});
 await page.getByRole('button',{name:'Связать на карте',exact:true}).click();
 const handle=page.getByRole('button',{name:'Создать связь',exact:true});await expect(handle).toBeVisible();
 const box=(await handle.boundingBox())!;
 await drag({x:box.x+22,y:box.y+22},{x:width/2,y:height/2-140});
 await expect(page.locator('footer')).toContainText('0 \u0441\u0432\u044f\u0437\u0435\u0439');
 if(mobile){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+22,y:box.y+22,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
 else{await page.mouse.move(box.x+22,box.y+22);await page.mouse.down();await page.mouse.move(width/2+90,height/2);await page.keyboard.press('Escape');await page.mouse.up();}
 await expect(page.locator('footer')).toContainText('0 \u0441\u0432\u044f\u0437\u0435\u0439');
 await drag({x:box.x+22,y:box.y+22},{x:width/2+90,y:height/2});
 await expect(page.getByRole('button',{name:'Разорвать',exact:true})).toBeVisible();
 const actions=(await page.locator('.link-actions').boundingBox())!,lenses=(await page.locator('footer nav').boundingBox())!;expect(actions.y+actions.height).toBeLessThan(lenses.y);
 await page.screenshot({path:`artifacts/relationships-${mobile?'mobile':'desktop'}.png`,animations:'disabled'});
 let data=await readMap(page);expect(data.links).toHaveLength(1);expect(data.links[0]).toMatchObject({from:'link-a',to:'link-b'});
 // Reading a backup opens a surface and clears the transient link selection.
 if(mobile)await page.touchscreen.tap(width/2,height/2+4);else await page.mouse.click(width/2,height/2+4);
 const endpoint=page.getByRole('button',{name:'Переподключить конец связи',exact:true});await expect(endpoint).toBeVisible();const end=(await endpoint.boundingBox())!;
 await drag({x:end.x+22,y:end.y+22},{x:width/2,y:height/2+170});
 await expect(page.getByRole('button',{name:'Отменить изменение связи',exact:true})).toBeVisible();
 data=await readMap(page);expect(data.links[0]).toMatchObject({from:'link-a',to:'link-c'});
 await page.getByRole('button',{name:'Отменить изменение связи',exact:true}).click();
 await expect(page.getByRole('button',{name:'Разорвать',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Разорвать',exact:true}).click();await expect(page.locator('footer')).toContainText('0 связей');
 await page.getByRole('button',{name:'Отменить изменение связи',exact:true}).click();
 data=await readMap(page);expect(data.links[0]).toMatchObject({from:'link-a',to:'link-b'});
 expect(data.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(atoms.map(a=>[a.id,a.x,a.y]).sort());
 await page.reload();await expect(page.locator('canvas.map')).toHaveAttribute('data-nodes','3');expect((await readMap(page)).links).toHaveLength(1);
});
