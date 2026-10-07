import {test,expect,type BrowserContext} from '@playwright/test';
import {stressFixture} from '../stress-fixture';
import {importMap,readMap} from './helpers';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});

type Touch={x:number;y:number;id?:number};
type Cdp=any;
/** The session has to outlive the whole touch stream: Chrome keeps the active
 *  touch sequence on it and refuses a move without the start that opened it. */
async function touch(cdp:Cdp,type:'touchStart'|'touchMove'|'touchEnd',points:Touch[]){
  await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({id:p.id??i+1,radiusX:2,radiusY:2,force:1,x:p.x,y:p.y}))});
}

/** Records the camera the renderer actually used, once per animation frame. */
async function record(page:any){
  await page.evaluate(()=>{const c=document.querySelector('canvas.map')!,log:number[][]=[];(function l(){log.push([Number(c.getAttribute('data-camera-x')),Number(c.getAttribute('data-camera-y')),Number(c.getAttribute('data-zoom'))]);if(log.length<40000)requestAnimationFrame(l);})();(window as any).__cam=log;});
}
const read=async(page:any)=>page.evaluate(()=>{const l=(window as any).__cam as number[][];delete (window as any).__cam;return l;});

/** What direct manipulation actually guarantees: the camera never reverses while
 *  the fingers move one way, and it never leaves a backlog to catch up on. */
function quality(log:number[][]){
  let reversals=0,still=0,moving=0,worst=0;
  for(let i=1;i<log.length;i++){
   const dz=log[i][2]-log[i-1][2];
   if(Math.abs(dz)<1e-9)continue;
   moving++;
   worst=Math.max(worst,Math.abs(Math.log(log[i][2]/log[i-1][2])));
   // A frame that moves at all must not be followed by a frame that moves back.
   if(i>2&&Math.abs(log[i-1][2]-log[i-2][2])>1e-9&&Math.sign(dz)!==Math.sign(log[i-1][2]-log[i-2][2]))reversals++;
  }
  return {reversals,still,moving,worst};
}

/** Two fingers spreading or closing around a centre, in realistic small steps. */
async function pinch(cdp:Cdp,cx:number,cy:number,from:number,to:number,steps=14){
  const at=(spread:number)=>[{id:1,x:cx-spread/2,y:cy},{id:2,x:cx+spread/2,y:cy}];
  await touch(cdp,'touchStart',at(from));
  for(let i=1;i<=steps;i++){await touch(cdp,'touchMove',at(from+(to-from)*i/steps));await page_wait(16);}
  await touch(cdp,'touchEnd',[]);
}
const page_wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

async function ready(page:any,count:number){
  await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();
  // Pinned, so any movement the test sees is the interaction's doing and not the
  // background refinement, which is allowed to keep working underneath.
  const data=stressFixture(count);for(const a of data.atoms)a.pinned=true;
  await importMap(page,data);
  const toast=page.getByRole('button',{name:'Скрыть уведомление',exact:true});if(await toast.isVisible())await toast.click();
  await expect(page.locator('canvas.map')).toHaveAttribute('data-layout','idle',{timeout:30000});
  // Pinned fixture starts at the viewport centre; mobile zoom buttons are hidden.
  await page.waitForTimeout(800);
}

