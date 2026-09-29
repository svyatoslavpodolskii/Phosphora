import {it,expect} from 'vitest';
import {makeAtom,makeLink} from '../src/core/model';
import {reduceLinks,graphModel} from '../src/graph/model';
import {fixture} from './fixture';
it('distant bridged hubs remain separate local clusters despite large leaves',()=>{
 const model=graphModel(fixture(),'all',.3,'');
 expect(model.nodes.filter(n=>n.members)).toHaveLength(8);
 expect(model.nodes.find(n=>n.id==='cluster:hub-0')?.label).toBe('Музыка');
 for(const n of model.nodes.filter(n=>n.members))expect(n.members!.filter(id=>id.startsWith('hub-'))).toHaveLength(1);
});
it('reduces cycles but reveals focused and semantic edges',()=>{const atoms=['A','B','C','D'].map(title=>makeAtom({title}));const links=atoms.flatMap((a,i)=>atoms.slice(i+1).map(b=>makeLink(a.id,b.id)));expect(reduceLinks(atoms,links)).toHaveLength(3);const selected=atoms[3].id;expect(reduceLinks(atoms,links,selected).filter(l=>l.from===selected||l.to===selected)).toHaveLength(3);links[5].relation='used in';expect(reduceLinks(atoms,links)).toContain(links[5]);});
it('clusters are a projection and do not modify the stored graph',()=>{const atoms=Array.from({length:30},(_,i)=>makeAtom({title:String(i),x:Math.cos(i)*100,y:Math.sin(i)*100}));const links=atoms.slice(1).map(a=>makeLink(atoms[0].id,a.id));const data={atoms,links};const before=JSON.stringify(data);const model=graphModel(data,'all',.3,'');expect(model.nodes).toHaveLength(1);expect(model.nodes[0].members).toHaveLength(30);expect(JSON.stringify(data)).toBe(before);});
