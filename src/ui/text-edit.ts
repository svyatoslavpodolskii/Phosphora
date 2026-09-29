export type Format='bold'|'italic'|'heading'|'list'|'task'|'quote'|'code';
export function formatText(text:string,start:number,end:number,format:Format){
 const selected=text.slice(start,end);const markers={bold:'**',italic:'*',code:'`'};
 if(format in markers){const marker=markers[format as keyof typeof markers];const body=selected||'текст';return{text:text.slice(0,start)+marker+body+marker+text.slice(end),start:start+marker.length,end:start+marker.length+body.length};}
 const lineStart=start===0?0:text.lastIndexOf('\n',start-1)+1;
 const prefix={heading:'## ',list:'- ',task:'- [ ] ',quote:'> '}[format as 'heading'|'list'|'task'|'quote'];
 const body=text.slice(lineStart,end);const inserted=body.split('\n').map(line=>prefix+line).join('\n');
 return{text:text.slice(0,lineStart)+inserted+text.slice(end),start:start+prefix.length,end:end+inserted.length-body.length};
}
