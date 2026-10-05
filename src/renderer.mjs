import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import css from './document.css';

export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mimeTypes={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.avif':'image/avif'};
function imageUrl(href,baseDir){
  if(/^data:image\/(png|jpeg|gif|webp|avif);base64,[a-z\d+/=\s]+$/i.test(href))return href;
  if(/^[a-z][a-z\d+.-]*:|^\/\//i.test(href))throw new Error('Images must be local PNG, JPEG, GIF, WebP, or AVIF files, or raster data URLs. Download an authorised image first.');
  const file=path.resolve(baseDir,decodeURIComponent(href));
  const mime=mimeTypes[path.extname(file).toLowerCase()];
  if(!mime)throw new Error('Unsupported image format: '+href);
  const data=fs.readFileSync(file);
  if(data.length>10*1024*1024)throw new Error('Image exceeds 10 MB: '+href);
  return 'data:'+mime+';base64,'+data.toString('base64');
}
export function renderDocument(doc,baseDir=process.cwd()){
  if(!doc || typeof doc!=='object' || typeof doc.title!=='string' || !doc.title.trim())throw new Error('title must be a non-empty string');
  const theme=doc.theme??'sage';
  if(!['sage','paper','midnight'].includes(theme))throw new Error('theme must be sage, paper, or midnight');
  if(doc.subtitle!==undefined && typeof doc.subtitle!=='string')throw new Error('subtitle must be a string');
  if(!Array.isArray(doc.pages)||!doc.pages.length)throw new Error('pages must be a non-empty array');
  const renderer=new marked.Renderer();
  renderer.html=({text})=>escape(text);
  renderer.image=({href,title,text})=>`<img src="${escape(imageUrl(href,baseDir))}" alt="${escape(text)}"${title?` title="${escape(title)}"`:''} loading="lazy">`;
  const pages=doc.pages.map((p,i)=>{
    if(!p || typeof p.title!=='string'||!p.title.trim()||typeof p.markdown!=='string')throw new Error('Each page needs a title string and a markdown string');
    const html=sanitizeHtml(marked.parse(p.markdown,{renderer,gfm:true}),{allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img','del','input']),allowedAttributes:{a:['href','title'],img:['src','alt','title','loading'],input:['type','checked','disabled'],th:['align'],td:['align']},allowedSchemes:['https','http','mailto'],allowedSchemesByTag:{img:['data']},allowProtocolRelative:false,transformTags:{input:()=>({tagName:'input',attribs:{type:'checkbox',disabled:''}})}}).replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
    return `<section id="page-${i+1}" aria-labelledby="heading-${i+1}"><h2 id="heading-${i+1}">${escape(p.title)}</h2>${html}</section>`;
  });
  return `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="${theme==='midnight'?'dark':'light'}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(doc.title)} · Idea Zone</title><style>${css}</style></head><body><header><span class="brand">✳ Idea Zone</span><div class="tools"><a href="#" id="all">Read all</a><button id="print" type="button">Print / PDF</button></div></header><div class="layout"><nav aria-label="Document pages"><span>In this idea</span>${doc.pages.map((p,i)=>`<a href="#page-${i+1}">${escape(p.title)}</a>`).join('')}</nav><article><div class="eyebrow">An idea worth sharing</div><h1>${escape(doc.title)}</h1>${doc.subtitle?`<p class="subtitle">${escape(doc.subtitle)}</p>`:''}${pages.join('')}<div class="foot">Made with Idea Zone · A single file, a whole idea.</div></article></div><script>(function(){const pages=[...document.querySelectorAll('article section')],links=[...document.querySelectorAll('nav a')];function show(hash=location.hash){const found=pages.find(p=>'#'+p.id===hash);pages.forEach(p=>p.hidden=!!found&&p!==found);links.forEach(a=>{if(found&&a.getAttribute('href')===hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}addEventListener('hashchange',()=>show());links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const hash=a.getAttribute('href');show(hash);if(!location.href.startsWith('about:srcdoc'))location.hash=hash}));document.querySelector('#all').addEventListener('click',e=>{e.preventDefault();if(!location.href.startsWith('about:srcdoc'))history.replaceState(null,'',location.pathname+location.search);show('')});document.querySelector('#print').addEventListener('click',()=>print());show();})();</script></body></html>`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Usage: node render.mjs input.json output.html');const doc=JSON.parse(fs.readFileSync(input,'utf8'));const html=renderDocument(doc,path.dirname(path.resolve(input)));fs.writeFileSync(output,html);console.log('Created '+output+' ('+Buffer.byteLength(html)+' bytes)');}catch(error){console.error('Idea Zone: '+error.message);process.exitCode=1;}
}
