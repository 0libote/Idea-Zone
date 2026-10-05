import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer((req,res)=>{const requested=new URL(req.url,'http://localhost').pathname;const example=/^\/examples\/(brief|editorial|report)\.html$/.exec(requested);const file=example?path.resolve('examples',example[1]+'.html'):path.resolve(root,'.'+(requested==='/'?'/index.html':requested));if(!example&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(data)})}).listen(5173,'0.0.0.0',()=>console.log('Idea Zone: http://localhost:5173'));
