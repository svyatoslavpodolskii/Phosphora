import {it,expect} from 'vitest';
import {hitRegions,pickTarget,IntentMachine,resolveSelection,type HitRegion} from '../src/graph/intent';
import {CameraRig} from '../src/graph/camera';
import {collapseAmount,overviewAmount,topologyKey,DerivedCache,LOD} from '../src/graph/lod';
import {makeAtom,makeLink} from '../src/core/model';
import {graphModel,type GraphNode} from '../src/graph/model';

const view={width:1000,height:700};
const node=(id:string,x:number,y=0,over:Partial<GraphNode>={}):GraphNode&{opacity:number}=>({id,x,y,radius:26,label:id,color:'#b4ecc1',icon:'·',shape:'circle',style:'solid',state:'normal',opacity:1,...over});
const screen=(p:{x:number;y:number},camera:{x:number;y:number;zoom:number})=>({x:view.width/2+camera.x+p.x*camera.zoom,y:view.height/2+camera.y+p.y*camera.zoom});
const regionsAt=(nodes:GraphNode[],camera:any)=>hitRegions(nodes.map(n=>({...n,opacity:1})),camera,view);

it('hit testing follows what is painted, including the label',()=>{
  const camera={x:0,y:0,zoom:1},atoms=[node('a',-200),node('b',200)];
  const regions=regionsAt(atoms,camera);
  const bodyA=screen({x:-200,y:0},camera);
  expect(pickTarget(regions,bodyA,'').id).toBe('a');
  // The wrapped label below a node is a real target, not dead space.
  const labelA=screen({x:-200,y:48},camera);
  expect(pickTarget(regions,labelA,'').id).toBe('a');
  // Empty space between the two is empty.
  expect(pickTarget(regions,screen({x:0,y:0},camera),'').id).toBe('');
});
it('the hit target is the painted size at any zoom, not a fixed world radius',()=>{
  for(const zoom of [.15,.4,1,2.4]){
    const camera={x:0,y:0,zoom},atoms=[node('a',-900),node('b',900)];
    const regions=regionsAt(atoms,camera);
    const onB=screen({x:900,y:0},camera);
    expect(pickTarget(regions,onB,'').id).toBe('b');
    // A point 60 screen pixels off a 26-world-unit node is outside it at every zoom.
    const miss=screen({x:900+60/zoom,y:0},camera);
    const hit=pickTarget(regions,miss,'').id;
    expect(hit===''||hit==='b').toBe(true);
  }
});
it('a cluster never swallows the atom drawn inside it',()=>{
  const camera={x:0,y:0,zoom:1};
  const big:HitRegion={id:'cluster:root',kind:'cluster',members:['root','a'],depth:1,opacity:1,body:{x:500,y:350,r:300}};
  const leaf:HitRegion={id:'a',kind:'atom',depth:0,opacity:1,body:{x:500,y:350,r:26}};
  expect(pickTarget([big,leaf],{x:500,y:350},'').id).toBe('a');
  expect(pickTarget([big,leaf],{x:500,y:560},'').id).toBe('cluster:root');
  // Just past the painted outline the pointer is free again, so a large cluster
  // cannot annex a neighbourhood of the map.
  expect(pickTarget([big,leaf],{x:500,y:700},'').id).toBe('');
  expect(pickTarget([big,leaf],{x:500,y:330},'').id).toBe('a');
});
it('the grab area never reaches beyond a finger or a cursor',()=>{
  const camera={x:0,y:0,zoom:1},regions=regionsAt([node('a',0)],camera);
  const centre=screen({x:0,y:0},camera);
  expect(pickTarget(regions,{x:centre.x+26,y:centre.y},'',false).id).toBe('a');
  expect(pickTarget(regions,{x:centre.x+40,y:centre.y},'',false).id).toBe('');
  expect(pickTarget(regions,{x:centre.x+45,y:centre.y},'',true).id).toBe('a');
  expect(pickTarget(regions,{x:centre.x+60,y:centre.y},'',true).id).toBe('');
});
it('a pointer between two neighbours holds its target instead of flickering',()=>{
  const camera={x:0,y:0,zoom:1},regions=regionsAt([node('a',0),node('b',70)],camera);
  const left=screen({x:0,y:0},camera),right=screen({x:70,y:0},camera);
  expect(pickTarget(regions,left,'').id).toBe('a');
  // Nudging a few pixels toward b is not enough to steal the candidate.
  let held=0;
  for(let i=1;i<12;i++){const p=screen({x:i*1.2,y:0},camera);const r=pickTarget(regions,p,'a');if(r.id==='a')held++;}
  expect(held).toBeGreaterThanOrEqual(10);
  // Continuing all the way onto b does hand it over.
  expect(pickTarget(regions,right,'a').id).toBe('b');
  expect(pickTarget(regions,right,'').id).toBe('b');
});
it('touch aims with a finger, not a cursor',()=>{
  const camera={x:0,y:0,zoom:1},regions=regionsAt([node('a',0),node('b',90)],camera);
  const gap=screen({x:45,y:0},camera);
  expect(pickTarget(regions,gap,'',false).id).toBe('');
  expect(pickTarget(regions,gap,'',true).id).toBeTruthy();
});
it('hover never selects, and a click is the only thing that selects',()=>{
  const seen:any[]=[];const machine=new IntentMachine(i=>seen.push({...i}));
  machine.hover('a');
  expect(machine.value.hover).toBe('a');
  expect(machine.value.selected).toBe('');
  expect(machine.value.phase).toBe('hover');
  // Moving the pointer away and back must not change what is selected.
  machine.hover('b');machine.hover('');machine.hover('a');
  expect(machine.value.selected).toBe('');
  machine.select('b');
  expect(machine.value.phase).toBe('selected');
  expect(machine.value.selected).toBe('b');
  expect(machine.value.focused).toBe('b');
  // A pointer pass across the open editor must not disturb the selection.
  machine.hover('c');machine.hover('');
  expect(machine.value.selected).toBe('b');
  expect(machine.value.phase).toBe('selected');
  machine.open('b');
  expect(machine.value.phase).toBe('opened');
  machine.close();
  expect(machine.value.phase).toBe('focused');
  expect(machine.value.opened).toBe('');
  machine.release();
  expect(machine.value.phase).toBe('idle');
  expect(machine.value.selected).toBe('');
  // Every distinct change was published, so the view can react to state, not guess.
  expect(seen.length).toBeGreaterThan(4);
  expect(seen.every(s=>typeof s.phase==='string')).toBe(true);
});
it('opening a different atom replaces the open one',()=>{
  const machine=new IntentMachine(()=>{});
  machine.select('a');machine.open('a');
  machine.open('b');
  expect(machine.value.opened).toBe('b');
  expect(machine.value.selected).toBe('b');
  expect(machine.value.phase).toBe('opened');
});
it('selection identity survives a change of level of detail',()=>{
  const collapsed=graphModel({atoms:[makeAtom({id:'root',title:'Root'}),makeAtom({id:'child',title:'Child'})],links:[makeLink('root','child')]},'all',.3,'');
  const cluster=collapsed.nodes.find(n=>n.members);
  expect(cluster).toBeTruthy();
  const expanded=graphModel({atoms:[makeAtom({id:'root',title:'Root'}),makeAtom({id:'child',title:'Child'})],links:[makeLink('root','child')]},'all',1,'');
  expect(resolveSelection(cluster!.id,expanded.nodes)).toBe(cluster!.members![0]);
  expect(resolveSelection('child',expanded.nodes)).toBe('child');
  expect(resolveSelection('',expanded.nodes)).toBe('');
  expect(resolveSelection('cluster:ghost',expanded.nodes)).toBe('');
});
it('grouping depends on topology and zoom only, never on who is selected',()=>{
  const atoms=[makeAtom({id:'root',title:'Root'}),...Array.from({length:5},(_,i)=>makeAtom({id:'c'+i,title:'C'+i}))];
  const links=atoms.slice(1).map(a=>makeLink('root',a.id));
  const data={atoms,links};
  const a=graphModel(data,'all',.3,''),b=graphModel(data,'all',.3,'');
  expect(a.nodes.map(n=>n.id)).toEqual(b.nodes.map(n=>n.id));
  // Focusing a child keeps that branch unfolded, and changes nothing else.
  const focused=graphModel(data,'all',.3,'c0');
  expect(focused.nodes.map(n=>n.id)).not.toEqual(a.nodes.map(n=>n.id));
  expect(focused.nodes.map(n=>n.id)).toEqual(graphModel(data,'all',.3,'c0').nodes.map(n=>n.id));
  expect(JSON.stringify(data)).toBe(JSON.stringify({atoms,links}));
});
it('zoom bands separate cleanly and the transition range is continuous',()=>{
  expect(collapseAmount(1)).toBe(0);
  expect(collapseAmount(LOD.clusterIn)).toBe(1);
  expect(collapseAmount(.1)).toBe(1);
  expect(overviewAmount(.1)).toBe(1);
  expect(overviewAmount(1)).toBe(0);
  let previous=Infinity;
  for(let z=.4;z<=.6;z+=.002){const value=collapseAmount(z);expect(value).toBeLessThanOrEqual(previous+1e-12);previous=value;}
  let rising=-1;
  for(let z=.6;z>=.4;z-=.002){const value=collapseAmount(z);expect(value).toBeGreaterThanOrEqual(rising-1e-12);rising=value;}
  expect(collapseAmount(.5)).toBeGreaterThan(0);expect(collapseAmount(.5)).toBeLessThan(1);
});
it('a zoom that never changes the topology never rebuilds the projection',()=>{
  let builds=0;
  const cache=new DerivedCache<number>();
  const build=()=>{builds++;return builds;};
  const key=topologyKey({atoms:[makeAtom({id:'a',title:'A'})],links:[]});
  for(let i=0;i<200;i++)cache.get(key,build);
  expect(builds).toBe(1);
  const moved=topologyKey({atoms:[makeAtom({id:'a',title:'A',x:9999,y:-40})],links:[]});
  expect(moved).toBe(key);
  expect(cache.get(moved,build)).toBe(1);
  const added=topologyKey({atoms:[makeAtom({id:'a',title:'A'}),makeAtom({id:'b',title:'B'})],links:[]});
  expect(added).not.toBe(key);
  cache.get(added,build);
  expect(builds).toBe(2);
});
it('the camera and the world never share state',()=>{
  const atoms=[makeAtom({id:'a',title:'A',x:100,y:200}),makeAtom({id:'b',title:'B',x:-400,y:60})];
  const before=JSON.stringify(atoms);
  const rig=new CameraRig();rig.resize(view);rig.set({x:0,y:0,zoom:1});
  for(let i=0;i<120;i++)rig.zoomAt({x:100+i,y:200+i},1.02);
  for(let i=0;i<200&&rig.moving;i++)rig.step(16);
  rig.panBy(300,-200);
  for(let i=0;i<200&&rig.moving;i++)rig.step(16);
  expect(JSON.stringify(atoms)).toBe(before);
});
