<script lang="ts">
 import RelationshipLayer from '../ui/RelationshipLayer.svelte';
 import {pickLink} from './relationships';
 import type {Link} from '../core/model';
 let activeLink=$state('');let linkInteracting=$state(false);
 $effect(()=>{if(linkInteracting)rig.halt();controller?.setInteracting(linkInteracting);});
 import type {GpuMapRenderer,GpuNode,GpuEdge} from './gpu-renderer';
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
  import {nodeShape,bodyGradient,iconLegible,iconBudget,iconSprite,softHighlightVisible,SOFT_BUDGET,clearSprites} from './sprites';
 import {labelGeometry,measureText} from './footprint';
 import {onMount} from 'svelte';
 import {readable,mix} from '../core/themes';
 import type {Snapshot,AtomState} from '../core/model';
 import {MIN_ZOOM,MAX_ZOOM,type Camera,type GraphNode,type GraphModel} from './model';
 import {GraphController} from './controller';
 import type {GraphProviders} from './providers';
 import type {Preferences} from '../core/preferences';
 import type {PositionUpdate} from '../core/model';
 let {data,selected='',lens='all',camera=$bindable({x:0,y:0,zoom:1}),providers,prefs,providerVersion,paused=false,onselect,onopen,oncontext,onbranch,oncreate,onpositions,onstate,onstates,onlinkchange,oncamera,onhover=()=>{},onviewport=()=>{},revealRequest=null,onerror}: {data:Snapshot;selected:string;lens:string;camera:Camera;providers:GraphProviders;prefs:Preferences;providerVersion:number;paused:boolean;onselect:(id:string)=>void;onopen:(id:string)=>void;oncontext:(id:string)=>void;onbranch:(ids:string[])=>void;oncreate:(x:number,y:number)=>void;onpositions:(positions:PositionUpdate[],manual:boolean)=>Promise<void>;onstate:(id:string,state:AtomState)=>void;onstates:(ids:string[],state:AtomState)=>void;onlinkchange:(before:Link|null,after:Link|null)=>Promise<void>;oncamera:()=>void;onhover?:(id:string)=>void;onviewport?:(size:{width:number;height:number})=>void;revealRequest?:{id:string;nonce:number}|null;onerror:(e:Error)=>void}=$props();
 // A focus request arrives from outside, but the camera is still ours to animate.
 $effect(()=>{const request=revealRequest;if(!request)return;const atom=data.atoms.find(a=>a.id===request.id);if(atom)reveal({x:atom.x,y:atom.y},1);});
 let transitioning=$state(false);let canvas!:HTMLCanvasElement;let width=$state(1200),height=$state(700);let dragging=$state(false);let dragState=$state<AtomState|'mixed'>('normal');let model=$state.raw<GraphModel>({nodes:[],links:[],hidden:0});let controller=$state<GraphController|null>(null);let reduced=$state(false);let hover=$state('');
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
  const invalidatePalette=()=>{gpu?.invalidate();paletteCache=null;inkCache.clear();clearSprites();schedule();};
 const scene=new SemanticScene();const satelliteCache=new Map<string,{id:string;x:number;y:number;color:string}>();const displayed=new Map<string,PaintedNode>();
 let gpuHost:HTMLDivElement;let gpu=$state.raw<GpuMapRenderer|null>(null);let gpuFailed=$state(false);let renderBackend=$state('canvas');let rendererSettled=false;
 let painted=$state.raw<PaintedNode[]>([]);let frame=0;let lastFrame=0;let candidate='';let cameraMoving=false;
 const DRAG_THRESHOLD=6;
 let lasso:Point[]|null=null;let lassoSelection:string[]=[];
 $effect(()=>{providerVersion;if(!providers.hasTool('lasso')){lasso=null;lassoSelection=[];schedule();}});
 function inside(point:Point,polygon:Point[]){let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)found=!found;}return found;}
 function finishLasso(){const path=lasso;lasso=null;if(!path||path.length<3){schedule();return;}lassoSelection=[...new Set(painted.filter(n=>n.opacity>.5&&inside({x:width/2+camera.x+n.x*camera.zoom,y:height/2+camera.y+n.y*camera.zoom},path)).flatMap(n=>n.members||[n.id]))];schedule();}

 const pointers=new Map<number,Point>();let start:{x:number;y:number;worldX?:number;worldY?:number;node?:GraphNode;target?:GraphNode;panX:number;panY:number}|null=null;let moving:GraphNode|null=null;let pinch=0;let pinchStart:{distance:number;zoom:number}|null=null;let fromPinch=false;let longTimer:ReturnType<typeof setTimeout>;let holdStarted=0;let pendingDrag=false;let holdReady=false;let touchStart=false;let suppressReleaseClick=false;let panSample={x:0,y:0,time:0},panVelocity={x:0,y:0};
 function adopt(){rig.resize({width,height});}
 function schedule(){if(frame)return;frame=requestAnimationFrame(tick);}
 function tick(now=performance.now()){frame=0;if(!canvas)return;draw(now);}
   function draw(now:number){if(!rendererSettled)return;const dt=Math.min(64,Math.max(1,now-lastFrame||16));lastFrame=now;if(pendingDrag&&moving){pendingDrag=false;controller?.drag(moving.id,moving.x,moving.y);}
   const wasMoving=rig.moving;
   if(wasMoving){const next=rig.step(dt);camera={x:next.x,y:next.y,zoom:next.zoom};cameraMoving=true;}
   controller?.setInteracting(pointers.size>0||rig.moving||linkInteracting);
  const visual=scene.advance(model,dt,reduced,moving?.id,collapseAmount(camera.zoom));
  const unsettled=visual.active;transitioning=unsettled;const attention=visualAttention(visual.nodes,camera,{width,height},selected,now-recentAt<3000?recent:'',focal);visualFocus=attention.focus;painted=visual.nodes.map(n=>({...n,attention:attention.scores.get(n.id)??.4}));displayed.clear();for(const n of painted)displayed.set(n.id,n);
  const ctx=canvas.getContext('2d')!;const palette=readPalette();/* Software fallback quality follows scene size, never pointer state. */const dpr=Math.min(devicePixelRatio,2)*(data.atoms.length>250&&(!gpu?.available||gpuFailed)?.75:1);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);
  const nodes=new Map(painted.map(n=>[n.id,n]));const visible=(n:GraphNode)=>{const x=width/2+camera.x+n.x*camera.zoom,y=height/2+camera.y+n.y*camera.zoom;return x>-200&&x<width+200&&y>-100&&y<height+100;};
  const ambient=providers.hasTool('ambient-lens')&&lens!=='all',states=new Map(data.atoms.map(a=>[a.id,a.paused?'paused':a.state])),selectedIds=new Set(lassoSelection);const branch=model.branch||[],inBranch=new Set(branch);
  for(const p of model.satellites||[])satelliteCache.set(p.id,p);const groups=visual.nodes.filter(n=>n.members&&n.opacity>.003),grouped=new Map(groups.flatMap(n=>n.members!.map(id=>[id,n] as const)));for(const id of satelliteCache.keys())if(!grouped.has(id))satelliteCache.delete(id);
  // Stable curve geometry and opacity buckets reduce draw calls without a
  // separate gesture appearance. A press must never change the whole scene.
   const icons=iconBudget(camera.zoom,{width,height});
   // Decoration and label priority is stable: hover only adds a local highlight,
   // never displaces another atom's icon, finish or title.
   const ordered=painted.filter(visible).sort((a,b)=>Number(Boolean(b.members||b.landmark))-Number(Boolean(a.members||a.landmark))||b.radius-a.radius||a.id.localeCompare(b.id));
   const dense=data.atoms.length>250&&(!gpu?.available||gpuFailed),iconIds=new Set(ordered.slice(0,dense?Math.min(icons,8):icons).map(n=>n.id));
   const softIds=new Set(ordered.filter(n=>softHighlightVisible(n.radius,camera.zoom)||inBranch.has(n.id)).slice(0,dense?0:SOFT_BUDGET).map(n=>n.id));
  const edgeBatches=new Map<string,{path:Path2D;alpha:number;skeleton:boolean}>();
  const edgeLabels:{text:string;x:number;y:number}[]=[];const gpuEdges:GpuEdge[]=[];const gpuNodes:GpuNode[]=[];const accelerated=Boolean(gpu?.available&&!gpuFailed);renderBackend=accelerated?'webgl':'canvas';
  for(const l of visual.links){
   const na=nodes.get(l.from),nb=nodes.get(l.to);const a=na?{...na,...l.start}:undefined,b=nb?{...nb,...l.end}:undefined;
   if(!a||!b||(!visible(a)&&!visible(b)))continue;
   const skeleton=inBranch.has(l.from)&&inBranch.has(l.to),alpha=Math.round(l.opacity*Math.max(a.attention??1,b.attention??1)*(skeleton?1:.5)*16)/16;
   if(alpha<=0)continue;const key=Number(skeleton)+':'+alpha;let batch=edgeBatches.get(key);
   if(!batch){batch={path:new Path2D(),alpha,skeleton};edgeBatches.set(key,batch);}
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(14,d*.045);
   const ax=a.x+dx/d*a.radius,ay=a.y+dy/d*a.radius,bx=b.x-dx/d*b.radius,by=b.y-dy/d*b.radius;
   batch.path.moveTo(ax,ay);batch.path.quadraticCurveTo((ax+bx)/2-dy/d*bend,(ay+by)/2+dx/d*bend,bx,by);gpuEdges.push({ax,ay,cx:(ax+bx)/2-dy/d*bend,cy:(ay+by)/2+dx/d*bend,bx,by,width:(skeleton?1.9:1.2)/camera.zoom,color:skeleton?palette.accent:palette.edge,alpha});

   if(!skeleton&&camera.zoom>1.15&&l.relation!=='related')edgeLabels.push({text:l.relation,x:(a.x+b.x)/2,y:(a.y+b.y)/2-8});
  }
  const labelLayout=new Map<string,{text:ReturnType<typeof labelGeometry>;show:boolean}>(),labelRects:{x:number;y:number;width:number;height:number}[]=[];
  for(const original of ordered){const n=moving?.id===original.id?moving:original;
   const text=labelGeometry(n.label,n.radius,camera.zoom,width,n.id===selected||camera.zoom>1.2?n.state:'normal');
   const box={x:(n.x-text.halfWidth)*camera.zoom,y:(n.y+text.top)*camera.zoom,width:text.halfWidth*2*camera.zoom,height:(text.bottom-text.top)*camera.zoom};
   const eligible=camera.zoom>.55||!grouped.has(n.id)||n.members||n.landmark||n.radius>36||n.id===selected;
   const show=Boolean(eligible&&(n.id===selected||!labelRects.some(r=>box.x<r.x+r.width+8&&box.x+box.width+8>r.x&&box.y<r.y+r.height+4&&box.y+box.height+4>r.y)));
   labelLayout.set(n.id,{text,show});if(show)labelRects.push(box);
  }
  ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(width/2+camera.x,height/2+camera.y);ctx.scale(camera.zoom,camera.zoom);
  if(groups.length){ctx.save();const cloud=new Map([...(model.expanded?.nodes||model.nodes),...satelliteCache.values()].map(p=>[p.id,p]));ctx.strokeStyle=palette.edge;ctx.lineWidth=.65/camera.zoom;for(const l of model.expanded?.links||model.links){if(!grouped.has(l.from)&&!grouped.has(l.to))continue;const a=cloud.get(l.from),b=cloud.get(l.to),group=grouped.get(l.from)||grouped.get(l.to)!;if(!a||!b)continue;ctx.globalAlpha=.22*group.opacity*(group.attention??1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(const [id,group] of grouped){const p=satelliteCache.get(id);if(!p)continue;ctx.globalAlpha=.55*group.opacity*(group.attention??1);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,1.15/camera.zoom),0,Math.PI*2);ctx.fillStyle=p.color==='#b4ecc1'?palette.accent:inkFor(p.color,palette.background);ctx.fill();}ctx.restore();}
  if(!accelerated)for(const {path,alpha,skeleton} of edgeBatches.values()){ctx.globalAlpha=alpha;ctx.strokeStyle=skeleton?palette.accent:palette.edge;ctx.lineWidth=(skeleton?1.9:1.2)/camera.zoom;ctx.stroke(path);}
  ctx.globalAlpha=1;ctx.fillStyle=palette.muted;ctx.font='11px system-ui';ctx.textAlign='center';for(const label of edgeLabels)ctx.fillText(label.text,label.x,label.y);
   ctx.globalAlpha=1;ctx.textAlign='center';
   // The order below is also the priority order, so spending a decoration budget
   // in this order spends it on what the reader is actually looking at.
   for(const original of ordered){const n=moving?.id===original.id?moving:original;if(!visible(n))continue;const muted=ambient&&!(n.members||[n.id]).some(id=>states.get(id)===(lens==='now'?'now':'archived'));const opacity=(original.opacity??1)*(n.attention??1);const paintNode=(ctx:CanvasRenderingContext2D,raster=false)=>{ctx.save();ctx.textAlign='center';ctx.translate(n.x,n.y);ctx.globalAlpha=(raster?1:opacity)*(ambient&&lens==='archived'&&n.state==='archived'?1:n.state==='archived'?.35:n.state==='paused'?.6:1)*(muted?.25:1);
  // Hover is the only thing the pointer may add. It never implies selection.
  if(n.id===hover&&n.id!==selected){ctx.beginPath();ctx.arc(0,0,n.radius+5,0,Math.PI*2);ctx.strokeStyle=palette.text;ctx.lineWidth=1.2/camera.zoom;ctx.globalAlpha*=.45;ctx.stroke();ctx.globalAlpha/=.45;}
  if(n.state==='now'||n.id===selected||selectedIds.has(n.id)||holdReady&&start?.node?.id===n.id){ctx.beginPath();ctx.arc(0,0,n.radius+8,0,Math.PI*2);ctx.strokeStyle=n.id===selected?palette.text:palette.accent;ctx.lineWidth=1.5/camera.zoom;ctx.setLineDash(n.state==='now'?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);}
  const color=muted?palette.muted:n.color==='#b4ecc1'?palette.accent:n.color;const ink=inkFor(color,palette.background);
  // The outline and its highlight are rebuilt per frame otherwise: a new Path2D,
  // a new gradient and a fresh colour parse for every node, on every frame.
  const body=nodeShape(n.shape,n.radius);
  // The sheen is reserved for the nodes it is for; the rest of the field is
  // washed. What the hand holds and what the reader has chosen always keeps it.
  const mustHave=n.id===selected||n.id===hover||moving?.id===n.id;
  let fill=null;
  if(mustHave||softIds.has(n.id))fill=bodyGradient(color,n.radius);
  if(fill)ctx.fillStyle=fill;else ctx.fillStyle=color+'18';
  ctx.fill(body.path);
  ctx.strokeStyle=ink;ctx.lineWidth=inBranch.has(n.id)&&n.id!==selected?2.1:1.35;ctx.setLineDash(n.style==='dashed'?[5,4]:[]);ctx.stroke(body.path);ctx.setLineDash([]);
  // What the hand is holding, and what the reader is looking at, always keep
  // their glyph even once the budget is spent.
  if(mustHave||iconIds.has(n.id)&&iconLegible(n.radius,camera.zoom)){const size=n.members?24:22;ctx.drawImage(iconSprite(n.icon,ink,size),-size,-size,size*2,size*2);}  ctx.globalAlpha=(raster?1:opacity)*(muted?.28:1);
   if(camera.zoom>.55||!grouped.has(n.id)||n.members||n.landmark||n.radius>36||n.id===selected){
   const {text,show}=labelLayout.get(n.id)!;
   ctx.font=text.size+'px system-ui';ctx.textBaseline='top';
   if(show){
    for(const [i,title] of text.lines.entries()){
     ctx.fillStyle=palette.background;const w=measureText(title,13)*text.size/13,y=text.top+i*text.lineHeight;
     ctx.fillRect(-w/2-3,y,w+6,text.size+3);ctx.fillStyle=palette.text;ctx.fillText(title,0,y);
    }
    if(text.caption){ctx.font=text.captionSize+'px system-ui';ctx.fillStyle=palette.muted;ctx.fillText(text.caption,0,text.captionTop);}
   }
  }
  if(n.pinned&&prefs.pinning&&camera.zoom>.55){ctx.save();ctx.translate(n.radius-2,-n.radius-3);ctx.scale(.65,.65);ctx.rotate(.55);ctx.strokeStyle=palette.text;ctx.fillStyle=palette.background;ctx.lineWidth=1.8;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(5,-8);ctx.lineTo(3,-1);ctx.quadraticCurveTo(7,1,7,4);ctx.lineTo(-7,4);ctx.quadraticCurveTo(-7,1,-3,-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,12);ctx.stroke();ctx.restore();}
  ctx.restore();};
  if(accelerated){const {text,show}=labelLayout.get(n.id)!;const extent=Math.max(n.radius*1.2+20,show?text.halfWidth+10:0),top=n.radius*1.2+20,bottom=Math.max(n.radius*1.2+20,show?text.bottom+10:0);
   gpuNodes.push({id:n.id,x:n.x,y:n.y,left:-extent,top:-top,width:extent*2,height:top+bottom,alpha:opacity,signature:[n.radius,n.label,n.color,n.state,n.pinned,n.style,n.shape,n.icon,show,show?text.size:'',show&&text.caption?text.captionSize:'',show&&text.caption?text.captionTop:'',iconIds.has(n.id)&&iconLegible(n.radius,camera.zoom),softIds.has(n.id),muted,n.id===hover,n.id===selected,moving?.id===n.id,selectedIds.has(n.id),holdReady&&start?.node?.id===n.id,inBranch.has(n.id),prefs.pinning,camera.zoom>.55,(n.id===hover||n.id===selected||n.state==='now'||selectedIds.has(n.id))?Math.round(camera.zoom*16):''].join('|'),paint:ctx=>paintNode(ctx,true)});
  }else paintNode(ctx);
  }ctx.restore();if(accelerated){try{if(!gpu!.paint(width,height,dpr,camera,gpuEdges,gpuNodes))schedule();}catch(error){gpuFailed=true;console.warn('GPU renderer unavailable; using Canvas',error);schedule();}}
  if(lasso?.length){ctx.save();ctx.beginPath();ctx.moveTo(lasso[0].x,lasso[0].y);for(const p of lasso.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=palette.accent+'18';ctx.strokeStyle=palette.text;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.fill();ctx.stroke();if(lasso.length===1){ctx.beginPath();ctx.arc(lasso[0].x,lasso[0].y,14,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=palette.text;ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('Обведите атомы',lasso[0].x,lasso[0].y-24);}ctx.restore();}if(start&&pointers.size===1&&!dragging&&!lasso&&(holdReady||now-holdStarted>100)){ctx.save();const progress=Math.min(1,(now-holdStarted)/550),r=14+progress*4;const glow=ctx.createRadialGradient(start.x,start.y,2,start.x,start.y,44);glow.addColorStop(0,palette.accent+'35');glow.addColorStop(1,palette.accent+'00');ctx.fillStyle=glow;ctx.fillRect(start.x-44,start.y-44,88,88);ctx.strokeStyle=palette.accent;ctx.lineWidth=2;ctx.shadowColor=palette.accent;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(start.x,start.y,r,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();if(holdReady&&!reduced)for(let i=0;i<2;i++){const phase=((now-holdStarted-550)/1300+i*.5)%1;ctx.globalAlpha=(1-phase)*.5;ctx.beginPath();ctx.arc(start.x,start.y,r+phase*30,0,Math.PI*2);ctx.stroke();}ctx.restore();}if(holdReady&&start&&!dragging&&!lasso){ctx.save();ctx.strokeStyle=palette.text;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(start.x,start.y,14,0,Math.PI*2);ctx.stroke();ctx.fillStyle=palette.text;ctx.font='12px system-ui';ctx.textAlign='center';const hintX=Math.max(85,Math.min(width-85,start.x)),hintY=Math.max(42,start.y-24);ctx.fillText(start.target?'Отпустите — меню':'Отпустите — создать',hintX,hintY);if(start.target||providers.hasTool('lasso'))ctx.fillText(start.target?'Ведите — перенести':'Ведите — выделить',hintX,hintY-17);ctx.restore();}if(!pointers.size&&!rig.moving){previews=contentPreviews(ambient?painted.filter(n=>n.state===(lens==='now'?'now':'archived')):painted,camera,width,height,visualFocus,previewHeights,previews);previewCamera={...camera};}
  // The camera is recorded once it comes to rest, independently of any level of
  // detail crossfade happening at the same moment.
  if(cameraMoving&&!rig.moving&&!pointers.size){cameraMoving=false;oncamera();}
  if(rig.moving||unsettled||start&&Number.isFinite(holdStarted)&&pointers.size===1&&!dragging&&!lasso&&!reduced)schedule();
 }
 function position(e:{clientX:number;clientY:number}){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 function world(p:Point){return screenToWorld(p,camera,{width,height});}
 function targetAt(p:Point,touch=false){return pickTarget(hitRegions(painted,camera,{width,height},selected),p,'',touch);}
 function nodeAt(p:Point,touch=false){const id=targetAt(p,touch).id;return id?(displayed.get(id)??model.nodes.find(n=>n.id===id)??null):null;}
 /** Pointer motion only proposes a candidate. It can never change what is selected. */
 function aim(p:Point,touch=false){const id=pickTarget(hitRegions(painted,camera,{width,height},selected),p,candidate,touch).id;if(id!==candidate){candidate=id;hover=id;onhover(id);}}
 /** Focus helps the camera only when the target is genuinely poorly placed. */
 function reveal(point:Point,desired:number){const next=revealCamera(camera,point,{width,height},desired);if(next)rig.retarget(next);}
 function down(e:PointerEvent){if(e.button!==0)return;rig.halt();e.preventDefault();canvas.focus();adopt();controller?.setInteracting(true);const p=position(e);panSample={...p,time:performance.now()};panVelocity={x:0,y:0};pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);
  if(pointers.size===2){clearTimeout(longTimer);lasso=null;holdReady=false;start=null;moving=null;pendingDrag=false;dragging=false;controller?.cancelDrag();fromPinch=true;const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);const screen={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pinchStart={distance:pinch,zoom:camera.zoom};focal=screen;rig.pinchTo(screen,camera.zoom);return;}
  if(pointers.size>2)return;
  if(e.shiftKey&&providers.hasTool('lasso')){lasso=[p];start=null;schedule();return;}
  const w=world(p),hit=targetAt(p,e.pointerType==='touch'),node=hit.id?(displayed.get(hit.id)??model.nodes.find(n=>n.id===hit.id)??null):null;candidate=node?.id||'';hover=candidate;recent=candidate;recentAt=performance.now();fromPinch=false;
  // A finger is big and imprecise, so only the body of an object is a handle.
  // Touching a label opens it; dragging from there pans the map, which is what
  // someone near a label was almost certainly trying to do.
  holdStarted=performance.now();holdReady=false;touchStart=e.pointerType==='touch';const grabbable=Boolean(node)&&(hit.part==='body'||!touchStart);
  start={...p,worldX:w.x,worldY:w.y,node:grabbable?node??undefined:undefined,target:node??undefined,panX:camera.x,panY:camera.y};
  if(node&&lassoSelection.includes(node.id)){const members=data.atoms.filter(a=>lassoSelection.includes(a.id));if(members.length&&start)start.node={...node,id:'selection',members:members.map(a=>a.id),x:members.reduce((s,a)=>s+a.x,0)/members.length,y:members.reduce((s,a)=>s+a.y,0)/members.length};}
  longTimer=setTimeout(()=>{if(!start||dragging)return;holdReady=true;if(start.target&&!start.node)start.node=start.target;navigator.vibrate?.(15);schedule();},550);schedule();}
 function move(e:PointerEvent){adopt();
  // A pointer that was never pressed still has to produce a hover candidate:
  // what the user is looking at is not the same question as what they are holding.
  if(!e.buttons){if(pointers.size)return;aim(position(e),e.pointerType==='touch');schedule();return;}
  if(!pointers.has(e.pointerId))return;
  const p=position(e);pointers.set(e.pointerId,p);
  if(lasso){if(pointers.size===1&&Math.hypot(p.x-lasso.at(-1)!.x,p.y-lasso.at(-1)!.y)>3)lasso.push(p);schedule();return;}
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
    if(holdReady&&!start.target&&!fromPinch&&providers.hasTool('lasso')){lasso=[{x:start.x,y:start.y},p];start=null;candidate='';hover='';schedule();return;}
    if(touchStart&&!holdReady)start.node=undefined;
    if(start.node){if(!dragging){controller?.beginDrag(start.node.id,start.node.members);const states=new Set((start.node.members||[start.node.id]).map(id=>data.atoms.find(a=>a.id===id)?.state));dragState=states.size>1?'mixed':start.node.state as AtomState;}dragging=true;candidate='';hover='';const w=world(p);moving={...start.node,x:start.node.x+w.x-(start.worldX??w.x),y:start.node.y+w.y-(start.worldY??w.y)};pendingDrag=true;}
   else{holdReady=false;holdStarted=Infinity;const now=performance.now(),dt=Math.max(1,now-panSample.time);panVelocity={x:Math.max(-3,Math.min(3,(p.x-panSample.x)/dt)),y:Math.max(-3,Math.min(3,(p.y-panSample.y)/dt))};panSample={...p,time:now};rig.trackTo({x:start.panX+(p.x-start.x),y:start.panY+(p.y-start.y),zoom:camera.zoom});}}
   else aim(p,e.pointerType==='touch');
   schedule();}
 function up(e:PointerEvent){clearTimeout(longTimer);pointers.delete(e.pointerId);
  if(lasso){if(!pointers.size){finishLasso();start=null;holdReady=false;fromPinch=false;suppressReleaseClick=true;controller?.setInteracting(false);}return;}
  // A drag or a pinch ends: hand the camera back to the rig at its rest, then let
  // the spring carry whatever momentum is left over into a short settle.
  const gesture=rig.gesturing;
   if(gesture&&pinchStart){pinchStart=null;pinch=0;rig.endPinch();
    // The surviving finger must keep panning, otherwise pinch strands the gesture.
    if(pointers.size===1){const [remaining]=[...pointers.values()];start={...remaining,panX:camera.x,panY:camera.y};panSample={...remaining,time:performance.now()};panVelocity={x:0,y:0};}
    else start=null;
    schedule();return;}
  if(start){const p=position(e),travel=Math.hypot(p.x-start.x,p.y-start.y);
   if(moving){if(pendingDrag){pendingDrag=false;controller?.drag(moving.id,moving.x,moving.y);}const drop=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-state]')?.getAttribute('data-state') as AtomState|undefined;const id=moving.id;const members=moving.members;controller?.endDrag(Boolean(drop)).then(()=>{if(drop)onstates(members||[id],drop);}).catch(onerror);schedule();}
    else if(travel<=DRAG_THRESHOLD&&!fromPinch&&Number.isFinite(holdStarted)){
     const tapped=start.target;
     if(tapped&&lassoSelection.length>1&&lassoSelection.includes(tapped.id)){if(holdReady)onbranch(lassoSelection);else onselect(tapped.id);}
     else if(holdReady&&tapped){tapped.members?onbranch(tapped.members):oncontext(tapped.id);}
     else
     if(tapped?.members){const root=resolveSelection(tapped.id,painted)||tapped.members[0];onselect(root);reveal({x:tapped.x,y:tapped.y},1);}
     else if(tapped){lassoSelection=[];onselect(tapped.id);onopen(tapped.id);}
     else{candidate='';hover='';onselect('');activeLink=holdReady?'':pickLink([...(model.expanded?.links||[]),...model.links].filter(l=>data.links.some(original=>original.id===l.id)),painted.filter(n=>n.opacity>.3),camera,{width,height},p);if(holdReady){suppressReleaseClick=true;oncreate(start.worldX??world(start).x,start.worldY??world(start).y);}else lassoSelection=[];}}
    else if(!start.node&&!reduced&&performance.now()-panSample.time<90){rig.endPinch();rig.release(panVelocity);}}
  if(rig.gesturing)rig.endPinch();start=null;holdReady=false;moving=null;pendingDrag=false;dragging=false;candidate='';hover='';fromPinch=false;focal=undefined;controller?.setInteracting(false);schedule();}
 function cancel(){rig.halt();clearTimeout(longTimer);lasso=null;pointers.clear();controller?.setInteracting(false);start=null;moving=null;pendingDrag=false;dragging=false;pinch=0;controller?.cancelDrag();schedule();}
 function leave(){candidate='';hover='';schedule();}
 onMount(()=>{let disposed=false;void import('./gpu-renderer').then(m=>m.GpuMapRenderer.create(schedule)).then(value=>{if(disposed)value.destroy();else{gpuHost.appendChild(value.canvas);gpu=value;schedule();}}).catch(error=>{console.warn('WebGL unavailable; using Canvas',error);}).finally(()=>{rendererSettled=true;if(!disposed)schedule();});return()=>{disposed=true;gpu?.destroy();};});
 onMount(()=>{window.addEventListener('phosphora-theme-change',invalidatePalette);const resetClick=()=>{suppressReleaseClick=false;rig.halt();};const releaseClick=(e:MouseEvent)=>{if(suppressReleaseClick){suppressReleaseClick=false;e.preventDefault();e.stopImmediatePropagation();}};window.addEventListener('pointerdown',resetClick,true);window.addEventListener('click',releaseClick,true);adopt();onviewport({width,height});rig.set(camera);controller=new GraphController(providers,m=>model=m,onpositions,onerror);const media=matchMedia('(prefers-reduced-motion: reduce)');reduced=media.matches;rig.setReduced(reduced);const motion=()=>{reduced=media.matches;rig.setReduced(reduced);};media.addEventListener('change',motion);const visibility=()=>{controller?.view($state.snapshot(camera),width,height,lens,selected,paused,reduced);if(document.hidden)controller?.flush();};document.addEventListener('visibilitychange',visibility);const observer=new ResizeObserver(([entry])=>{width=entry.contentRect.width;height=entry.contentRect.height;onviewport({width,height});adopt();schedule();});observer.observe(canvas);
  const wheel=(e:WheelEvent)=>{e.preventDefault();adopt();const r=canvas.getBoundingClientRect();rig.zoomAt({x:e.clientX-r.left,y:e.clientY-r.top},wheelZoomFactor(e,height));schedule();};canvas.addEventListener('wheel',wheel,{passive:false});
  // Safari reports trackpad pinch as gesture events instead of a ctrl-modified wheel.
  let lastGesture=1;const gestureStart=(e:any)=>{lastGesture=e.scale;},gestureMove=(e:any)=>{e.preventDefault();adopt();const r=canvas.getBoundingClientRect();rig.zoomAt({x:e.clientX-r.left,y:e.clientY-r.top},gestureZoomFactor(e.scale,lastGesture));lastGesture=e.scale;schedule();};
  canvas.addEventListener('gesturestart',gestureStart);canvas.addEventListener('gesturechange',gestureMove);
  return()=>{window.removeEventListener('phosphora-theme-change',invalidatePalette);window.removeEventListener('pointerdown',resetClick,true);window.removeEventListener('click',releaseClick,true);rig.halt();controller?.close();observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('gesturestart',gestureStart);canvas.removeEventListener('gesturechange',gestureMove);clearTimeout(longTimer);cancelAnimationFrame(frame);};});
</script>
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (Canvas implements a keyboard-operated graph application; search supplies an accessible list.) -->
<canvas data-renderer={renderBackend} data-camera-x={camera.x} data-camera-y={camera.y} data-zoom={camera.zoom} data-layout={model.arranging?'running':'idle'} data-transition={transitioning?'running':'idle'} data-visual-focus={visualFocus} data-focus={selected} data-hover={hover} data-context={model.nodes.filter(n=>(n.attention??1)>.4).length} data-nodes={painted.filter(n=>n.opacity>.5).length} bind:this={canvas} class="map" class:gpu-active={renderBackend==='webgl'} role="application" aria-label="Карта атомов. Долгое нажатие или N для создания. Поиск для выбора, Enter для открытия, клавиши 1–4 для состояния." tabindex="0" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancel} onpointerleave={leave} oncontextmenu={e=>{e.preventDefault();if(pointers.size||dragging||'pointerType' in e&&e.pointerType==='touch')return;const n=nodeAt(position(e),true);if(n){if(lassoSelection.length>1&&lassoSelection.includes(n.id))onbranch(lassoSelection);else n.members?onbranch(n.members):oncontext(n.id);}}} onkeydown={e=>{adopt();if(e.key.toLowerCase()==='n'){e.preventDefault();const point=world({x:width/2,y:height/2});onselect('');oncreate(point.x,point.y);}if(selected&&e.key==='Enter')onopen(selected);if(selected&&['1','2','3','4'].includes(e.key)){const state=(['normal','now','paused','archived'] as AtomState[])[Number(e.key)-1];if(lassoSelection.length>1&&lassoSelection.includes(selected))onstates(lassoSelection,state);else onstate(selected,state);}if(e.key==='Escape'){activeLink='';lassoSelection=[];lasso=null;onselect('');}if(e.key==='+'||e.key==='=')rig.zoomStep(1.2);if(e.key==='-')rig.zoomStep(1/1.2);if(e.key.startsWith('Arrow')){e.preventDefault();rig.panBy(e.key==='ArrowLeft'?60:e.key==='ArrowRight'?-60:0,e.key==='ArrowUp'?60:e.key==='ArrowDown'?-60:0);}schedule();}}></canvas>
<div bind:this={gpuHost} class="gpu-map-host" hidden={renderBackend!=='webgl'} aria-hidden="true"></div>
<div style:position="fixed" style:inset="0" style:pointer-events="none" style:transform-origin="0 0" style:transform={`translate(${width/2+camera.x-(width/2+previewCamera.x)*camera.zoom/previewCamera.zoom}px,${height/2+camera.y-(height/2+previewCamera.y)*camera.zoom/previewCamera.zoom}px) scale(${camera.zoom/previewCamera.zoom})`}>{#each previews as preview (preview.id)}<ContentPreview {preview} onheight={previewHeight}/>{/each}</div>
<div class="zoom-controls"><button aria-label="Приблизить" onclick={()=>{adopt();rig.zoomStep(1.25);schedule();}}>+</button><span>{Math.round(camera.zoom*100)}%</span><button aria-label="Отдалить" onclick={()=>{adopt();rig.zoomStep(.8);schedule();}}>−</button><button aria-label="К центру карты" onclick={()=>{adopt();if(!data.atoms.length){rig.set({x:0,y:0,zoom:1});oncamera();return;}const xs=data.atoms.map(a=>a.x),ys=data.atoms.map(a=>a.y),left=Math.min(...xs)-110,right=Math.max(...xs)+110,top=Math.min(...ys)-100,bottom=Math.max(...ys)+130,zoom=Math.max(MIN_ZOOM,Math.min(1,(width-120)/(right-left),(height-180)/(bottom-top)));rig.retarget({x:-(left+right)/2*zoom,y:-(top+bottom)/2*zoom,zoom});schedule();}}>⌖</button></div>
<!-- The drop zones stay mounted for the whole session. Inserting three elements in
     the middle of a drag forces a layout right when the hand is already moving. -->
<div class="dropzones" class:dropzones-live={dragging} aria-hidden={!dragging}>{#each ['normal','now','paused','archived'] as state,i}<div class="drop" class:now={i===1} class:paused={i===2} class:archived={i===3} class:drop-off={dragState==='mixed'?false:dragState!=='archived'?state===dragState:state!=='normal'} data-state={state}>{state==='normal'?(dragState==='archived'?'Восстановить':'Обычный'):state==='now'?'Сейчас':state==='paused'?'Пауза':'Архив'}</div>{/each}</div>

<RelationshipLayer {data} nodes={painted} {camera} {width} {height} {selected} {paused} bind:activeLink bind:interacting={linkInteracting} onchange={onlinkchange}/>
