import {test,expect,type Page} from '@playwright/test';
import {makeAtom,makeLink} from '../../src/core/model';
import {importMap,readMap} from './helpers';

test.use({hasTouch:true});
async function point(page:Page,x:number,y:number){const map=page.locator('canvas.map'),box=(await map.boundingBox())!;return{x:box.x+box.width/2+Number(await map.getAttribute('data-camera-x'))+x*Number(await map.getAttribute('data-zoom')),y:box.y+box.height/2+Number(await map.getAttribute('data-camera-y'))+y*Number(await map.getAttribute('data-zoom'))};}
for(const mobile of [false,true]){
 test(`direct link dwell, duplicate and stable transient Undo on ${mobile?'touch':'desktop'}`,async({page,context})=>{
  await page.setViewportSize({width:mobile?390:1280,height:mobile?844:800});await page.goto('/');
  const atoms=[makeAtom({id:'direct-a',title:'Source',x:-90,y:0}),makeAtom({id:'direct-b',title:'Target',x:90,y:0,pinned:true}),makeAtom({id:'direct-c',title:'Neighbor',x:-90,y:150})];
  await importMap(page,{atoms,links:[makeLink('direct-a','direct-c')]});
  const map=page.locator('canvas.map');await expect(map).toHaveAttribute('data-nodes','3');await expect(map).toHaveAttribute('data-transition','idle');
  const cdp=await context.newCDPSession(page);
  const touch=(type:string,p?:{x:number;y:number})=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]});
  async function begin(){const a=await point(page,-90,0);if(mobile){await touch('touchStart',a);await page.waitForTimeout(600);}else{await page.mouse.move(a.x,a.y);await page.mouse.down();}}
  async function move(p:{x:number;y:number}){if(mobile)await touch('touchMove',p);else await page.mouse.move(p.x,p.y,{steps:8});}
  async function end(){if(mobile)await touch('touchEnd');else await page.mouse.up();}
  const proposal=page.locator('.drag-link-proposal'),undo=page.getByRole('button',{name:'Отменить изменение связи',exact:true});
  // A confirmed preview still cancels without creating a link or saving geometry.
  await begin();await move(await point(page,90,0));await expect(proposal).toHaveAttribute('data-ready','true');
  if(mobile){const p=await point(page,90,0);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1},{x:45,y:160,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
  else{await page.keyboard.press('Escape');await page.mouse.up();}
  await expect(proposal).toHaveCount(0);expect((await readMap(page)).links).toHaveLength(1);
  await begin();await move(await point(page,90,0));
  await expect(proposal).toHaveAttribute('data-ready','false');await expect(proposal.locator('svg').first()).toBeVisible();
  await expect(proposal).toHaveAttribute('data-ready','true');await expect(proposal).toContainText('Отпустите для связи');
  await page.screenshot({path:`artifacts/direct-link-preview-${mobile?'touch':'desktop'}.png`});
  await end();await expect(proposal).toHaveCount(0);await expect(undo).toHaveCount(1);await expect(undo).toBeVisible();
  const box=await page.locator('.link-undo').boundingBox();
  const actions=await page.locator('.link-actions').boundingBox();if(actions)expect(box!.y+box!.height).toBeLessThanOrEqual(actions.y);
  await page.screenshot({path:`artifacts/direct-link-undo-${mobile?'touch':'desktop'}.png`});
  // A held pointer hides link handles but the same toast stays mounted and fixed.
  await page.evaluate(()=>{(window as any).__undoElement=document.querySelector('.link-undo');});
  const empty=await point(page,0,-150);if(mobile)await touch('touchStart',empty);else{await page.mouse.move(empty.x,empty.y);await page.mouse.down();}
  await expect(undo).toBeVisible();expect(await page.locator('.link-undo').boundingBox()).toEqual(box);
  expect(await page.evaluate(()=>(window as any).__undoElement===document.querySelector('.link-undo'))).toBe(true);
  if(mobile)await touch('touchCancel');else{await page.keyboard.press('Escape');await page.mouse.up();}
  // Existing pairs are acknowledged without a second mutation or new toast deadline.
  await begin();await move(await point(page,90,0));await expect(proposal).toContainText('Связаны');await expect(proposal).toHaveAttribute('data-ready','true');await end();
  const data=await readMap(page);expect(data.links).toHaveLength(2);expect(data.links.filter(l=>l.from==='direct-a'&&l.to==='direct-b')).toHaveLength(1);
  expect(data.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(atoms.map(a=>[a.id,a.x,a.y]).sort());
  await undo.click();await expect(undo).toHaveCount(0);expect((await readMap(page)).links).toHaveLength(1);
  await begin();await move(await point(page,90,0));await expect(proposal).toHaveAttribute('data-ready','true');await end();await expect(undo).toBeVisible();
  // Frequent camera/gesture renders must neither flicker nor renew the deadline.
  for(let i=0;i<4;i++){await map.press(i%2?'ArrowLeft':'ArrowRight');await page.waitForTimeout(900);await expect(undo).toBeVisible();}
  await expect(undo).toHaveCount(0,{timeout:6000});
  // Dismissal closes just this notification, with the relationship intact.
  await page.getByRole('button',{name:'Разорвать',exact:true}).click();await expect(undo).toBeVisible();
  await page.locator('.link-undo').getByRole('button',{name:'Скрыть уведомление',exact:true}).click();await expect(undo).toHaveCount(0);
  expect((await readMap(page)).links).toHaveLength(1);
 });
 test(`crossing, cancellation and ordinary drag remain safe on ${mobile?'touch':'desktop'}`,async({page,context})=>{
  await page.setViewportSize({width:mobile?390:1280,height:mobile?844:800});await page.goto('/');
  const atoms=[makeAtom({id:'cross-a',title:'Source',x:-90,y:0}),makeAtom({id:'cross-b',title:'Target',x:90,y:0,pinned:true})];await importMap(page,{atoms,links:[]});
  const map=page.locator('canvas.map');await expect(map).toHaveAttribute('data-nodes','2');await expect(map).toHaveAttribute('data-transition','idle');
  const cdp=await context.newCDPSession(page),touch=(type:string,points:{x:number;y:number;id:number}[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
  const a=await point(page,-90,0),b=await point(page,90,0);
  if(mobile){await touch('touchStart',[{...a,id:1}]);await page.waitForTimeout(600);await touch('touchMove',[{...b,id:1}]);await touch('touchEnd',[]);}else{await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();}
  await expect(page.locator('.link-undo')).toHaveCount(0);let data=await readMap(page);expect(data.links).toHaveLength(0);expect(data.atoms.find(a=>a.id==='cross-a')!.x).toBeGreaterThan(50);
  // Canceling a prepared proposal (Escape or a second touch) restores the drag.
  const start=await point(page,90,0),target=await point(page,90,100);
  if(mobile){await touch('touchStart',[{...start,id:1}]);await page.waitForTimeout(600);await touch('touchMove',[{...target,id:1}]);await touch('touchStart',[{...target,id:1},{x:50,y:150,id:2}]);await touch('touchCancel',[]);}else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:5});await page.keyboard.press('Escape');await page.mouse.up();}
  await expect(page.locator('.drag-link-proposal')).toHaveCount(0);data=await readMap(page);expect(data.links).toHaveLength(0);expect(data.atoms.every(a=>Math.abs(a.y)<1)).toBe(true);
 });
}
