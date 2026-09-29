import {it,expect} from 'vitest';
import {largeFixture} from './large-fixture';
import {branchingLayout} from '../src/graph/structure';
import {footprint} from '../src/graph/footprint';
import {physicsStep,PRESETS,type Body} from '../src/graph/physics';
it('four layout grammars remain distinct, bounded and readable with 120 notes',()=>{
 const data=largeFixture(),layouts:Map<string,{x:number;y:number}>[]=[];
 for(const [mode,settings] of Object.entries(PRESETS)){const layout=branchingLayout(data,mode,settings.distance);layouts.push(layout.points);let nodes:Body[]=data.atoms.map(a=>({id:a.id,...layout.points.get(a.id)!,radius:38,mass:1,pinned:false,resistance:0,vx:0,vy:0,...footprint(a.title,38)}));const links=data.links.map(l=>({...l,strength:layout.tree.edges.has(l.id)?1:.04,distance:Math.hypot(layout.points.get(l.from)!.x-layout.points.get(l.to)!.x,layout.points.get(l.from)!.y-layout.points.get(l.to)!.y)}));for(let i=0;i<180;i++)nodes=physicsStep({nodes,links,settings,mode,dt:1,reducedMotion:false}).nodes;let overlaps=0;for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];if(Math.abs(a.x-b.x)<a.halfWidth!+b.halfWidth!-8&&Math.min(a.y+a.bottom!,b.y+b.bottom!)-Math.max(a.y-a.top!,b.y-b.top!)>8)overlaps++;}expect(overlaps,mode).toBeLessThan(6);expect(Math.max(...nodes.map(n=>Math.hypot(n.x,n.y))),mode).toBeLessThan(7000);}
 for(let i=0;i<layouts.length;i++)for(let j=i+1;j<layouts.length;j++){const difference=data.atoms.reduce((sum,a)=>sum+Math.hypot(layouts[i].get(a.id)!.x-layouts[j].get(a.id)!.x,layouts[i].get(a.id)!.y-layouts[j].get(a.id)!.y),0)/data.atoms.length;expect(difference).toBeGreaterThan(100);}
});
