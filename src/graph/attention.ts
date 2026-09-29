import type {Camera,GraphNode} from './model';
import type {Point,Viewport} from './camera';

/** Screen space presentation only. It never selects, moves or persists an atom.
 *
 *  The signals are all the ones a person actually uses to decide where to look:
 *  what sits near the middle of what they can see, what occupies real estate,
 *  what they just touched, what they are zooming towards, and what is a landmark
 *  worth keeping in view. Nothing here can change selection. */
export function visualAttention(nodes:GraphNode[],camera:Camera,view:Viewport,selected:string,recent:string,focal?:Point){
  const scores=new Map<string,number>();let focus='',best=-1;
  const halfW=view.width/2,halfH=view.height/2;
  // Everything outside the viewport is invisible, so it costs nothing to score and
  // can never win attention. Skipping it is what keeps a gesture cheap on a phone.
  const margin=Math.max(120,Math.max(view.width,view.height)*.35);
  const normX=Math.max(1,view.width*.6),normY=Math.max(1,view.height*.6);
  const minSide=Math.max(1,Math.min(view.width,view.height));
  for(const n of nodes){
   const x=halfW+camera.x+n.x*camera.zoom,y=halfH+camera.y+n.y*camera.zoom;
   if(x<-margin||x>view.width+margin||y<-margin||y>view.height+margin){scores.set(n.id,.38);continue;}
   const dx=(x-halfW)/normX,dy=(y-halfH)/normY;
   const central=Math.exp(-(dx*dx+dy*dy)*2);
   const area=Math.min(.16,n.radius*camera.zoom/minSide);
   const toward=focal?Math.exp(-Math.hypot(x-focal.x,y-focal.y)/180)*.15:0;
   const inView=x>=0&&x<=view.width&&y>=0&&y<=view.height;
   const score=central*.65+area+toward;
   const prominence=Math.min(1,score+(inView&&n.id===selected?.13:0)+(inView&&n.id===recent?.17:0)+(n.landmark?.08:0));
   // Distant world recedes but never disappears: the floor is what keeps the user
   // oriented, and it is high enough that no context is ever erased by focus.
   scores.set(n.id,.46+.54*prominence);
   if(inView&&prominence>best){best=prominence;focus=n.id;}
  }
  return {scores,focus};
}
