import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {build} from './build.mjs';
const dir=build(),port=Number(process.env.PORT||4173);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(dir,'.'+(p==='/'?'/index.html':p));
 if(file!==path.join(dir,'index.html')&&!file.startsWith(dir+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':(types[path.extname(file)]||'text/plain')+'; charset=utf-8','Cache-Control':'no-store'});res.end(body)});
}).listen(port,'127.0.0.1',()=>console.log('Open http://127.0.0.1:'+port+'/'));

