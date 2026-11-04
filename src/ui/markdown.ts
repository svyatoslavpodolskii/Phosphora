import DOMPurify from 'dompurify';
export function sanitizeHTML(html:string){const fragment=DOMPurify.sanitize(html,{RETURN_DOM_FRAGMENT:true,FORBID_TAGS:['img','video','audio','source','iframe','object','embed','form','style','svg','math'],FORBID_ATTR:['style','src','srcset','poster','background']});
 // Decorate only a marker immediately following a real checkbox, never prose or code.
 for(const checkbox of fragment.querySelectorAll('li>input[type=checkbox]')){const next=checkbox.nextSibling;if(next?.nodeType===3&&/^\s*#task(?:\s+|$)/.test(next.textContent||'')){next.textContent=next.textContent!.replace(/^\s*#task(?:\s+|$)/,' ');const badge=document.createElement('span');badge.className='task-mark';badge.textContent='⚑';badge.title='Задача в канбане';badge.setAttribute('aria-label','Задача в канбане');checkbox.after(badge);}}
 const host=document.createElement('div');host.append(fragment);return host.innerHTML;}
