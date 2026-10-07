type Options={close:()=>unknown;blocked?:()=>boolean};
type Entry={node:HTMLElement;options:Options;focus:HTMLElement|null};
const stack:Entry[]=[];let consuming=false,pendingBack=false,installed=false;
const marker='phosphoraSurface';
const top=()=>stack.at(-1);
function dismiss(){const entry=top();if(entry&&!entry.options.blocked?.())entry.options.close();}
function pointer(e:PointerEvent){consuming=false;const entry=top();if(!entry)return;const panel=entry.node.matches('.scrim,.context-scrim')?entry.node.firstElementChild:entry.node;
 if(panel?.contains(e.target as Node))return;consuming=true;e.preventDefault();e.stopImmediatePropagation();dismiss();}
function swallow(e:Event){if(consuming){e.preventDefault();e.stopImmediatePropagation();}}
function key(e:KeyboardEvent){if(e.key==='Escape'&&top()){e.preventDefault();e.stopImmediatePropagation();dismiss();}}
function back(e:PopStateEvent){if(pendingBack){pendingBack=false;e.stopImmediatePropagation();return;}if(!top())return;e.stopImmediatePropagation();dismiss();queueMicrotask(()=>{if(top())history.pushState({...history.state,[marker]:true},'');});}
function install(){if(installed)return;installed=true;window.addEventListener('pointerdown',pointer,true);window.addEventListener('pointerup',swallow,true);window.addEventListener('click',swallow,true);window.addEventListener('keydown',key,true);window.addEventListener('popstate',back,true);}
/** Shared transient-layer stack: outside input is consumed before it reaches the map. */
export function surface(node:HTMLElement,options:Options){
 install();const entry={node,options,focus:document.activeElement as HTMLElement|null};
 if(!stack.length&&!history.state?.[marker])history.pushState({...history.state,[marker]:true},'');stack.push(entry);node.style.zIndex=String(100+stack.length*2);
 return {update(value:Options){entry.options=value;},destroy(){const index=stack.indexOf(entry);if(index>=0)stack.splice(index,1);queueMicrotask(()=>{if(!stack.length&&history.state?.[marker]){pendingBack=true;history.back();}if(entry.focus?.isConnected&&!top())entry.focus.focus({preventScroll:true});});}};
}

/** App history must not restore a map location while a surface owns the entry. */
export function surfaceOwnsHistory(){return pendingBack||stack.length>0;}
