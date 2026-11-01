import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'src'),output=path.join(root,'docs');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(path.join(output,'assets'),{recursive:true});
fs.copyFileSync(path.join(input,'index.html'),path.join(output,'index.html'));
fs.copyFileSync(path.join(input,'favicon.svg'),path.join(output,'favicon.svg'));
fs.cpSync(input,path.join(output,'assets'),{recursive:true,filter:file=>!file.endsWith('index.html')&&!file.endsWith('favicon.svg')});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Compiled MVL spec → docs/ (dependency-free static ES modules)');
