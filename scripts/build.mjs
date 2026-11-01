import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const get=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const load=(p)=>JSON.parse(get(p));
const columns=['recipes','grammar','scenarios','builders'];
const extras=['phrases','quiz','writing','roadmap'];
const modules=['01-state.js','02-components.js','pages/10-overview.js','pages/20-reference.js','pages/30-workbench.js','pages/35-language-blocks.js','pages/40-workspace.js','pages/50-search.js','99-main.js'];
export function build(){
 const manifest=load('content/manifest.json'),data={};
 for(const key of columns){
  if(!Array.isArray(manifest[key])||!manifest[key].length)throw Error('Missing manifest: '+key);
  if(new Set(manifest[key]).size!==manifest[key].length)throw Error('Duplicate IDs: '+key);
  data[key]=manifest[key].map(id=>{
   if(!/^[a-z][a-z0-9-]*$/.test(id))throw Error('Invalid ID '+id);
   const item=load('content/'+key+'/'+id+'.json');
   if(item.id!==id)throw Error('ID mismatch: '+key+'/'+id);
   return item;
  });
 }
 for(const key of extras)data[key]=load('content/'+key+'.json');
 data.framework={intents:load('framework/intents.json'),languages:['de','es'].map(id=>load('framework/languages/'+id+'.json'))};
 for(const [key,expected] of [['recipes',20],['grammar',10],['scenarios',12]]){
  if(data[key].length<expected)throw Error('Unexpectedly incomplete '+key);
 }
 for(const intent of data.framework.intents){
  const possibilities=[];
  for(const lang of data.framework.languages){
   const rule=lang.realizations[intent.id];
   if(!rule||typeof rule.pattern!=='string'||typeof rule.usage!=='string')throw Error('Missing intent '+lang.code+'/'+intent.id);
   const slotnames=Object.keys(rule.slots||{});
   const placeholders=[...rule.pattern.matchAll(/\{([a-z]+)\}/g)].map(x=>x[1]);
   if(slotnames.length>1||JSON.stringify(slotnames)!==JSON.stringify([...new Set(placeholders)]))throw Error('Slot mismatch '+lang.code+'/'+intent.id);
   possibilities.push(slotnames.length?rule.slots[slotnames[0]].map(o=>o.id):[]);
  }
  if(JSON.stringify(possibilities[0])!==JSON.stringify(possibilities[1]))throw Error('Inconsistent slot meanings '+intent.id);
 }
 const out=path.join(root,'dist');fs.mkdirSync(path.join(out,'assets'),{recursive:true});
 const serialized=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const index=get('site/index.template.html').replace('<!-- DATA_JSON -->',serialized);
 if(index.includes('<!-- DATA_JSON -->'))throw Error('Missing data replacement');
 fs.writeFileSync(path.join(out,'index.html'),index);
 fs.writeFileSync(path.join(out,'assets/app.js'),modules.map(file=>'// '+file+'\n'+get('src/js/'+file)).join('\n'));
 fs.writeFileSync(path.join(out,'assets/styles.css'),get('src/styles.css'));
 fs.writeFileSync(path.join(out,'favicon.svg'),get('site/favicon.svg'));
 fs.writeFileSync(path.join(out,'.nojekyll'),'');
 console.log('Built dist/: '+data.recipes.length+' recipes; '+data.framework.intents.length+' intents; '+data.framework.languages.length+' languages.');
 return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename))build();
