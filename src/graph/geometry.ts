import type {Atom,Snapshot} from '../core/model';
import {footprint} from './footprint';
export function nodeWeight(a:Atom,degree:number){return a.appearance.size_override||Math.min(58,23+a.importance*8+Math.log2(1+degree)*3);}
export function graphFootprints(data:Snapshot){const degree=new Map<string,number>();for(const l of data.links){degree.set(l.from,(degree.get(l.from)||0)+1);degree.set(l.to,(degree.get(l.to)||0)+1);}return new Map(data.atoms.map(a=>{const shape=a.appearance.shape||(a.type==='task'?'square':'circle'),radius=Math.max(18,Math.min(64,nodeWeight(a,degree.get(a.id)||0)))*(shape==='diamond'?1.2:shape==='square'?Math.SQRT2:1);return[a.id,footprint(a.title,radius,Boolean(a.content))];}));}
