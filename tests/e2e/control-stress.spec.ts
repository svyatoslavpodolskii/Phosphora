import {test,expect,type Page} from '@playwright/test';
import {makeAtom,makeLink,type Snapshot} from '../../src/core/model';
import {branchingLayout} from '../../src/graph/structure';
import {importMap,readMap} from './helpers';

/** A scaled copy of the real fixture grammar, laid out and pinned so the test
 *  measures the camera rather than a simulation that is still moving. */
function fixtureOfSize(groups:number):Snapshot{
  const topics=['Творчество','Исследования','Путешествия','Дом и сад'],branches=['Идеи','Планы','Люди','Находки'],titles=['Утренние заметки','Собрать вдохновение','Новый мартшрут','Разговор','Проверить гипотезу','Книга на выходные','Встреча в пятницу','Наблюдения за светом','Следующий шаг','Что попробовать','Сохранить воспоминание','Неожиданная связь','Доработать набросок','Вопросы для обсуждения','Тихое место','Полезные материалы','Опыт недели','Список для проекта','Посмотреть иначе','Вернуться к этому'];
  const atoms=[],links:any[]=[];
  for(let g=0;g<groups;g++){
   const prefix='g'+g+'-';
   for(let i=0;i<28;i++)atoms.push(makeAtom({id:prefix+i,title:i===0?topics[g%4]:i<5?branches[i-1]+' · '+topics[g%4]:titles[(i-5)%titles.length],type:i===0?'project':i<5?'area':i%7===0?'person':i%5===0?'task':'note',importance:i===0?2:i<5?1:0,created_at:'2026-09-12T00:00:00Z',appearance:{shape:i%5===0?'square':'circle'}}));
   for(let i=1;i<28;i++){const parent=i<5?0:i<25?1+(i-5)%4:5+(i-25)*4;const l=makeLink(prefix+parent,prefix+i,'related','context');l.id=prefix+'edge-'+i;links.push(l);}
   for(const [from,to] of [[5,6],[11,12]]){const l=makeLink(prefix+from,prefix+to);l.id=prefix+'cross-'+from;links.push(l);}
  }
  const data={atoms,links},layout=branchingLayout(data);
  for(const a of atoms){Object.assign(a,layout.points.get(a.id));a.pinned=true;}
  return data;
}

/** Records the camera the renderer actually used, once per animation frame. */
async function startRecorder(page:Page){
  await page.evaluate(()=>{const c=document.querySelector('canvas')!,log:number[][]=[];(function loop(){log.push([Number(c.getAttribute('data-camera-x')),Number(c.getAttribute('data-camera-y')),Number(c.getAttribute('data-zoom'))]);if(log.length<20000)requestAnimationFrame(loop);})();(window as any).__cameraLog=log;});
}
async function readRecorder(page:Page){
  return page.evaluate(()=>{const log=(window as any).__cameraLog as number[][];delete (window as any).__cameraLog;return log;});
}
/** The largest single frame of camera motion, in log zoom and in screen pixels. */
function worstStep(log:number[][]){
  let zoom=0,pan=0,moving=0;
  for(let i=1;i<log.length;i++){
   const dz=Math.abs(Math.log(log[i][2]/log[i-1][2])),dp=Math.hypot(log[i][0]-log[i-1][0],log[i][1]-log[i-1][1]);
   if(dz<1e-6&&dp<1e-6)continue;
   moving++;zoom=Math.max(zoom,dz);pan=Math.max(pan,dp);
  }
  return {zoom,pan,moving};
}

async function settleMap(page:Page){await page.getByRole('button',{name:'К центру карты',exact:true}).click();await page.waitForTimeout(900);}
async function dismissToast(page:Page){const toast=page.getByRole('button',{name:'Скрыть уведомление',exact:true});if(await toast.isVisible())await toast.click();}

