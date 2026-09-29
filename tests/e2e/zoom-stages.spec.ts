import {test,expect} from '@playwright/test';
import {makeAtom,makeLink} from '../../src/core/model';
import {importMap,readMap} from './helpers';

/** Reads the live view transform straight off the canvas. */
const view=async(page:any)=>page.evaluate(()=>{const c=document.querySelector('canvas')!;const r=c.getBoundingClientRect();return{x:Number(c.getAttribute('data-camera-x')),y:Number(c.getAttribute('data-camera-y')),zoom:Number(c.getAttribute('data-zoom')),w:r.width,h:r.height,left:r.left,top:r.top};});
const screenOf=(v:any,world:{x:number;y:number})=>({x:v.left+v.w/2+v.x+world.x*v.zoom,y:v.top+v.h/2+v.y+world.y*v.zoom});

test('the world point under the pointer stays under it through a whole zoom',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const anchor=makeAtom({id:'anchor',title:'Anchor note',x:0,y:0,pinned:true});
  await importMap(page,{atoms:[anchor],links:[]});
  await page.getByRole('button',{name:'К центру карты',exact:true}).click();
  await page.waitForTimeout(500);
  const start=await view(page),held=screenOf(start,anchor);
  await page.mouse.move(held.x,held.y);
  // Sample the anchor's screen position on every frame of a continuous zoom.
  const drift:number[]=[];
  for(let i=0;i<10;i++){
   await page.evaluate(([x,y]:[number,number])=>{const c=document.querySelector('canvas')!;c.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,clientX:x,clientY:y,bubbles:true,cancelable:true}));},[held.x,held.y]);
   await page.waitForTimeout(35);
   const now=await view(page),seen=screenOf(now,anchor);
   drift.push(Math.hypot(seen.x-held.x,seen.y-held.y));
  }
  await page.waitForTimeout(400);
  const end=await view(page);
  expect(end.zoom).toBeGreaterThan(start.zoom*1.5);
  expect(end.zoom).toBeLessThanOrEqual(3);
  // The point the pointer grabbed never moved away from the pointer, not even
  // while the camera was still catching up.
  for(const d of drift)expect(d).toBeLessThan(2);
  expect(Math.hypot(...Object.values(screenOf(end,anchor)).map((v,i)=>v-[held.x,held.y][i]))).toBeLessThan(2);
  expect((await readMap(page)).atoms.map(a=>[a.id,a.x,a.y])).toEqual([['anchor',0,0]]);
});

test('zooming never changes what is selected, and hover is not selection',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const atoms=[makeAtom({id:'a',title:'Near branch',x:0,y:0,pinned:true}),makeAtom({id:'b',title:'Near child',x:200,y:70,pinned:true}),makeAtom({id:'c',title:'Other branch',x:1600,y:0,pinned:true}),makeAtom({id:'d',title:'Other child',x:1800,y:70,pinned:true})];
  await importMap(page,{atoms,links:[makeLink('a','b'),makeLink('c','d')]});
  const canvas=page.locator('canvas');
  await page.getByRole('button',{name:'К центру карты',exact:true}).click();
  await page.waitForTimeout(400);
  await expect(canvas).toHaveAttribute('data-focus','');
  // Sweep the pointer across the map, then zoom hard. Neither may select anything.
  for(const [x,y] of [[640,360],[520,300],[760,420],[640,360]] as [number,number][]){await page.mouse.move(x,y);await page.waitForTimeout(60);}
  await expect(canvas).toHaveAttribute('data-focus','');
  const hovered=await canvas.getAttribute('data-hover');
  expect(hovered===''||hovered==='a'||hovered==='b'||hovered==='c'||hovered==='d').toBe(true);
  for(let i=0;i<8;i++){await page.mouse.wheel(0,-120);await page.waitForTimeout(40);}
  await expect.poll(async()=>Number(await canvas.getAttribute('data-zoom'))).toBeGreaterThan(1);
  await expect(canvas).toHaveAttribute('data-focus','');
  for(let i=0;i<8;i++){await page.mouse.wheel(0,120);await page.waitForTimeout(40);}
  await expect(canvas).toHaveAttribute('data-focus','');
  expect((await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(atoms.map(a=>[a.id,a.x,a.y]).sort());
});

test('empty canvas coasts to a stop and never moves atoms',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  const atoms=[makeAtom({id:'a',title:'One',x:0,y:0,pinned:true}),makeAtom({id:'b',title:'Two',x:1600,y:0,pinned:true})];
  await importMap(page,{atoms,links:[makeLink('a','b')]});
  const canvas=page.locator('canvas');
  await page.getByRole('button',{name:'К центру карты',exact:true}).click();
  await page.waitForTimeout(500);
  await page.mouse.move(350,170);await page.mouse.down();await page.mouse.move(440,190,{steps:5});await page.mouse.up();
  const released=Number(await canvas.getAttribute('data-camera-x'));
  await expect.poll(async()=>Number(await canvas.getAttribute('data-camera-x'))).toBeGreaterThan(released+1);
  await page.mouse.down();const stopped=Number(await canvas.getAttribute('data-camera-x'));await page.waitForTimeout(200);expect(Number(await canvas.getAttribute('data-camera-x'))).toBeCloseTo(stopped,3);await page.mouse.up();
  await page.screenshot({path:'artifacts/zoom-branch-context.png'});
  expect((await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual(atoms.map(a=>[a.id,a.x,a.y]).sort());
});