for(const count of [100,500,1000]){
  test(`${count} atoms: pinch on a phone is smooth and never jumps`,async({page,context})=>{
    test.setTimeout(240000);
    await ready(page,count);
    const canvas=page.locator('canvas.map');
    const before=(await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort();

    const cdp=await context.newCDPSession(page);
    await record(page);
    // Several pinches, alternating direction, each crossing the level bands.
    for(let round=0;round<4;round++){
      const open=round%2===0;
      await pinch(cdp,195,420,open?90:230,open?230:90);
      await page.waitForTimeout(220);
    }
    // A slow precise pinch: the camera must not overshoot or snap.
    await pinch(cdp,195,420,120,128,20);
    await page.waitForTimeout(400);
    const log=await read(page);
    const step=quality(log);
    expect(step.moving).toBeGreaterThan(60);
    // The camera followed the fingers instead of chasing them afterwards.
    expect(step.reversals).toBe(0);
    // And the gesture landed on what was asked for, with nothing left in flight.
    const settled=await page.locator('canvas.map').getAttribute('data-zoom');
    await page.waitForTimeout(400);
    expect(Math.abs(Number(await page.locator('canvas.map').getAttribute('data-zoom'))-Number(settled))).toBeLessThan(1e-6);
    expect(Number(settled)).toBeCloseTo(Number(settled),6);

    // Selection is untouched by any of it, and the world never moves.
    await expect(canvas).toHaveAttribute('data-focus','');
    const after=(await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort();
    expect(after).toEqual(before);
    await page.screenshot({path:`artifacts/mobile-pinch-${count}.png`});
  });
}

test('the point between the fingers stays under the fingers',async({page,context})=>{
  test.setTimeout(180000);
  await ready(page,100);
  const view=async()=>page.evaluate(()=>{const c=document.querySelector('canvas.map')!;const r=c.getBoundingClientRect();return{x:Number(c.getAttribute('data-camera-x')),y:Number(c.getAttribute('data-camera-y')),zoom:Number(c.getAttribute('data-zoom')),w:r.width,h:r.height,left:r.left,top:r.top};});
  // Pinch around a point that is deliberately not the centre of the screen.
  const centre={x:120,y:560};
  const start=await view();
  const world={x:(centre.x-start.left-start.w/2-start.x)/start.zoom,y:(centre.y-start.top-start.h/2-start.y)/start.zoom};
  const cdp=await context.newCDPSession(page);
  await pinch(cdp,centre.x,centre.y,100,260,20);
  await page.waitForTimeout(500);
  const end=await view();
  const onScreen={x:end.left+end.w/2+end.x+world.x*end.zoom,y:end.top+end.h/2+end.y+world.y*end.zoom};
  // The world point that was under the fingers is still under them.
  expect(Math.hypot(onScreen.x-centre.x,onScreen.y-centre.y)).toBeLessThan(2);
  expect(end.zoom).toBeGreaterThan(start.zoom*1.5);
});

test('zoom stays smooth across the level of detail boundary and on the way back',async({page,context})=>{
  test.setTimeout(180000);
  await ready(page,500);
  const canvas=page.locator('canvas.map');
  // Reach the level where the map is grouped, so the boundary is actually crossed.
  for(let i=0;i<8&&Number(await canvas.getAttribute('data-nodes'))>=200;i++){await canvas.press('-');await page.waitForTimeout(240);}
  expect(Number(await canvas.getAttribute('data-nodes'))).toBeLessThan(200);
  const cdp=await context.newCDPSession(page);
  await record(page);
  // Cross the boundary in both directions many times over.
  for(let round=0;round<6;round++){
   const open=round%2===0;
   await pinch(cdp,195,420,open?80:250,open?250:80,18);
   await page.waitForTimeout(150);
  }
  const step=quality(await read(page));
  expect(step.reversals).toBe(0);
  expect(step.moving).toBeGreaterThan(40);
  // The grouping may change, but nothing about the stored world does.
  expect((await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort()).toEqual((await readMap(page)).atoms.map(a=>[a.id,a.x,a.y]).sort());
});

test('input stays responsive while the background refines the layout',async({page,context})=>{
  test.setTimeout(240000);
  await ready(page,1000);
  const cdp=await context.newCDPSession(page);
  await record(page);
  for(let round=0;round<4;round++){
   const open=round%2===0;
   await pinch(cdp,195,420,open?90:240,open?240:90,16);
   await page.waitForTimeout(120);
  }
  const step=quality(await read(page));
  expect(step.reversals).toBe(0);
  expect(step.moving).toBeGreaterThan(40);
  await expect(page.locator('canvas.map')).toHaveAttribute('data-transition','idle');
  await page.screenshot({path:'artifacts/mobile-pinch-1000-refine.png'});
});
