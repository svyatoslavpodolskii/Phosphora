<script lang="ts">
 import {visualAttention} from './attention';
 import {fromAnchor,clampZoom,type Anchor} from './camera';
 import {CameraRig,wheelZoomFactor,gestureZoomFactor,screenToWorld,type Point} from './camera';
 import {revealCamera} from './navigation';
 import {hitRegions,pickTarget,resolveSelection} from './intent';
 import {collapseAmount} from './lod';
 import ContentPreview from "../ui/ContentPreview.svelte";
 import {contentPreviews,type Preview} from "./previews";
 let previews=$state<Preview[]>([]);const previewHeights=new Map<string,number>();function previewHeight(id:string,height:number){if(previewHeights.get(id)!==height){if(previewHeights.size>200)previewHeights.clear();previewHeights.set(id,height);schedule();}}
 import {SemanticScene,type PaintedNode} from './semantic';
 import {labelGeometry,measureText} from './footprint';
 import {onMount} from 'svelte';
 import {readable,mix} from '../core/themes';
 import type {Snapshot,AtomState} from '../core/model';
 import {MIN_ZOOM,MAX_ZOOM,type Camera,type GraphNode,type GraphModel} from './model';
 import {GraphController} from './controller';
 import type {GraphProviders} from './providers';
 import type {Preferences} from '../core/preferences';
 import type {PositionUpdate} from '../core/model';
 let {data,selected='',lens='all',camera=$bindable({x:0,y:0,zoom:1}),providers,prefs,providerVersion,paused=false,onselect,onopen,oncontext,onbranch,oncreate,onpositions,onstate,oncamera,onhover=()=>{},onviewport=()=>{},revealRequest=null,onerror}: {data:Snapshot;selected:string;lens:string;camera:Camera;providers:GraphProviders;prefs:Preferences;providerVersion:number;paused:boolean;onselect:(id:string)=>void;onopen:(id:string)=>void;oncontext:(id:string)=>void;onbranch:(ids:string[])=>void;oncreate:(x:number,y:number)=>void;onpositions:(positions:PositionUpdate[],manual:boolean)=>Promise<void>;onstate:(id:string,state:AtomState)=>void;oncamera:()=>void;onhover?:(id:string)=>void;onviewport?:(size:{width:number;height:number})=>void;revealRequest?:{id:string;nonce:number}|null;onerror:(e:Error)=>void}=$props();
 // A focus request arrives from outside, but the camera is still ours to animate.
 $effect(()=>{const request=revealRequest;if(!request)return;const atom=data.atoms.find(a=>a.id===request.id);if(atom)reveal({x:atom.x,y:atom.y},1);});
 let transitioning=$state(false);let canvas!:HTMLCanvasElement;let width=$state(1200),height=$state(700);let dragging=$state(false);let dragState=$state<AtomState>('normal');let model=$state.raw<GraphModel>({nodes:[],links:[],hidden:0});let controller=$state<GraphController|null>(null);let reduced=$state(false);let hover=$state('');
 $effect(()=>controller?.sync($state.snapshot(data),$state.snapshot(prefs),providerVersion));
 $effect(()=>controller?.view($state.snapshot(camera),width,height,lens,selected,paused,reduced));
 let visualFocus=$state('');let recent='';let recentAt=0;let focal:Point|undefined;let previewCamera=$state({x:0,y:0,zoom:1});
 $effect(()=>{model;selected;paused;schedule();});
 const rig=new CameraRig();
 // A camera assigned from outside (restore, editor return, reduced motion) replaces rig state outright.
 $effect(()=>{const external=$state.snapshot(camera);if(Math.abs(external.x-rig.value.x)>.01||Math.abs(external.y-rig.value.y)>.01||Math.abs(external.zoom-rig.value.zoom)>.0001)rig.set(external);});
  const inkCache=new Map<string,string>();function inkFor(color:string,background:string){const key=color+background;let ink=inkCache.get(key);if(!ink){ink=readable(color,[background,mix(background,color,.19)]);if(inkCache.size>256)inkCache.clear();inkCache.set(key,ink);}return ink;}
  // Reading computed style forces a style recalculation, which is one of the most
  // expensive things a frame can ask for on a phone. The theme only changes rarely.
  let paletteCache:{background:string;text:string;muted:string;accent:string;edge:string}|null=null;
  function readPalette(){if(paletteCache)return paletteCache;const style=getComputedStyle(canvas);return paletteCache={background:style.getPropertyValue('--theme-background').trim(),text:style.getPropertyValue('--theme-text').trim(),muted:style.getPropertyValue('--theme-muted').trim(),accent:style.getPropertyValue('--theme-accent').trim(),edge:style.getPropertyValue('--theme-edge').trim()};}
  const invalidatePalette=()=>{paletteCache=null;inkCache.clear();schedule();};
 const scene=new SemanticScene();const satelliteCache=new Map<string,{id:string;x:number;y:number;color:string}>();const displayed=new Map<string,PaintedNode>();
 let painted=$state.raw<PaintedNode[]>([]);let frame=0;let lastFrame=0;let candidate='';let cameraMoving=false;
 const DRAG_THRESHOLD=6;
 let pointers=new Map<number,Point>();let start:{x:number;y:number;worldX?:number;worldY?:number;node?:GraphNode;panX:number;panY:number}|null=null;let moving:GraphNode|null=null;let pinch=0;let pinchStart:{distance:number;zoom:number}|null=null;let fromPinch=false;let longTimer:ReturnType<typeof setTimeout>;let lastTap=0;let suppressReleaseClick=false;let panSample={x:0,y:0,time:0},panVelocity={x:0,y:0};
 function adopt(){rig.resize({width,height});}
 function schedule(){if(frame)return;frame=requestAnimationFrame(tick);}
 function tick(now=performance.now()){frame=0;if(!canvas)return;draw(now);}
 function draw(now:number){  const dt=Math.min(64,Math.max(1,now-lastFrame||16));lastFrame=now;
  const wasMoving=rig.moving;
  if(wasMoving){const next=rig.step(dt);camera={x:next.x,y:next.y,zoom:next.zoom};cameraMoving=true;}
  controller?.setInteracting(pointers.size>0||rig.moving);
  const visual=scene.advance(model,dt,reduced,moving?.id,collapseAmount(camera.zoom));
  const unsettled=visual.active;transitioning=unsettled;const attention=visualAttention(visual.nodes,camera,{width,height},selected,now-recentAt<3000?recent:'',focal);visualFocus=attention.focus;painted=visual.nodes.map(n=>({...n,attention:attention.scores.get(n.id)??.4}));displayed.clear();for(const n of painted)displayed.set(n.id,n);
  const ctx=canvas.getContext('2d')!;const palette=readPalette();const dpr=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(width/2+camera.x,height/2+camera.y);ctx.scale(camera.zoom,camera.zoom);
  const nodes=new Map(painted.map(n=>[n.id,n]));const visible=(n:GraphNode)=>{const x=width/2+camera.x+n.x*camera.zoom,y=height/2+camera.y+n.y*camera.zoom;return x>-200&&x<width+200&&y>-100&&y<height+100;};
  const branch=model.branch||[],inBranch=new Set(branch);
  for(const p of model.satellites||[])satelliteCache.set(p.id,p);const groups=visual.nodes.filter(n=>n.members&&n.opacity>.003),grouped=new Map(groups.flatMap(n=>n.members!.map(id=>[id,n] as const)));for(const id of satelliteCache.keys())if(!grouped.has(id))satelliteCache.delete(id);
  if(groups.length){ctx.save();const cloud=new Map([...(model.expanded?.nodes||model.nodes),...satelliteCache.values()].map(p=>[p.id,p]));ctx.strokeStyle=palette.edge;ctx.lineWidth=.65/camera.zoom;for(const l of model.expanded?.links||model.links){if(!grouped.has(l.from)&&!grouped.has(l.to))continue;const a=cloud.get(l.from),b=cloud.get(l.to),group=grouped.get(l.from)||grouped.get(l.to)!;if(!a||!b)continue;ctx.globalAlpha=.22*group.opacity*(group.attention??1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(const [id,group] of grouped){const p=satelliteCache.get(id);if(!p)continue;ctx.globalAlpha=.55*group.opacity*(group.attention??1);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,1.15/camera.zoom),0,Math.PI*2);ctx.fillStyle=p.color==='#b4ecc1'?palette.accent:inkFor(p.color,palette.background);ctx.fill();}ctx.restore();}
  // Skeleton links of the focused branch carry the structure on their own.
  for(const l of visual.links){const na=nodes.get(l.from),nb=nodes.get(l.to);const a=na?{...na,...l.start}:undefined,b=nb?{...nb,...l.end}:undefined;if(!a||!b||(!visible(a)&&!visible(b)))continue;const skeleton=inBranch.has(l.from)&&inBranch.has(l.to);ctx.beginPath();const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(14,d*.045);const ax=a.x+dx/d*a.radius,ay=a.y+dy/d*a.radius,bx=b.x-dx/d*b.radius,by=b.y-dy/d*b.radius;ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2-dy/d*bend,(ay+by)/2+dx/d*bend,bx,by);ctx.globalAlpha=l.opacity*Math.max(a.attention??1,b.attention??1)*(skeleton?1:.5);ctx.strokeStyle=skeleton?palette.accent:palette.edge;ctx.lineWidth=(skeleton?1.9:1.2)/camera.zoom;ctx.stroke();if(!skeleton&&camera.zoom>1.15&&l.relation!=='related'){ctx.fillStyle=palette.muted;ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(l.relation,(a.x+b.x)/2,(a.y+b.y)/2-8);}}
  ctx.globalAlpha=1;const labels:{x:number;y:number;width:number;height:number}[]=[];for(const original of painted.filter(visible).sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||Number(b.id===hover)-Number(a.id===hover)||Number(Boolean(b.members||b.landmark))-Number(Boolean(a.members||a.landmark))||(b.attention??1)-(a.attention??1)||b.radius-a.radius)){const n=moving?.id===original.id?moving:original;if(!visible(n))continue;ctx.save();ctx.translate(n.x,n.y);ctx.globalAlpha=(original.opacity??1)*(n.attention??1)*(n.state==='archived'?.35:n.state==='paused'?.6:1);
  // Hover is the only thing the pointer may add. It never implies selection.
  if(n.id===hover&&n.id!==selected){ctx.beginPath();ctx.arc(0,0,n.radius+5,0,Math.PI*2);ctx.strokeStyle=palette.text;ctx.lineWidth=1.2/camera.zoom;ctx.globalAlpha*=.45;ctx.stroke();ctx.globalAlpha/=.45;}
  if(n.state==='now'||n.id===selected){ctx.beginPath();ctx.arc(0,0,n.radius+8,0,Math.PI*2);ctx.strokeStyle=n.id===selected?palette.text:palette.accent;ctx.lineWidth=1.5/camera.zoom;ctx.setLineDash(n.state==='now'?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);}
  ctx.beginPath();if(n.shape==='square')ctx.roundRect(-n.radius,-n.radius,n.radius*2,n.radius*2,10);else if(n.shape==='diamond'){ctx.moveTo(0,-n.radius*1.2);ctx.lineTo(n.radius*1.2,0);ctx.lineTo(0,n.radius*1.2);ctx.lineTo(-n.radius*1.2,0);ctx.closePath();}else ctx.arc(0,0,n.radius,0,Math.PI*2);
  const color=n.color==='#b4ecc1'?palette.accent:n.color;const fill=ctx.createRadialGradient(-n.radius*.3,-n.radius*.4,0,0,0,n.radius*1.5);fill.addColorStop(0,color+'30');fill.addColorStop(1,color+'08');ctx.fillStyle=fill;ctx.fill();const ink=inkFor(color,palette.background);ctx.strokeStyle=ink;ctx.lineWidth=inBranch.has(n.id)&&n.id!==selected?2.1:1.35;ctx.setLineDash(n.style==='dashed'?[5,4]:[]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=ink;ctx.font=`${n.members?24:22}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.icon,0,0);
  ctx.globalAlpha=(original.opacity??1)*(n.attention??1);
  if(camera.zoom>.55||n.members||n.landmark||n.radius>36||n.id===selected){
   const text=labelGeometry(n.label,n.radius,camera.zoom,width,n.id===selected||camera.zoom>1.2?n.state:'normal');
   ctx.font=text.size+'px system-ui';ctx.textBaseline='top';
   const box={x:(n.x-text.halfWidth)*camera.zoom,y:(n.y+text.top)*camera.zoom,width:text.halfWidth*2*camera.zoom,height:(text.bottom-text.top)*camera.zoom};
   const showLabel=n.id===selected||!labels.some(r=>box.x<r.x+r.width+8&&box.x+box.width+8>r.x&&box.y<r.y+r.height+4&&box.y+box.height+4>r.y);
   if(showLabel){
    labels.push(box);
    for(const [i,title] of text.lines.entries()){
     ctx.fillStyle=palette.background;const w=measureText(title,13)*text.size/13,y=text.top+i*text.lineHeight;
     ctx.fillRect(-w/2-3,y,w+6,text.size+3);ctx.fillStyle=palette.text;ctx.fillText(title,0,y);
    }
    if(text.caption){ctx.font=text.captionSize+'px system-ui';ctx.fillStyle=palette.muted;ctx.fillText(text.caption,0,text.captionTop);}
   }
  }
  if(n.pinned&&prefs.pinning&&camera.zoom>.55){ctx.strokeStyle=palette.text;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(n.radius-4,-n.radius-3);ctx.lineTo(n.radius+4,-n.radius-3);ctx.moveTo(n.radius,-n.radius-6);ctx.lineTo(n.radius,-n.radius+6);ctx.stroke();}
  ctx.restore();}ctx.restore();if(!pointers.size&&!rig.moving){previews=contentPreviews(painted,camera,width,height,visualFocus,previewHeights,previews);previewCamera={...camera};}
  // The camera is recorded once it comes to rest, independently of any level of
  // detail crossfade happening at the same moment.
  if(cameraMoving&&!rig.moving&&!pointers.size){cameraMoving=false;oncamera();}
  if(rig.moving||unsettled)schedule();
 }
 function position(e:{clientX:number;clientY:number}){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 function world(p:Point){return screenToWorld(p,camera,{width,height});}
 function targetAt(p:Point,touch=false){return pickTarget(hitRegions(painted,camera,{width,height},selected),p,'',touch).id;}
 function nodeAt(p:Point,touch=false){const id=targetAt(p,touch);return id?(displayed.get(id)??model.nodes.find(n=>n.id===id)??null):null;}
 /** Pointer motion only proposes a candidate. It can never change what is selected. */
 function aim(p:Point,touch=false){const id=pickTarget(hitRegions(painted,camera,{width,height},selected),p,candidate,touch).id;if(id!==candidate){candidate=id;hover=id;onhover(id);}}
 /** Focus helps the camera only when the target is genuinely poorly placed. */
 function reveal(point:Point,desired:number){const next=revealCamera(camera,point,{width,height},desired);if(next)rig.retarget(next);}
 function down(e:PointerEvent){if(e.button!==0)return;rig.halt();e.preventDefault();canvas.focus();adopt();controller?.setInteracting(true);const p=position(e);panSample={...p,time:performance.now()};panVelocity={x:0,y:0};pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);
  if(pointers.size===2){clearTimeout(longTimer);start=null;moving=null;dragging=false;controller?.cancelDrag();fromPinch=true;const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);const screen={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pinchStart={distance:pinch,zoom:camera.zoom};focal=screen;rig.pinchTo(screen,camera.zoom);return;}
  if(pointers.size>2)return;
  const w=world(p),node=nodeAt(p,e.pointerType==='touch');candidate=node?.id||'';hover=candidate;recent=candidate;recentAt=performance.now();fromPinch=false;
  start={...p,worldX:w.x,worldY:w.y,node:node??undefined,panX:camera.x,panY:camera.y};
  longTimer=setTimeout(()=>{if(start?.node&&!dragging){suppressReleaseClick=true;candidate='';hover='';start.node.members?onbranch(start.node.members):oncontext(start.node.id);start=null;}},550);}
 function move(e:PointerEvent){if(!pointers.has(e.pointerId))return;adopt();const p=position(e),previous=new Map(pointers);pointers.set(e.pointerId,p);
  // Every path below can change the target camera, and the render loop is idle
  // whenever the camera is at rest, so each one has to ask for a frame.
  if(pointers.size>=2){const ids=[...pointers.keys()],a=pointers.get(ids[0])!,b=pointers.get(ids[1])!;
   const distance=Math.hypot(a.x-b.x,a.y-b.y),midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   // The gesture only ever states what the fingers ask for. The camera is still
   // reached through the rig, anchored to the point between them.
   if(pinchStart&&distance>0){focal=midpoint;rig.pinchTo(midpoint,pinchStart.zoom*distance/Math.max(1,pinchStart.distance));}
   pinch=distance;schedule();return;}
  if(!start){aim(p,e.pointerType==='touch');schedule();return;}
  if(Math.hypot(p.x-start.x,p.y-start.y)>DRAG_THRESHOLD){clearTimeout(longTimer);
   if(start.node){if(!dragging){controller?.beginDrag(start.node.id);dragState=start.node.state as AtomState;}dragging=true;candidate='';hover='';const w=world(p);moving={...start.node,x:start.node.x+w.x-(start.worldX??w.x),y:start.node.y+w.y-(start.worldY??w.y)};controller?.drag(moving.id,moving.x,moving.y);}
   else{const now=performance.now(),dt=Math.max(1,now-panSample.time);panVelocity={x:Math.max(-3,Math.min(3,(p.x-panSample.x)/dt)),y:Math.max(-3,Math.min(3,(p.y-panSample.y)/dt))};panSample={...p,time:now};rig.trackTo({x:start.panX+(p.x-start.x),y:start.panY+(p.y-start.y),zoom:camera.zoom});}}
  else aim(p,e.pointerType==='touch');
  schedule();}
 function up(e:PointerEvent){clearTimeout(longTimer);const wasPinching=pointers.size>=2;pointers.delete(e.pointerId);
  // A drag or a pinch ends: hand the camera back to the rig at its rest, then let
  // the spring carry whatever momentum is left over into a short settle.
  const gesture=rig.gesturing;
   if(gesture){pinchStart=null;pinch=0;rig.endPinch();
    // The surviving finger must keep panning, otherwise pinch strands the gesture.
    if(pointers.size===1){const [remaining]=[...pointers.values()];start={...remaining,panX:camera.x,panY:camera.y};panSample={...remaining,time:performance.now()};panVelocity={x:0,y:0};}
    else start=null;
    schedule();return;}
  if(start){const p=position(e),travel=Math.hypot(p.x-start.x,p.y-start.y);
   if(moving){const drop=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-state]')?.getAttribute('data-state') as AtomState|undefined;const id=moving.id;const members=moving.members;controller?.endDrag(Boolean(drop)).then(()=>{if(drop)for(const key of members||[id])onstate(key,drop);}).catch(onerror);schedule();}
   else if(travel<=DRAG_THRESHOLD&&!fromPinch){
    if(start.node?.members){const root=resolveSelection(start.node.id,painted)||start.node.members[0];onselect(root);reveal({x:start.node.x,y:start.node.y},1);}
    else if(start.node){onselect(start.node.id);onopen(start.node.id);}
    else{candidate='';hover='';onselect('');if(Date.now()-lastTap<300)oncreate(world(p).x,world(p).y);lastTap=Date.now();}}
    else if(!start.node&&!reduced&&performance.now()-panSample.time<90){rig.endPinch();rig.release(panVelocity);}}
  start=null;moving=null;dragging=false;candidate='';hover='';fromPinch=false;focal=undefined;controller?.setInteracting(false);schedule();}
 function cancel(){rig.halt();clearTimeout(longTimer);pointers.clear();controller?.setInteracting(false);start=null;moving=null;dragging=false;pinch=0;controller?.cancelDrag();schedule();}
 function leave(){candidate='';hover='';schedule();}
 onMount(()=>{window.addEventListener('phosphora-theme-change',invalidatePalette);const resetClick=()=>{suppressReleaseClick=false;rig.halt();};const releaseClick=(e:MouseEvent)=>{if(suppressReleaseClick){suppressReleaseClick=false;e.preventDefault();e.stopImmediatePropagation();}};window.addEventListener('pointerdown',resetClick,true);window.addEventListener('click',releaseClick,true);adopt();onviewport({width,height});rig.set(camera);controller=new GraphController(providers,m=>model=m,onpositions,onerror);const media=matchMedia('(prefers-reduced-motion: reduce)');reduced=media.matches;rig.setReduced(reduced);const motion=()=>{reduced=media.matches;rig.setReduced(reduced);};media.addEventListener('change',motion);const visibility=()=>{controller?.view($state.snapshot(camera),width,height,lens,selected,paused,reduced);if(document.hidden)controller?.flush();};document.addEventListener('visibilitychange',visibility);const observer=new ResizeObserver(([entry])=>{width=entry.contentRect.width;height=entry.contentRect.height;onviewport({width,height});adopt();schedule();});observer.observe(canvas);
  const wheel=(e:WheelEvent)=>{e.preventDefault();adopt();const r=canvas.getBoundingClientRect();rig.zoomAt({x:e.clientX-r.left,y:e.clientY-r.top},wheelZoomFactor(e,height));schedule();};canvas.addEventListener('wheel',wheel,{passive:false});
  // Safari reports trackpad pinch as gesture events instead of a ctrl-modified wheel.
  let lastGesture=1;const gestureStart=(e:any)=>{lastGesture=e.scale;},gestureMove=(e:any)=>{e.preventDefault();adopt();const r=canvas.getBoundingClientRect();rig.zoomAt({x:e.clientX-r.left,y:e.clientY-r.top},gestureZoomFactor(e.scale,lastGesture));lastGesture=e.scale;schedule();};
  canvas.addEventListener('gesturestart',gestureStart);canvas.addEventListener('gesturechange',gestureMove);
  return()=>{window.removeEventListener('phosphora-theme-change',invalidatePalette);window.removeEventListener('pointerdown',resetClick,true);window.removeEventListener('click',releaseClick,true);rig.halt();controller?.close();observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('gesturestart',gestureStart);canvas.removeEventListener('gesturechange',gestureMove);clearTimeout(longTimer);cancelAnimationFrame(frame);};});
</script>
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (Canvas implements a keyboard-operated graph application; search supplies an accessible list.) -->
<canvas data-camera-x={camera.x} data-camera-y={camera.y} data-zoom={camera.zoom} data-layout={model.arranging?'running':'idle'} data-transition={transitioning?'running':'idle'} data-visual-focus={visualFocus} data-focus={selected} data-hover={hover} data-context={model.nodes.filter(n=>(n.attention??1)>.4).length} data-nodes={painted.filter(n=>n.opacity>.5).length} bind:this={canvas} class="map" role="application" aria-label="Карта атомов. Поиск для выбора, Enter для открытия, клавиши 1–4 для состояния." tabindex="0" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancel} onpointerleave={leave} oncontextmenu={e=>{e.preventDefault();const n=nodeAt(position(e),true);if(n){n.members?onbranch(n.members):oncontext(n.id);}}} onkeydown={e=>{adopt();if(selected&&e.key==='Enter')onopen(selected);if(selected&&['1','2','3','4'].includes(e.key))onstate(selected,(['normal','now','paused','archived'] as AtomState[])[Number(e.key)-1]);if(e.key==='Escape')onselect('');if(e.key==='+'||e.key==='=')rig.zoomStep(1.2);if(e.key==='-')rig.zoomStep(1/1.2);if(e.key.startsWith('Arrow')){e.preventDefault();rig.panBy(e.key==='ArrowLeft'?60:e.key==='ArrowRight'?-60:0,e.key==='ArrowUp'?60:e.key==='ArrowDown'?-60:0);}schedule();}}></canvas>
<div style:position="fixed" style:inset="0" style:pointer-events="none" style:transform-origin="0 0" style:transform={`translate(${width/2+camera.x-(width/2+previewCamera.x)*camera.zoom/previewCamera.zoom}px,${height/2+camera.y-(height/2+previewCamera.y)*camera.zoom/previewCamera.zoom}px) scale(${camera.zoom/previewCamera.zoom})`}>{#each previews as preview (preview.id)}<ContentPreview {preview} onheight={previewHeight}/>{/each}</div>
<div class="zoom-controls"><button aria-label="Приблизить" onclick={()=>{adopt();rig.zoomStep(1.25);schedule();}}>+</button><span>{Math.round(camera.zoom*100)}%</span><button aria-label="Отдалить" onclick={()=>{adopt();rig.zoomStep(.8);schedule();}}>−</button><button aria-label="К центру карты" onclick={()=>{adopt();if(!data.atoms.length){rig.set({x:0,y:0,zoom:1});oncamera();return;}const xs=data.atoms.map(a=>a.x),ys=data.atoms.map(a=>a.y),left=Math.min(...xs)-110,right=Math.max(...xs)+110,top=Math.min(...ys)-100,bottom=Math.max(...ys)+130,zoom=Math.max(MIN_ZOOM,Math.min(1,(width-120)/(right-left),(height-180)/(bottom-top)));rig.retarget({x:-(left+right)/2*zoom,y:-(top+bottom)/2*zoom,zoom});schedule();}}>⌖</button></div>
{#if dragging}<div class="dropzones">{#each (dragState==='archived'?['normal']:['normal','now','paused','archived'].filter(s=>s!==dragState)) as state,i}<div class="drop" class:now={i===0} class:paused={i===1} class:archived={i===2} data-state={state}>{state==='normal'?(dragState==='archived'?'Восстановить':'Обычный'):state==='now'?'Сейчас':state==='paused'?'Пауза':'Архив'}</div>{/each}</div>{/if}
