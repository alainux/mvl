import {analyze} from '../algebra.mjs';
export const profile={code:'fr',name:'French',region:'Standard French · formal vous',features:['Fixed subject + finite verb','Questions use est-ce que','Negation surrounds finite verb: ne … pas','Object clitics precede their verb','Avoir besoin de expresses NEED']};
const finite={understand:['comprends','comprenez'],help:['aide','aidez'],go:['vais','allez'],buy:['achète','achetez'],can:['peux','pouvez'],want:['veux','voulez']};
const infinitive={understand:'comprendre',help:'aider',go:'aller',buy:'acheter'};
const obj={ticket:'un billet',time:'le temps',help:"de l’aide"};
const weak=(agent)=>agent==='speaker'?'m’':'vous ';
function subject(agent,body,negative){
 if(agent==='addressee')return 'vous '+body;
 if(!negative&&/^[aeiouhàâéèêîôùû]/i.test(body))return 'j’'+body;
 return 'je '+body;
}
function negativeVerb(stem){return /^[aeiouhàâéèêîôùû]/i.test(stem)?'n’'+stem:'ne '+stem;}
export function realize(tree){
 const s=analyze(tree),e=s.event,i=e.agent==='speaker'?0:1;
 let verb,after='';
 if(e.predicate==='need'){
   verb=i===0?'ai':'avez';
   after=e.theme==='help'?'besoin d’aide':'besoin d’un billet';
 }else if(e.predicate==='have'){
   verb=i===0?'ai':'avez';
   after=e.theme==='time'?'le temps':'un billet';
 }else{
   verb=finite[s.modal||e.predicate][i];
   if(e.predicate==='understand')after=s.modal?'comprendre ça':'ça';
   if(e.predicate==='go'){
     const goal=e.destination==='station'?'à la gare':e.agent==='speaker'?'chez moi':'chez vous';
     after=s.modal?'aller '+goal:goal;
   }
   if(e.predicate==='buy')after=(s.modal?'acheter ':'')+(s.negative?'de billet':'un billet');
   if(e.predicate==='help'){
     const pron=e.recipient==='speaker'?'m’':'vous ';
     if(s.modal)after=pron+'aider';
     else if(s.negative)after=pron+verb;
     else after=pron+verb;
   }
 }
 // Help without a modal positions its direct-object clitic before the finite verb.
 if(e.predicate==='help'&&!s.modal){
   const clitic=e.recipient==='speaker'?'m’':'vous ';
   const v=finite.help[i];
   const left=s.negative?negativeVerb(clitic+v):clitic+v;
   let result=subject(e.agent,left,s.negative);
   if(s.negative)result+=' pas';
   if(s.time)result+=' '+(s.time==='tomorrow'?'demain':'aujourd’hui');
   if(s.question)result='Est-ce que '+result;
   if(s.polite)result+=', s’il vous plaît';
   return (s.question?result:result[0].toUpperCase()+result.slice(1))+(s.question?' ?':'.');
 }
 if(e.predicate==='have'&&s.negative&&e.theme==='ticket')after='de billet';
 let body=s.negative?negativeVerb(verb)+' pas':verb;
 if(after)body+=' '+after;
 let result=subject(e.agent,body,s.negative);
 // In French je + ne is always "je ne", while je + n' remains "je n'".
 if(s.time)result+=' '+(s.time==='tomorrow'?'demain':'aujourd’hui');
 if(s.question)result='Est-ce que '+result;
 if(s.polite)result+=', s’il vous plaît';
 return (s.question?result:result[0].toUpperCase()+result.slice(1))+(s.question?' ?':'.');
}
