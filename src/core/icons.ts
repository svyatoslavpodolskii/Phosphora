/** Shared monochrome geometry for DOM, Canvas and GPU icon textures. */
export const ICONS=[
 {id:'note',name:'Заметка',path:'M6 3h9l3 3v15H6Z M14 3v5h4 M9 12h6 M9 16h6'},
 {id:'idea',name:'Идея',path:'M9 18h6 M10 21h4 M8 14a6 6 0 1 1 8 0l-1 3H9Z'},
 {id:'project',name:'Проект',path:'M3 8h18v12H3Z M8 8V4h8v4 M3 13h18 M10 13v3h4v-3'},
 {id:'person',name:'Человек',path:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2'},
 {id:'folder',name:'Папка',path:'M3 5h7l2 3h9v12H3Z'},
 {id:'hub',name:'Центр',path:'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M12 3v6 M12 15v6 M3 12h6 M15 12h6 M5 5l5 5 M14 14l5 5 M19 5l-5 5 M10 14l-5 5'},
 {id:'reference',name:'Источник',path:'M4 4h7l1 2 1-2h7v16h-7l-1 1-1-1H4Z M12 6v15 M7 8h2 M15 8h2'},
 {id:'media',name:'Медиа',path:'M3 4h18v16H3Z M9 8l7 4-7 4Z'},
 {id:'event',name:'Событие',path:'M4 5h16v16H4Z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 18h2'},
 {id:'area',name:'Область',path:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0'},
 {id:'custom',name:'Свой знак',path:'M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z'},
] as const;
export function iconDefinition(value:string){return ICONS.find(icon=>'icon:'+icon.id===value);}
export function typeIcon(type:string){return 'icon:'+(ICONS.some(icon=>icon.id===type)?type:'note');}
