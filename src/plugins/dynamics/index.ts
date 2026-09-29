import type {Plugin} from '../api';
import {GraphWorkerClient} from '../../graph/worker-client';
import {PRESETS} from '../../graph/physics';
import type {DynamicsKind} from './layouts';
const definitions={branch:{name:'Ветви',description:'Выраженная иерархия и устойчивый каркас ветвей.',defaults:PRESETS.calm},molecule:{name:'Молекула',description:'Циклы и поперечные связи формируют упругую сеть.',defaults:PRESETS.elastic},compact:{name:'Созвездия',description:'Плотные группы вокруг узлов; локальное мягкое движение.',defaults:PRESETS.free}};
function dynamics(kind:DynamicsKind):Plugin{const d=definitions[kind];return{manifest:{id:'builtin.'+kind,name:d.name,description:d.description,version:'1.0.0',apiVersion:1,permissions:['graph']},activate(app){const worker=new GraphWorkerClient();app.graph.registerPhysicsProvider({id:'motion',name:d.name,step:input=>worker.call('dynamics',{kind,input})});app.graph.registerStructuralProvider({id:'structure',name:d.name,description:d.description,physicsId:'motion',defaults:d.defaults,arrange:input=>worker.call('structure',{kind,input})});return()=>worker.close();}};}
export const dynamicsPlugins=(["branch","molecule","compact"] as const).map(dynamics);
