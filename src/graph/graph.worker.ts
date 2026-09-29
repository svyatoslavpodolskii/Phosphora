import {nodeWeight} from './geometry';
import {arrangeDynamics} from '../plugins/dynamics/layouts';
import {dynamicsStep} from '../plugins/dynamics/motion';
import {graphModel,reduceLinks} from './model';
import {physicsStep} from './physics';
import {candidates} from '../core/matching';
import {placeAtom} from './placement';
self.onmessage=({data:{id,method,input}})=>{try{let result:unknown;if(method==='structure')result=arrangeDynamics(input.kind,input.input);else if(method==='dynamics')result=dynamicsStep(input.kind,input.input);else if(method==='match')result=candidates(input.text,input.atoms,new Set(input.exclude),input.rejection);else if(method==='physics')result=physicsStep(input);else if(method==='layout')result=placeAtom(input);else if(method==='reduce')result=reduceLinks(input.data.atoms,input.data.links,input.selected);else if(method==='weight'){const degree=new Map<string,number>();for(const l of input.links){degree.set(l.from,(degree.get(l.from)||0)+1);degree.set(l.to,(degree.get(l.to)||0)+1);}result=Object.fromEntries(input.atoms.map((a:any)=>[a.id,nodeWeight(a,degree.get(a.id)||0)]));}else result=graphModel(input.data,input.lens,input.zoom,input.selected,true);self.postMessage({id,result});}catch(e){self.postMessage({id,error:String(e)});}};
