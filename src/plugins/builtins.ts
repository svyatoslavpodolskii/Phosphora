import type {Plugin} from './api';
export const templates:Plugin={manifest:{id:'builtin.templates',name:'Типы и шаблоны',version:'1.0.0',apiVersion:1,permissions:['ui','atoms.read','atoms.write','graph'],description:'Люди, проекты, задачи и идеи.'},activate(app){
 for(const type of [{id:'note',name:'Заметка',icon:'·'},{id:'person',name:'Человек',icon:'♙',appearance:{color:'#e9b482'}},{id:'project',name:'Проект',icon:'◈',appearance:{color:'#9bbef2'}},{id:'task',name:'Задача',icon:'✓',appearance:{shape:'square' as const}},{id:'idea',name:'Идея',icon:'✦',appearance:{color:'#d4a2e5'}},{id:'area',name:'Область',icon:'◎'}])app.types.register(type);
 app.ui.registerContextAction({id:'complete',name:'Завершить → в архив',async run(id){if(id)await app.atoms.setState(id,'archived');}});
}};
