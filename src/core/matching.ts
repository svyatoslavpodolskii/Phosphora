import {wordStem} from './search';
import type {Atom} from './model';
export function normalize(text:string){return text.normalize('NFKC').toLocaleLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');}
export function similarity(a:string,b:string){if(a===b)return 1;if(!a.length||!b.length)return 0;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return 1-row[b.length]/Math.max(a.length,b.length);}
export interface Candidate {atom:Atom;confidence:number;reason:'title'|'alias'|'form'|'fuzzy';matched:string}
export interface Rejection {text:string;targets:string[]}
export function sameTextContext(a:string,b:string){const x=new Set(normalize(a).split(' ').filter(Boolean)),y=new Set(normalize(b).split(' ').filter(Boolean));if(!x.size&&!y.size)return true;const common=[...x].filter(w=>y.has(w)).length;return common/Math.max(x.size,y.size)>=.75;}
export function candidates(text:string,atoms:Atom[],exclude=new Set<string>(),rejection?:Rejection,includeFuzzy=true):Candidate[]{
 const n=normalize(text),words=n.split(' ').slice(0,5000);if(!n)return[];const padded=' '+n+' ';const suppressed=rejection&&sameTextContext(n,rejection.text)?new Set(rejection.targets):new Set<string>();const found:Candidate[]=[];
 for(const atom of atoms){if(exclude.has(atom.id)||suppressed.has(atom.id))continue;let best:Candidate|undefined;
 for(const [i,name] of [atom.title,...atom.aliases].entries()){const key=normalize(name);if(key.length<3||key.length>160)continue;let confidence=0,reason:Candidate['reason']='fuzzy';if(padded.includes(' '+key+' ')){confidence=1;reason=i?'alias':'title';}else if(includeFuzzy){const count=key.split(' ').length;for(let j=0;j+count<=words.length;j++){const part=words.slice(j,j+count).join(' ');if(Math.abs(part.length-key.length)>Math.max(2,key.length*.25))continue;const inflected=count===1&&/^[а-я]+$/.test(key)&&wordStem(key)===wordStem(part);const score=inflected?.94:similarity(key,part);if(score>confidence){confidence=score;reason=inflected?'form':'fuzzy';}}}
 if(confidence>=.8&&(!best||confidence>best.confidence))best={atom,confidence,reason,matched:key};if(confidence===1)break;
 }if(best)found.push(best);
 }return found.sort((a,b)=>b.confidence-a.confidence||a.atom.title.localeCompare(b.atom.title)).slice(0,12);
}
