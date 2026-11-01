import {it,expect} from 'vitest';
import {GraphProviders} from '../src/graph/providers';
import {PRESETS} from '../src/graph/physics';
it('resolves paired physics, preserves standalone community overrides and restores pairs on removal',()=>{
 const p=new GraphProviders(),step=(input:any)=>({nodes:input.nodes,energy:0});
 for(const id of ['a','b']){
  p.physics.set(id,{id,name:id,step});
  p.structure.set(id,{id,name:id,description:id,physicsId:id,defaults:PRESETS.calm,arrange:({data})=>({positions:data.atoms,skeleton:[]})});
 }
 expect(p.motion('a')).toBe(p.physics.get('a'));expect(p.motion('b')).toBe(p.physics.get('b'));
 p.physics.set('community',{id:'community',name:'Community',step});expect(p.motion('a')).toBe(p.physics.get('community'));
 p.physics.delete('community');expect(p.motion('a')).toBe(p.physics.get('a'));
 const empty=new GraphProviders();expect(empty.motion()).toBe(empty.motion());
});
