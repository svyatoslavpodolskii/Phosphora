import type {Plugin} from './api';
import {typeIcon} from '../core/icons';
export const templates:Plugin={manifest:{id:'builtin.templates',name:'Типы и шаблоны',version:'1.0.0',apiVersion:1,permissions:['ui','atoms.read','atoms.write','graph'],description:'Люди, проекты и идеи. Задачи добавляются в текст атома.'},activate(app){
 for(const type of [{id:'note',name:'Заметка'},{id:'person',name:'Человек',appearance:{color:'#e9b482'}},{id:'project',name:'Проект',appearance:{color:'#9bbef2'}},{id:'idea',name:'Идея',appearance:{color:'#d4a2e5'}},{id:'area',name:'Область'},{id:'folder',name:'Папка'},{id:'hub',name:'Центр'},{id:'reference',name:'Источник'},{id:'media',name:'Медиа'},{id:'event',name:'Событие'}])app.types.register({...type,icon:typeIcon(type.id)});
 app.ui.registerContextAction({id:'complete',name:'Архивировать мысль',async run(id){if(id)await app.atoms.setState(id,'archived');}});
}};
