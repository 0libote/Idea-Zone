import fs from 'node:fs';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
const assets='idea-zone/skills/share-idea/assets';
fs.mkdirSync('dist',{recursive:true});
await build({entryPoints:['src/renderer.mjs'],bundle:true,platform:'node',format:'esm',target:'node18',outfile:assets+'/render.mjs',loader:{'.css':'text'},banner:{js:"import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"}});
const {renderDocument}=await import('../'+assets+'/render.mjs?build='+Date.now());
const doc=JSON.parse(fs.readFileSync('examples/idea.json','utf8'));
const examples={};
for(const theme of ['sage','paper','midnight']){examples[theme]=renderDocument({...doc,theme});fs.writeFileSync('examples/'+theme+'.html',examples[theme])}
fs.writeFileSync(assets+'/template.html',examples.sage);
fs.copyFileSync('examples/idea.json',assets+'/example.json');
let licenses='Third-party packages bundled in render.mjs\n\n';
for(const name of ['marked','sanitize-html','htmlparser2','domhandler','domutils','domelementtype','dom-serializer','entities','deepmerge','escape-string-regexp','is-plain-object','parse-srcset','postcss','nanoid','picocolors','source-map-js']){const dir='node_modules/'+name;let files=[];try{files=fs.readdirSync(dir)}catch{continue}const license=files.find(f=>/^license(\.md|\.txt)?$/i.test(f));if(license)licenses+='--- '+name+' ---\n'+fs.readFileSync(dir+'/'+license,'utf8')+'\n\n'}
fs.writeFileSync(assets+'/THIRD-PARTY-LICENSES.txt',licenses);
execFileSync('python3',['-c',"import pathlib,zipfile\nwith zipfile.ZipFile('idea-zone-plugin.zip','w',zipfile.ZIP_DEFLATED) as z:\n for p in sorted(pathlib.Path('idea-zone').rglob('*')):\n  if p.is_file():z.write(p,str(p))"]);
let url='https://learn.chatgpt.com/docs/plugins',cta='Read the installation guide',status='Preview release · The package is ready. A public plugin listing is not yet available. You can use the ZIP with a supported plugin import or local marketplace.';
if(fs.existsSync('plugin-release.json')){const release=JSON.parse(fs.readFileSync('plugin-release.json','utf8'));url=release.plugin_url;cta='Open Idea Zone in ChatGPT';status='Private preview release · The plugin link is available to authorised accounts. Downloading the ZIP does not install it automatically.';}
const replacements={__EXAMPLES__:JSON.stringify(examples).replace(/</g,'\\u003c'),__EXAMPLE_DATA__:'data:text/html;base64,'+Buffer.from(examples.sage).toString('base64'),__PLUGIN_URL__:url.replace(/&/g,'&amp;').replace(/"/g,'&quot;'),__PLUGIN_CTA__:cta,__PLUGIN_STATUS__:status,__PLUGIN_DATA__:'data:application/zip;base64,'+fs.readFileSync('idea-zone-plugin.zip').toString('base64')};
let html=fs.readFileSync('src/landing.html','utf8');for(const [key,value]of Object.entries(replacements))html=html.replaceAll(key,value);
fs.writeFileSync('dist/index.html',html);
console.log('Built dist/index.html — '+Buffer.byteLength(html)+' bytes. Single-file landing page, three standalone examples, plugin ZIP.');
