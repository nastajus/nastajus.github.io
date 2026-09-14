import {parseHTML} from 'linkedom';
import {createHash} from 'node:crypto';
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const slug=value=>clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'posting';
const safeTags=new Set(['P','DIV','SPAN','STRONG','B','EM','I','U','S','BR','UL','OL','LI','H1','H2','H3','H4','H5','H6','TABLE','THEAD','TBODY','TFOOT','TR','TD','TH','BLOCKQUOTE','A','HR','SUP','SUB']);
const dropTags=new Set(['SCRIPT','STYLE','FORM','INPUT','BUTTON','SELECT','TEXTAREA','IFRAME','OBJECT','EMBED','SVG','MATH','TEMPLATE']);
export function safeUrl(value,base='https://jobboard.jvstoronto.org/'){
 try{const u=new URL(value,base);return ['https:','http:','mailto:','tel:'].includes(u.protocol)?u.href:null;}catch{return null;}
}
export function sanitizeFragment(node){
 if(node.nodeType===3)return esc(node.textContent);
 if(node.nodeType!==1||dropTags.has(node.tagName))return '';
 const inside=[...node.childNodes].map(sanitizeFragment).join('');
 if(!safeTags.has(node.tagName))return inside;
 const tag=node.tagName.toLowerCase();
 if(['br','hr'].includes(tag))return `<${tag}>`;
 const href=tag==='a'?safeUrl(node.getAttribute('href')):null;
 const attrs=href?` href="${esc(href)}" rel="noopener noreferrer" target="_blank"`:'';
 return `<${tag}${attrs}>${inside}</${tag}>`;
}
export function extract(html,stats){
 const {document}=parseHTML(html);
 const widgets=[...document.querySelectorAll('.elementor-widget-text-editor')];
 const main=widgets.find(el=>/Job Title:/i.test(el.textContent));
 const description=widgets.find(el=>/Job Number:/i.test(el.textContent));
 if(!main||!description)throw Error('Unrecognized job detail: expected Job Title and Job Number sections');
 function field(label){for(const p of [...main.querySelectorAll('p'),...description.querySelectorAll('p')]){const text=clean(p.textContent);if(text.toLowerCase().startsWith(label.toLowerCase()+':'))return clean(text.slice(label.length+1));}return '';}
 const sourceTitle=field('Job Title'),jobNumber=field('Job Number');
 if(!sourceTitle||!jobNumber)throw Error('Missing title or job number');
 // The supplied Java capture has a person's name in its title field; the job's
 // description explicitly supplies the occupational title.
 const title=sourceTitle==='Shaishav Kumar'&&/Java Backend Developer/i.test(description.textContent)?'Java Backend Developer':sourceTitle;
 const savedMatch=html.match(/saved date:\s*([^\r\n]+)/i);
 const parsedDate=savedMatch?Date.parse(savedMatch[1]):NaN;
 const savedAt=Number.isFinite(parsedDate)?new Date(parsedDate).toISOString():stats.mtime.toISOString();
 const sourceMatch=html.match(/\n\s*url:\s*(https?:\/\/[^\s]+)/i);
 const sourceUrl=safeUrl(sourceMatch?.[1]||'https://jobboard.jvstoronto.org/');
 const applicationUrl=safeUrl(document.querySelector('#applyLink')?.getAttribute('href')||'');
 const content=widgets.map(el=>[...el.childNodes].map(sanitizeFragment).join('')).join('\n');
 if(clean(content).length<100)throw Error('Job content unexpectedly short');
 // Keep the saved-page styling and embedded assets, but remove account controls
 // and active content from the public copy. Originals are never modified.
 for(const node of document.querySelectorAll('script,form,input,button,select,textarea,iframe,object,embed,base,header,nav,#wpadminbar,.elementor-widget-html,link[rel="profile"],meta[http-equiv]'))node.remove();
 for(const node of document.querySelectorAll('*')){
  for(const attr of [...node.attributes])if(/^on/i.test(attr.name)||attr.name==='srcdoc')node.removeAttribute(attr.name);
  for(const attr of ['href','src','action']){const value=node.getAttribute(attr);if(value&&/^(javascript|vbscript):/i.test(value.trim()))node.removeAttribute(attr);}
 }
 // Drop captured comments (including source/session metadata); provenance is in
 // the generated index. linkedom does not expose TreeWalker in all versions.
 const removeComments=node=>{for(const child of [...node.childNodes]){if(child.nodeType===8)child.remove();else removeComments(child);}};
 removeComments(document);
 const meta=document.createElement('meta');meta.setAttribute('name','robots');meta.setAttribute('content','noindex, nofollow');document.head.append(meta);
 const csp=document.createElement('meta');csp.setAttribute('http-equiv','Content-Security-Policy');csp.setAttribute('content',"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'");document.head.prepend(csp);
 document.title=`${title} — saved JVS page`;
 return {title,sourceTitle,jobNumber,department:field('Department'),hours:field('Hours of Work'),location:field('Main Intersection'),savedAt,savedAtBasis:Number.isFinite(parsedDate)?'SingleFile capture timestamp':'File last-modified timestamp (fallback)',fileCreatedAt:stats.birthtime.toISOString(),fileModifiedAt:stats.mtime.toISOString(),sourceUrl,applicationUrl,content,snapshot:'<!doctype html>\n'+document.documentElement.outerHTML};
}
