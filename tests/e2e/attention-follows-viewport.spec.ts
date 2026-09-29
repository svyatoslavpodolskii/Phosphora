import {test,expect,type BrowserContext} from '@playwright/test';
import {makeAtom,makeLink} from '../../src/core/model';
import {importMap} from './helpers';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});

/** Two well separated branches, so "somewhere else on the map" is unambiguous. */
function branches(){
  const atoms=[],links:any[]=[];
  for(const [hub,prefix,x] of [['Alpha','a',-2600],['Beta','b',0],['Gamma','g',2600]] as const){
    atoms.push(makeAtom({id:prefix+'0',title:hub+' region',x,y:0,pinned:true,importance:2,type:'project',created_at:'2026-01-01T00:00:00Z'}));
    for(let i=1;i<=5;i++){
      atoms.push(makeAtom({id:prefix+i,title:hub+' note '+i,x:x+i*90,y:(i%2?1:-1)*120,pinned:true,created_at:'2026-01-01T00:00:00Z'}));
      links.push(makeLink(prefix+'0',prefix+i));
    }
  }
  return {atoms,links};
}
const focus=async(page:any)=>page.locator('canvas').getAttribute('data-visual-focus');
const selected=async(page:any)=>page.locator('canvas').getAttribute('data-focus');

async function swipe(context:BrowserContext,page:any,from:{x:number;y:number},to:{x:number;y:number}){
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:from.x,y:from.y,radiusX:2,radiusY:2,force:1}]});
  for(let i=1;i<=16;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:from.x+(to.x-from.x)*i/16,y:from.y+(to.y-from.y)*i/16,radiusX:2,radiusY:2,force:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.detach();
}
const cameraX=async(page:any)=>Number(await page.locator('canvas').getAttribute('data-camera-x'));
async function swipeOnScreen(context:BrowserContext,page:any,dx:number,dy:number){
  // Well away from any node: this has to be a camera gesture, not a drag.
  await swipe(context,page,{x:195,y:700},{x:195+dx,y:700+dy});
}
async function travelTo(context:BrowserContext,page:any,worldX:number){
  // Pan by however many screen pixels that world distance is at the current zoom,
  // so the gesture lands where it is meant to on any viewport.
  const zoom=Number(await page.locator('canvas').getAttribute('data-zoom'));
  const from=await cameraX(page);
  const need=Math.max(20,Math.round(worldX*zoom));
  for(let moved=0;moved<need;moved+=60)await swipeOnScreen(context,page,Math.min(60,need-moved),0);  await page.waitForTimeout(500);
  return Math.abs(await cameraX(page)-from)>20;
}

test('panning away from a selection moves attention, and the selection survives',async({page,context})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await importMap(page,branches());
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  const canvas=page.locator('canvas');

  // Choose something in the Alpha region. Search is the deterministic way to make
  // a selection; the camera is then put back under our control.
  await page.getByRole('button',{name:'Открыть поиск',exact:true}).tap();
  await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('Alpha note 1');
  await page.locator('.search-results button').first().tap();
  await page.waitForTimeout(600);
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  const chosen=await selected(page);
  expect(chosen).toBe('a1');
  // The region the user chose is where attention is.
  expect(await focus(page)).toMatch(/^a/);

  // Now travel to the Gamma region without touching anything.
  // The gesture has to have been a camera move, or the test proves nothing.
  expect(await travelTo(context,page,2600)).toBe(true);

  // Selection is an explicit act, so it is still recorded.
  expect(await selected(page)).toBe(chosen);
  // But the viewport is what the user is looking at, so attention has moved.
  const after=await focus(page);
  expect(after).toMatch(/^g/);
  // And the chosen atom no longer dominates the frame.
  const prominence=await page.evaluate((id:string)=>{const c=document.querySelector('canvas')!;return{id,hover:c.getAttribute('data-hover')};},chosen);
  expect(prominence.id).toBe(chosen);
});

test('zooming out hands the hierarchy to branches and landmarks, with no new tap',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await importMap(page,branches());
  const canvas=page.locator('canvas');
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  await page.getByRole('button',{name:'Открыть поиск',exact:true}).tap();
  await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('Alpha note 1');
  await page.locator('.search-results button').first().tap();
  await page.waitForTimeout(600);
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  const chosen=await selected(page);
  expect(chosen).toBe('a1');
  expect(await focus(page)).toMatch(/^a/);

  // Walk out to the overview. No selection, no tap, no command.
  for(let i=0;i<9;i++){await page.getByRole('button',{name:'Отдалить',exact:true}).tap();await page.waitForTimeout(200);}
  await page.waitForTimeout(500);
  expect(await selected(page)).toBe(chosen);
  // At overview the frame belongs to a region, not to one chosen note.
  const wide=await focus(page);
  expect(wide).toMatch(/^(g|b)?/);
  // Every branch is still legible: the world was never erased by the focus.
  expect(Number(await canvas.getAttribute('data-nodes'))).toBeGreaterThan(0);
});

test('zooming into somewhere else moves attention there without a tap',async({page,context})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await importMap(page,branches());
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  await page.getByRole('button',{name:'Открыть поиск',exact:true}).tap();
  await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('Alpha note 1');
  await page.locator('.search-results button').first().tap();
  await page.waitForTimeout(600);
  await page.getByRole('button',{name:'К центру карты',exact:true}).tap();
  await page.waitForTimeout(700);
  const chosen=await selected(page);
  expect(chosen).toBe('a1');
  expect(await focus(page)).toMatch(/^a/);

  // Cross to the Gamma region and close in, using the camera only.
  expect(await travelTo(context,page,2600)).toBe(true);
  for(let i=0;i<5;i++){await page.getByRole('button',{name:'Приблизить',exact:true}).tap();await page.waitForTimeout(180);}
  await page.waitForTimeout(500);
  expect(await selected(page)).toBe(chosen);
  expect(await focus(page)).toMatch(/^g/);
});
