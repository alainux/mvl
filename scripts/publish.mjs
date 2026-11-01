import fs from 'node:fs';
import path from 'node:path';
import {build} from './build.mjs';
const dist=build();
const target=path.resolve(import.meta.dirname,'../docs');
fs.rmSync(target,{force:true,recursive:true});
fs.cpSync(dist,target,{recursive:true});
console.log('Committed Pages output prepared under docs/.');

