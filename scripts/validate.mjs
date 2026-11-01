import {build} from './build.mjs';
import fs from 'node:fs';
import path from 'node:path';
const dist=build();
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const app=fs.readFileSync(path.join(dist,'assets/app.js'),'utf8');
if(!html.includes('./assets/app.js')||!html.includes('./assets/styles.css'))throw Error('Assets not subpath-safe');
if(!app.includes('function blocksPage()')||!app.includes('blocks:blocksPage'))throw Error('Language blocks not wired');
if(!html.includes('minimum-viable-german') && !html.includes('mvgData'))throw Error('Data missing');
console.log('Validation successful.');

