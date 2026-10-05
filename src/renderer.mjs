import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import css from './document.css';
import briefCss from './brief.css';
import editorialCss from './editorial.css';
import reportCss from './report.css';

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
  const style=doc.style??'brief';
  if(!['brief','editorial','report'].includes(style))throw new Error('style must be brief, editorial, or report');
  const palette=doc.palette??({paper:'warm',sage:'sage',midnight:'midnight'}[doc.theme]??'neutral');
  if(doc.theme!==undefined&&!['sage','paper','midnight'].includes(doc.theme))throw new Error('Legacy theme must be sage, paper, or midnight');
  if(!['neutral','warm','sage','midnight'].includes(palette))throw new Error('palette must be neutral, warm, sage, or midnight');
  if(doc.subtitle!==undefined && typeof doc.subtitle!=='string')throw new Error('subtitle must be a string');
  if(!Array.isArray(doc.pages)||!doc.pages.length)throw new Error('pages must be a non-empty array');
  const renderer=new marked.Renderer();
  renderer.html=({text})=>escape(text);
  renderer.image=({href,title,text})=>`<img src="${escape(imageUrl(href,baseDir))}" alt="${escape(text)}"${title?` title="${escape(title)}"`:''} loading="lazy">`;
  const pages=doc.pages.map((p,i)=>{
    if(!p || typeof p.title!=='string'||!p.title.trim()||typeof p.markdown!=='string')throw new Error('Each page needs a title string and a markdown string');
    const html=sanitizeHtml(marked.parse(p.markdown,{renderer,gfm:true}),{allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img','del','input']),allowedAttributes:{a:['href','title'],img:['src','alt','title','loading'],input:['type','checked','disabled'],th:['align'],td:['align']},allowedSchemes:['https','http','mailto'],allowedSchemesByTag:{img:['data']},allowProtocolRelative:false,transformTags:{input:(_tag,attrs)=>({tagName:'input',attribs:{type:'checkbox',disabled:'',...(Object.hasOwn(attrs,'checked')?{checked:''}:{})}})}}).replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
    return `<section id="page-${i+1}" aria-labelledby="heading-${i+1}"><h2 id="heading-${i+1}">${style==='report'?`<span class="section-number">${String(i+1).padStart(2,'0')}</span>`:''}${escape(p.title)}</h2>${html}</section>`;
  });
  const styleCss={brief:briefCss,editorial:editorialCss,report:reportCss}[style];
  return `<!doctype html><html lang="en" data-style="${style}" data-palette="${palette}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="${palette==='midnight'?'dark':'light'}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(doc.title)}</title><style>${css}\n${styleCss}</style></head><body><a class="skip" href="#document">Skip to document</a><div class="shell"><header class="toolbar"><span class="document-name">${escape(doc.title)}</span><div class="tools"><div class="palette-control"><label for="palette">Colour</label><select id="palette">${Object.entries({neutral:'Neutral',warm:'Warm',sage:'Sage',midnight:'Dark'}).map(([value,label])=>`<option value="${value}"${value===palette?' selected':''}>${label}</option>`).join('')}</select></div><a href="#" id="all">Read all</a><button id="print" type="button">Print / PDF</button></div></header><div class="layout"><nav aria-label="Document pages"><span class="nav-label">Contents</span>${doc.pages.map((p,i)=>`<a href="#page-${i+1}" data-number="${String(i+1).padStart(2,'0')}">${escape(p.title)}</a>`).join('')}</nav><article id="document"><div class="document-heading"><h1>${escape(doc.title)}</h1>${doc.subtitle?`<p class="subtitle">${escape(doc.subtitle)}</p>`:''}</div>${pages.join('')}<div class="end-mark" aria-hidden="true"></div></article></div></div><script>(function(){const pages=[...document.querySelectorAll('article section')],links=[...document.querySelectorAll('nav a')];function show(hash=location.hash){const found=pages.find(p=>'#'+p.id===hash);pages.forEach(p=>p.hidden=!!found&&p!==found);links.forEach(a=>{if(found&&a.getAttribute('href')===hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}addEventListener('hashchange',()=>show());links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const hash=a.getAttribute('href');show(hash);if(!location.href.startsWith('about:srcdoc'))location.hash=hash}));document.querySelector('#all').addEventListener('click',e=>{e.preventDefault();if(!location.href.startsWith('about:srcdoc'))history.replaceState(null,'',location.pathname+location.search);show('')});document.querySelector('#print').addEventListener('click',()=>print());document.querySelector('#palette').addEventListener('change',e=>{document.documentElement.dataset.palette=e.target.value;document.querySelector('meta[name="color-scheme"]').content=e.target.value==='midnight'?'dark':'light'});show();})();</script></body></html>`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Usage: node render.mjs input.json output.html');const doc=JSON.parse(fs.readFileSync(input,'utf8'));const html=renderDocument(doc,path.dirname(path.resolve(input)));fs.writeFileSync(output,html);console.log('Created '+output+' ('+Buffer.byteLength(html)+' bytes)');}catch(error){console.error('Idea Zone: '+error.message);process.exitCode=1;}
}
