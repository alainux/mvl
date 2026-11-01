import {analyze} from '../algebra.mjs';
export const profile={code:'es',name:'Spanish',region:'European Spanish · formal usted',features:['Subject can be omitted (pro-drop)','Formal addressee uses third-person verb','Yes/no questions use ¿…?','No before the conjugated verb','Modal + infinitive; object clitics may attach to infinitive']};
const finite={need:['necesito','necesita'],have:['tengo','tiene'],understand:['entiendo','entiende'],help:['ayudo','ayuda'],go:['voy','va'],buy:['compro','compra'],can:['puedo','puede'],want:['quiero','quiere']};
const infinitive={understand:'entender',go:'ir',buy:'comprar',help:'ayudar'};
export function realize(tree){
 const s=analyze(tree),e=s.event,i=e.agent==='speaker'?0:1;
 const subject=i===0?'':'Usted ';
 let verb=finite[s.modal||e.predicate][i],rest='';
 if(e.predicate==='need')rest=e.theme==='help'?'ayuda':'un billete';
 if(e.predicate==='have')rest=e.theme==='time'?'tiempo':'un billete';
 if(e.predicate==='understand')rest=s.modal?'entender esto':'esto';
 if(e.predicate==='go')rest=(s.modal?'ir ':'')+(e.destination==='home'?'a casa':'a la estación');
 if(e.predicate==='buy')rest=(s.modal?'comprar ':'')+'un billete';
 if(e.predicate==='help'){
   const clitic=e.recipient==='speaker'?'me':'le';
   if(s.modal)rest='ayudar'+clitic;
   else verb=clitic+' '+verb;
 }
 let result=subject+(s.negative?'no ':'')+verb+(rest?' '+rest:'');
 if(s.time)result+=' '+(s.time==='tomorrow'?'mañana':'hoy');
 if(s.polite)result+=', por favor';
 if(s.question)return '¿'+result[0].toUpperCase()+result.slice(1)+'?';
 return result[0].toUpperCase()+result.slice(1)+'.';
}
