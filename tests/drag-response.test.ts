import {it,expect} from 'vitest';
import {makeAtom,makeLink,type Snapshot} from '../src/core/model';
import {dragWeights,DRAG_LIMIT} from '../src/graph/drag-response';

const atom=(id:string,x:number,y=0,pinned=false)=>makeAtom({id,title:id,x,y,pinned});
it('attenuates with graph hops and physical distance, excluding disconnected atoms',()=>{
 const data:Snapshot={atoms:[atom('hand',0),atom('near',100),atom('far',900),atom('next',200),atom('island',10)],links:[makeLink('hand','near'),makeLink('hand','far'),makeLink('near','next')]};
 const w=dragWeights(data,['hand']);
 expect(w.get('near')).toBeGreaterThan(w.get('far')!);
 expect(w.get('near')).toBeGreaterThan(w.get('next')!);
 expect(w.has('hand')).toBe(false);expect(w.has('island')).toBe(false);
 for(const weight of w.values()){expect(weight).toBeGreaterThan(0);expect(weight).toBeLessThan(1);}
 const bodies=new Map(data.atoms.map(a=>[a.id,{...a,mass:1}]));bodies.get('far')!.x=50;
 expect(dragWeights(data,['hand'],bodies).get('far')).toBeGreaterThan(w.get('far')!);
});

it('pins stop traversal, including pinned seeds, while an alternate unpinned path still transmits',()=>{
 const data={atoms:[atom('a',0),atom('pin',100,0,true),atom('behind',200),atom('bypass',100,100)],links:[makeLink('a','pin'),makeLink('pin','behind')]};
 expect(dragWeights(data,['a']).size).toBe(0);expect(dragWeights(data,['pin']).size).toBe(0);
 data.links.push(makeLink('a','bypass'),makeLink('bypass','behind'));
 const w=dragWeights(data,['a','pin']);expect(w.has('pin')).toBe(false);expect(w.get('behind')).toBeGreaterThan(0);
});

it('a loaded branch and a structural hub resist more than a light leaf at equal distance',()=>{
 const atoms=[atom('hand',0),atom('leaf',100),atom('hub',0,100),...Array.from({length:20},(_,i)=>atom('load'+i,0,200+i*100))];
 const data={atoms,links:[makeLink('hand','leaf'),makeLink('hand','hub'),...atoms.slice(3).map(a=>makeLink('hub',a.id))]};
 const w=dragWeights(data,['hand']);expect(w.get('hub')).toBeLessThan(w.get('leaf')!);
 const chain={atoms:[atom('a',0),atom('b',100),atom('c',200)],links:[makeLink('a','b'),makeLink('b','c')]};
 const base=dragWeights(chain,['a']).get('b')!;
 chain.atoms[2].importance=2;
 expect(dragWeights(chain,['a']).get('b')).toBeLessThan(base);
});

it('cycles, duplicate links, seed order and snapshot order cannot amplify response',()=>{
 const data={atoms:[atom('a',0),atom('b',100),atom('c',200),atom('d',100,100)],links:[makeLink('a','b'),makeLink('b','c'),makeLink('c','d'),makeLink('d','a'),makeLink('b','d')]};
 const w=dragWeights(data,['a','c']);
 expect(dragWeights({atoms:[...data.atoms].reverse(),links:[...data.links].reverse()},['c','a','a'])).toEqual(w);
 expect(dragWeights({...data,links:[...data.links,makeLink('a','b'),makeLink('b','a')]},['a','c'])).toEqual(w);
});

it('caps a wide response at 256 and does not jump beyond six hops',()=>{
 const atoms=Array.from({length:1000},(_,i)=>atom('n'+String(i).padStart(4,'0'),i*10));
 const star={atoms,links:atoms.slice(1).map(a=>makeLink(atoms[0].id,a.id))};
 // Keep all direct neighbors physically close so the work cap, not falloff, wins.
 star.atoms.forEach((a,i)=>{a.x=i%10;a.y=Math.floor(i/10);});
 expect(dragWeights(star,[atoms[0].id]).size).toBe(DRAG_LIMIT);
 const chain={atoms:atoms.slice(0,10),links:atoms.slice(1,10).map((a,i)=>makeLink(atoms[i].id,a.id))};
 expect(dragWeights(chain,[atoms[0].id]).has(atoms[7].id)).toBe(false);
});
