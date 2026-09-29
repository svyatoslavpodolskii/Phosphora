import DOMPurify from 'dompurify';
export function sanitizeHTML(html:string){return DOMPurify.sanitize(html,{FORBID_TAGS:['img','video','audio','source','iframe','object','embed','form','style','svg','math'],FORBID_ATTR:['style','src','srcset','poster','background']});}
