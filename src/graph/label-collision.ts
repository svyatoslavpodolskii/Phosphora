export interface LabelRect{x:number;y:number;width:number;height:number}
/** Screen-space grid. It preserves label priority and exact padding without an all-pairs scan. */
export class LabelCollisions{
 private cells=new Map<string,LabelRect[]>();
 checks=0;
 constructor(private cellSize=128){}
 private range(rect:LabelRect,padX=0,padY=0){return {left:Math.floor((rect.x-padX)/this.cellSize),right:Math.floor((rect.x+rect.width+padX)/this.cellSize),top:Math.floor((rect.y-padY)/this.cellSize),bottom:Math.floor((rect.y+rect.height+padY)/this.cellSize)};}
 add(rect:LabelRect){const area=this.range(rect);for(let y=area.top;y<=area.bottom;y++)for(let x=area.left;x<=area.right;x++){const key=x+':'+y,bucket=this.cells.get(key);if(bucket)bucket.push(rect);else this.cells.set(key,[rect]);}}
 overlaps(rect:LabelRect){const area=this.range(rect,8,4);for(let y=area.top;y<=area.bottom;y++)for(let x=area.left;x<=area.right;x++)for(const other of this.cells.get(x+':'+y)||[]){this.checks++;if(rect.x<other.x+other.width+8&&rect.x+rect.width+8>other.x&&rect.y<other.y+other.height+4&&rect.y+rect.height+4>other.y)return true;}return false;}
}
