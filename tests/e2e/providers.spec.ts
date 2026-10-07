import {test,expect,type Page} from '@playwright/test';
import {zipSync,strToU8} from 'fflate';
import {openSettings,closeSettings,readMap} from './helpers';
async function install(page:Page,id:string,name:string,permissions:string[],source:string,extra:Record<string,Uint8Array>={}){
 await openSettings(page);await page.getByRole('button',{name:'Плагины →',exact:true}).click();await page.getByText('Установить плагин',{exact:true}).click();
 await page.getByLabel('Пакет плагина',{exact:true}).setInputFiles({name:id+'.phosphora',mimeType:'application/zip',buffer:Buffer.from(zipSync({'manifest.json':strToU8(JSON.stringify({id,name,version:'1.0.0',apiVersion:1,permissions})),'main.js':strToU8(source),...extra}))});
 await page.getByRole('button',{name:'Разрешить и установить',exact:true}).click();await expect(page.locator('.plugin-row').filter({hasText:name})).toBeVisible();await closeSettings(page);
}
async function command(page:Page,name:string){await page.getByRole('button',{name:'Меню карты',exact:true}).click();await page.getByRole('button',{name,exact:true}).click();}
test('community draft policy participates in atomic saves and is removed on disable',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();
 await install(page,'test.drafts','Draft policy acceptance',['atoms.read','atoms.write','links.read','links.write'],`export async function activate(app){await app.atoms.registerDraftPolicy({id:'properties',name:'Draft properties',prepare:async({atom})=>({properties:{draftPlugin:'preserved',draftTitle:atom.title}})});}`);
 async function create(title:string){await page.locator('canvas.map').press('n');await page.getByRole('textbox',{name:'Название',exact:true}).fill(title);await page.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.getByRole('dialog',{name:'Редактор атома'})).toBeHidden();}
 await create('With policy');let map=await readMap(page);expect(map.atoms[0].properties).toMatchObject({draftPlugin:'preserved',draftTitle:'With policy'});
 await page.reload();await expect(page.locator('canvas.map')).toBeVisible();await create('After reload');map=await readMap(page);expect(map.atoms.find(a=>a.title==='After reload')?.properties.draftPlugin).toBe('preserved');
 await openSettings(page);await page.getByRole('button',{name:'Плагины →',exact:true}).click();await page.locator('.plugin-row').filter({hasText:'Draft policy acceptance'}).getByRole('button',{name:'Выключить',exact:true}).click();await closeSettings(page);
 await create('Without policy');map=await readMap(page);expect(map.atoms.find(a=>a.title==='Without policy')?.properties.draftPlugin).toBeUndefined();expect(map.atoms.find(a=>a.title==='With policy')?.properties.draftPlugin).toBe('preserved');
});
test('all five public graph providers replace production, resources and lifecycle survive reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();
 await install(page,'test.providers','Provider acceptance',['graph','atoms.read','atoms.write','ui','settings'],`export const activate=async app=>{
 await app.graph.registerMapTool({id:'selection',name:'Selection',kind:'lasso'});
 const report=async key=>{if(!await app.settings.get(key))await app.settings.set(key,true);};
 await app.graph.registerPhysicsProvider({id:'motion',name:'Motion',step:input=>({nodes:input.nodes.map(n=>({...n,x:n.x+.4,vx:.4})),energy:1})});
 await app.graph.registerLayoutProvider({id:'place',name:'Place',place:()=>({x:-240,y:40})});
 await app.graph.registerLinkReductionProvider({id:'reduce',name:'Reduce',reduce:async({data})=>{await report('reduction');return data.links.slice(0,1);}});
 await app.graph.registerNodeWeightProvider({id:'weight',name:'Weight',weigh:async data=>{await report('weight');return Object.fromEntries(data.atoms.map(a=>[a.id,42]));}});
 await app.graph.registerClusteringProvider({id:'cluster',name:'Cluster',project:async({data})=>{await report('clustering');return {nodes:data.atoms.map(a=>({id:a.id,x:a.x,y:a.y,radius:20,label:a.title,color:'#b4ecc1',icon:'P',shape:'circle',style:'solid',state:a.state})),links:data.links,hidden:0};}});
 const bytes=await app.assets.read('assets/message.txt');const message=new TextDecoder().decode(new Uint8Array(Object.values(bytes)));
 await app.views.register({id:'resources',name:'Provider report',render:async()=>'<p class="probe">'+message+' '+['reduction','weight','clustering'].map(k=>k).join(' ')+'</p>'});
 await app.commands.add({id:'seed',name:'Seed providers',run:async()=>{await app.atoms.create({title:'Provider pin',pinned:true});await app.atoms.create({title:'Provider free',x:160,y:40});}});
 await app.commands.add({id:'report',name:'Verify providers',run:async()=>{const flags=await Promise.all(['reduction','weight','clustering'].map(k=>app.settings.get(k)));app.ui.notify(flags.every(Boolean)?'Providers executed':'Missing provider');}});
 await app.commands.add({id:'move',name:'API position',run:async()=>{const a=(await app.atoms.list()).find(a=>a.title==='Provider pin');await app.atoms.update(a.id,{x:-320,y:80});}});
};`,{'assets/message.txt':strToU8('Packaged resource'),'style.css':strToU8('.probe { color: rgb(123, 45, 67); } body { color:red; }')});
 await command(page,'Seed providers');await expect(page.locator('footer')).toContainText('2 атомов');await page.waitForTimeout(550);const first=await readMap(page);expect(first.atoms.find(a=>a.pinned)?.x).toBe(-240);expect(first.atoms.find(a=>!a.pinned)!.x).toBeGreaterThan(160);
 await command(page,'Verify providers');await expect(page.getByText('Providers executed',{exact:true})).toBeVisible();await command(page,'Provider report');await expect(page.locator('.probe')).toContainText('Packaged resource');await expect(page.locator('.probe')).toHaveCSS('color','rgb(123, 45, 67)');await page.getByRole('button',{name:'Закрыть',exact:true}).click();
 await command(page,'API position');expect((await readMap(page)).atoms.find(a=>a.pinned)?.x).toBe(-320);
 await page.reload();await expect(page.locator('footer')).toContainText('2 атомов');await command(page,'Provider report');await expect(page.locator('.probe')).toContainText('Packaged resource');await page.getByRole('button',{name:'Закрыть',exact:true}).click();
 await openSettings(page);await page.getByRole('button',{name:'Плагины →',exact:true}).click();let row=page.locator('.plugin-row').filter({hasText:'Provider acceptance'});await row.getByRole('button',{name:'Выключить',exact:true}).click();await closeSettings(page);await page.getByRole('button',{name:'Меню карты'}).click();await expect(page.getByRole('button',{name:'Seed providers'})).toBeHidden();await page.getByRole('button',{name:'Настройки и резервные копии'}).click();await page.getByRole('button',{name:'Плагины →',exact:true}).click();await row.getByRole('button',{name:'Включить',exact:true}).click();await expect(row.getByRole('button',{name:'Выключить',exact:true})).toBeVisible();await row.getByRole('button',{name:'Удалить плагин Provider acceptance'}).click();await expect(row).toBeHidden();await closeSettings(page);await page.reload();await expect(page.locator('footer')).toContainText('2 атомов');expect(errors).toEqual([]);
});
test('plugin writes without consent are denied and disabled callbacks disappear',async({page})=>{
 await page.goto('/');await install(page,'test.denied','Permission probe',['ui'],`export const activate=async app=>{await app.commands.add({id:'denied',name:'Denied write',run:async()=>{try{await app.atoms.create({title:'Forbidden'});app.ui.notify('Permission failed');}catch(e){app.ui.notify('Permission enforced');}}});};`);
 await command(page,'Denied write');await expect(page.getByText('Permission enforced',{exact:true})).toBeVisible();expect((await readMap(page)).atoms).toHaveLength(0);
});

test('sandbox pause modifier preserves state through independent changes',async({page})=>{
 await page.goto('/');await expect(page.locator('canvas.map')).toBeVisible();
 await install(page,'test.pause','Pause API',['atoms.read','atoms.write','ui'],`export async function activate(app){await app.commands.add({id:'pause-test',name:'Run pause API',async run(){const a=await app.atoms.create({title:'Pause API atom',state:'now'});await app.atoms.setPaused(a.id,true);await app.atoms.setState(a.id,'archived');}});}`);
 await command(page,'Run pause API');
 expect((await readMap(page)).atoms.find(a=>a.title==='Pause API atom')).toMatchObject({state:'archived',paused:true});
});