/** A minute of the gestures that make a map feel like a physical object. */
async function driveMap(page:Page,rounds:number){
  for(let round=0;round<rounds;round++){
   const toward=round%2?-1:1;
   for(let i=0;i<10;i++){await page.mouse.move(420+i*22,300+i*9);await page.mouse.wheel(0,toward*110);await page.waitForTimeout(16);}
   await page.waitForTimeout(220);
   for(let i=0;i<10;i++){await page.mouse.move(420+i*22,300+i*9);await page.mouse.wheel(0,-toward*110);await page.waitForTimeout(16);}
   await page.waitForTimeout(220);
   for(const [x,y] of [[560,300],[598,318],[636,336],[598,318]] as [number,number][]){
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();
    await page.waitForTimeout(90);
    if(await page.getByRole('dialog',{name:'Редактор атома'}).isVisible()){await page.getByRole('button',{name:'Закрыть редактор'}).click();await page.waitForTimeout(60);}
   }
   // Drag a node, then pan the empty canvas.
   await page.mouse.move(636,336);await page.mouse.down();await page.mouse.move(700,372,{steps:8});await page.mouse.up();
   await page.waitForTimeout(120);
   await page.mouse.move(200,560);await page.mouse.down();await page.mouse.move(280,590,{steps:6});await page.mouse.up();
   await page.waitForTimeout(260);
  }
}

test('100 atoms: continuous control never produces a camera jump',async({page})=>{
  test.setTimeout(180000);
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const data=fixtureOfSize(3);
  await importMap(page,data);
  await dismissToast(page);
  await settleMap(page);
  await startRecorder(page);
  await driveMap(page,6);
  const log=await readRecorder(page);
  const worst=worstStep(log);
  expect(worst.moving).toBeGreaterThan(200);
  // No single frame may move the world by a visible amount, in either axis.
  expect(worst.zoom).toBeLessThan(.2);
  expect(worst.pan).toBeLessThan(140);
  // And the stored world is exactly what it was.
  const after=await readMap(page);
  expect(after.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(data.atoms.map(a=>[a.id,a.x,a.y]).sort());
  await page.screenshot({path:'artifacts/control-100.png'});
});

test('500 atoms: level of detail crossings read as a transition, not a rebuild',async({page})=>{
  test.setTimeout(240000);
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const data=fixtureOfSize(17);
  expect(data.atoms).toHaveLength(476);
  await importMap(page,data);
  await dismissToast(page);
  const canvas=page.locator('canvas');
  await settleMap(page);
  const grouped=Number(await canvas.getAttribute('data-nodes'));
  expect(grouped).toBeLessThan(140);
  await startRecorder(page);
  await driveMap(page,5);
  const log=await readRecorder(page);
  const worst=worstStep(log);
  expect(worst.moving).toBeGreaterThan(200);
  expect(worst.zoom).toBeLessThan(.2);
  expect(worst.pan).toBeLessThan(140);
  // Crossing the boundary back and forth repeatedly leaves the world untouched.
  for(let i=0;i<8;i++){await page.getByRole('button',{name:'Приблизить',exact:true}).click();await page.waitForTimeout(60);}
  for(let i=0;i<8;i++){await page.getByRole('button',{name:'Отдалить',exact:true}).click();await page.waitForTimeout(60);}
  await expect(canvas).toHaveAttribute('data-transition','idle');
  const after=await readMap(page);
  expect(after.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(data.atoms.map(a=>[a.id,a.x,a.y]).sort());
  await page.screenshot({path:'artifacts/control-500.png'});
});

test('1000 atoms: input stays smooth while the background keeps refining',async({page})=>{
  test.setTimeout(300000);
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const data=fixtureOfSize(35);
  expect(data.atoms).toHaveLength(980);
  await importMap(page,data);
  await dismissToast(page);
  const canvas=page.locator('canvas');
  await settleMap(page);
  await startRecorder(page);
  await driveMap(page,4);
  const log=await readRecorder(page);
  const worst=worstStep(log);
  expect(worst.moving).toBeGreaterThan(150);
  expect(worst.zoom).toBeLessThan(.2);
  expect(worst.pan).toBeLessThan(140);
  // Overview to detail and back, with the background still working.
  for(let i=0;i<8;i++){await page.getByRole('button',{name:'Приблизить',exact:true}).click();await page.waitForTimeout(70);}
  await expect(canvas).toHaveAttribute('data-nodes',String(data.atoms.length));
  await page.waitForTimeout(300);
  for(let i=0;i<6;i++){await page.getByRole('button',{name:'Отдалить',exact:true}).click();await page.waitForTimeout(70);}
  expect(Number(await canvas.getAttribute('data-nodes'))).toBeLessThan(140);
  await page.waitForTimeout(400);
  const after=await readMap(page);
  expect(after.atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(data.atoms.map(a=>[a.id,a.x,a.y]).sort());
  await page.screenshot({path:'artifacts/control-1000.png'});
});
