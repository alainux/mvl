import {analyze} from '../algebra.mjs';
export const profile={code:'de',name:'German',region:'Standard German · formal Sie',features:['Finite verb in position 2','Yes/no question: finite verb first','Modals send infinitive to clause end','Noun negation uses kein; other negation uses nicht','helfen governs dative']};
const finite={need:['brauche','brauchen'],have:['habe','haben'],understand:['verstehe','verstehen'],help:['helfe','helfen'],go:['gehe','gehen'],buy:['kaufe','kaufen'],can:['kann','können'],want:['will','wollen']};
const infinitive={need:'brauchen',have:'haben',understand:'verstehen',help:'helfen',go:'gehen',buy:'kaufen'};
const items={help:['Hilfe','keine Hilfe'],ticket:['ein Ticket','kein Ticket'],time:['Zeit','keine Zeit'],this:['das','das']};
export function realize(tree){
 const s=analyze(tree), e=s.event, i=e.agent==='speaker'?0:1;
 const subject=i===0?'Ich':'Sie';const f=finite[s.modal||e.predicate][i];
 let arg='',negWord=''; const nominal=['need','have','buy'].includes(e.predicate);
 if(nominal) arg=items[e.theme][s.negative?1:0];
 else if(e.predicate==='understand')arg='das';
 else if(e.predicate==='help')arg=e.recipient==='speaker'?'mir':'Ihnen';
 else if(e.predicate==='go')arg=e.destination==='home'?'nach Hause':'zum Bahnhof';
 if(s.negative&&!nominal)negWord='nicht';
 const t=s.time==null?'':s.time==='tomorrow'?'morgen':'heute';
 let tail;
 if(e.predicate==='go')tail=[t,negWord,arg].filter(Boolean);
 else tail=[arg,t,negWord].filter(Boolean);
 if(s.modal)tail.push(infinitive[e.predicate]);
 if(s.polite){if(!s.question)throw new TypeError('PLEASE requires question');
    // Bitte precedes the lexical infinitive when a modal is present.
    if(s.modal)tail.splice(tail.length-1,0,'bitte');
    else if(e.predicate==='go')tail.unshift('bitte');
    else tail.push('bitte');
 }
 const text=[...(s.question?[f,subject]:[subject,f]),...tail].join(' ');
 return text[0].toUpperCase()+text.slice(1)+(s.question?'?':'.');
}
