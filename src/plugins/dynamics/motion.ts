import {physicsStep,type PhysicsInput} from '../../graph/physics';
import type {DynamicsKind} from './layouts';
import {cohesiveInput} from './cohesion';
export function dynamicsStep(kind:DynamicsKind,input:PhysicsInput){
 if(kind==='branch')return physicsStep({...input,mode:'calm',bondBehavior:'tension'});
 const output=kind==='molecule'?physicsStep({...cohesiveInput(input,false),mode:'elastic',bondBehavior:'elastic',links:input.links.map(l=>({...l,strength:Math.max(.5,l.strength||0)}))}):physicsStep({...cohesiveInput(input,true),mode:'free',bondBehavior:'local'});
 const original=new Map(input.nodes.map(n=>[n.id,n.target]));
 return {...output,nodes:output.nodes.map(n=>({...n,target:original.get(n.id)}))};
}
