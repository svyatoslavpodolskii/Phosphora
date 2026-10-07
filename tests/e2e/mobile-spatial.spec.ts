import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {stressFixture} from '../stress-fixture';
import {arrangeDynamics} from '../../src/plugins/dynamics/layouts';
import {PRESETS} from '../../src/graph/physics';
import {importMap,readMap} from './helpers';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
for(const count of [100,500,1000])test(`mobile ${count}: focal pinch, semantic continuity, attention, backdrop and Back`,async({page,context})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const data=stressFixture(count),layout=arrangeDynamics('branch',{data,settings:PRESETS.calm,intent:'reflow'}),positions=new Map(layout.positions.map(p=>[p.id,p]));
 for(const a of data.atoms){Object.assign(a,positions.get(a.id));a.pinned=a.id==='stress-0';a.spatial.resistance=8;}
 await page.goto('/');await importMap(page,data);await expect(page.locator('canvas.map')).toHaveAttribute('data-layout','idle',{timeout:20000});
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const camera=()=>page.locator('canvas.map').evaluate(el=>({x:Number(el.getAttribute('data-camera-x')),y:Number(el.getAttribute('data-camera-y')),zoom:Number(el.getAttribute('data-zoom'))}));
 const touch=async(type:'touchStart'|'touchMove'|'touchEnd',points:{x:number;y:number}[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({id:i+1,radiusX:2,radiusY:2,force:1,...p}))});
 // Reach the semantic band without changing the world, then exercise real touch input.
 await page.locator('canvas.map').evaluate(el=>el.dispatchEvent(new WheelEvent('wheel',{deltaY:Math.log(1/.45)/.01,ctrlKey:true,clientX:190,clientY:360,cancelable:true,bubbles:true})));await page.waitForTimeout(700);
 await page.evaluate(()=>{(window as any).frameTimes=[];(window as any).renderTimes=[];let previous=performance.now();(window as any).sampling=true;function sample(now:number){if(!(window as any).sampling)return;(window as any).frameTimes.push(now-previous);(window as any).renderTimes.push(Number(document.querySelector('canvas.map')?.getAttribute('data-render-ms')||0));previous=now;requestAnimationFrame(sample);}requestAnimationFrame(sample);});
 const drifts:number[]=[];const selected=await page.locator('canvas.map').getAttribute('data-focus');
 for(let round=0;round<3;round++){
  const start=await camera(),world={x:(190-195-start.x)/start.zoom,y:(360-422-start.y)/start.zoom};await touch('touchStart',[{x:140,y:360},{x:240,y:360}]);
  for(let i=1;i<=16;i++){const distance=100+(i<=8?i:16-i)*9,cx=190+i,cy=360+i*.4;await touch('touchMove',[{x:cx-distance/2,y:cy},{x:cx+distance/2,y:cy}]);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const c=await camera();drifts.push(Math.hypot(195+c.x+world.x*c.zoom-cx,422+c.y+world.y*c.zoom-cy));expect(Number(await page.locator('canvas.map').getAttribute('data-nodes'))).toBeGreaterThan(0);}
  await touch('touchEnd',[]);
 }
 const frames=await page.evaluate(()=>{(window as any).sampling=false;return (window as any).frameTimes as number[];});frames.sort((a,b)=>a-b);const renderTimes=await page.evaluate(()=>((window as any).renderTimes as number[]).sort((a,b)=>a-b));const report={renderP95:renderTimes[Math.floor(renderTimes.length*.95)],...{count,cpuThrottle:4,dpr:3,frames:frames.length,p95:frames[Math.floor(frames.length*.95)],maxFocalDrift:Math.max(...drifts)}};writeFileSync(`artifacts/mobile-spatial-${count}.json`,JSON.stringify(report,null,2));expect(report.maxFocalDrift).toBeLessThan(2);expect(report.p95).toBeLessThan(100);expect(await page.locator('canvas.map').getAttribute('data-focus')).toBe(selected);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await page.getByRole('button',{name:'Открыть поиск',exact:true}).click();await page.getByRole('textbox',{name:'Поиск',exact:true}).fill(data.atoms[0].title);await page.locator('.search-results button').first().click();await page.waitForTimeout(700);
 const before=await camera(),root=data.atoms[0],point={x:195+before.x+root.x*before.zoom,y:422+before.y+root.y*before.zoom};await page.touchscreen.tap(point.x,point.y);await expect(page.getByRole('dialog',{name:'Редактор атома'})).toBeVisible();
 await page.touchscreen.tap(8,30);await expect(page.getByRole('dialog')).toBeHidden();expect(await camera()).toEqual(before);expect(await page.locator('canvas.map').getAttribute('data-focus')).toBe('stress-0');
 await page.touchscreen.tap(point.x,point.y);await expect(page.getByRole('dialog',{name:'Редактор атома'})).toBeVisible();await page.goBack();await expect(page.getByRole('dialog')).toBeHidden();expect(await camera()).toEqual(before);
 await touch('touchStart',[point]);await touch('touchMove',[{x:point.x+25,y:point.y+30}]);await touch('touchEnd',[]);await page.waitForTimeout(300);const moved=(await readMap(page)).atoms.find(a=>a.id===root.id)!;expect(moved.pinned).toBe(true);expect(moved.x).toBeCloseTo(root.x+25/before.zoom,0);await page.screenshot({path:`artifacts/mobile-spatial-${count}.png`});expect(errors).toEqual([]);
});
