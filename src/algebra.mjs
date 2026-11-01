/** MVL core v0.1. No language strings belong in this module. */
export const ROLES = Object.freeze({ speaker: 'the speaker', addressee: 'the person addressed' });
export const CONCEPTS = Object.freeze({ help: 'assistance', ticket: 'a ticket', time: 'available time', this: 'this information', station: 'the station', home: 'home' });
export const PREDICATES = Object.freeze({
  need: { description: 'A person needs a thing', slot: 'theme', values: ['help', 'ticket'], modals: [] },
  have: { description: 'A person possesses or has something', slot: 'theme', values: ['time','ticket'], modals: [] },
  understand: { description: 'A person comprehends something', slot: 'theme', values: ['this'], modals: ['can'] },
  help: { description: 'One person helps another', slot: 'recipient', values: ['speaker','addressee'], modals: ['can','want'] },
  go: { description: 'A person moves to a destination', slot: 'destination', values: ['home','station'], modals: ['can','want'] },
  buy: { description: 'A person purchases something', slot: 'theme', values: ['ticket'], modals: ['can','want'] }
});
export const OPERATORS = Object.freeze({
  EVENT: 'Person × Predicate × Argument → Event',
  CAN: 'Event → Clause',
  WANT: 'Event → Clause',
  NOT: 'Clause → Clause',
  WHEN: 'Clause × Time → Clause',
  ASK: 'Clause → Question',
  PLEASE: 'Question → Question'
});
const fail = text => { throw new TypeError(text); };
export function event(predicate, agent='speaker', argument) {
  const spec=PREDICATES[predicate];
  if(!spec) fail(`Unknown predicate: ${predicate}`);
  if(!ROLES[agent]) fail(`Unknown agent: ${agent}`);
  if(!spec.values.includes(argument)) fail(`${predicate} requires ${spec.slot} ∈ {${spec.values.join(', ')}}`);
  if(predicate==='help' && agent===argument) fail('Agent and recipient must differ in this minimal profile');
  return Object.freeze({type:'event',predicate,agent,[spec.slot]:argument});
}
export const clause = value => ({type:'clause',value});
export function modal(kind,node) {
  if(!['can','want'].includes(kind)) fail(`Unknown modal: ${kind}`);
  if(node?.type!=='event') fail(`${kind} expects Event`);
  if(!PREDICATES[node.predicate].modals.includes(kind)) fail(`${kind} is not supported for ${node.predicate}`);
  return {type:'modal',kind,value:node};
}
export function negate(node){if(!['event','modal'].includes(node?.type)) fail('NOT expects Event or Modal');return {type:'not',value:node};}
export function when(node,time){if(!['event','modal','not'].includes(node?.type)) fail('WHEN expects a clause'); if(!['today','tomorrow'].includes(time)) fail('Unknown time');return {type:'when',time,value:node};}
export function ask(node){if(!['event','modal','not','when'].includes(node?.type)) fail('ASK expects a clause');return {type:'ask',value:node};}
export function please(node){if(node?.type!=='ask') fail('PLEASE requires a question');return {type:'please',value:node};}
export function makeTree({predicate='help',agent='addressee',argument='speaker',modal:ability='',negative=false,time='',question=false,polite=false}={}){
  let tree=event(predicate,agent,argument);
  if(ability) tree=modal(ability,tree);
  if(negative)tree=negate(tree);
  if(time)tree=when(tree,time);
  if(question)tree=ask(tree);
  if(polite)tree=please(tree);
  return tree;
}
export function analyze(tree){
  const state={question:false,polite:false,negative:false,time:null,modal:null,event:null};
  let node=tree;
  while(node){
    if(node.type==='please'){if(state.polite)fail('Duplicate PLEASE');state.polite=true;node=node.value; if(node?.type!=='ask')fail('PLEASE requires ASK');}
    else if(node.type==='ask'){state.question=true;node=node.value;}
    else if(node.type==='when'){state.time=node.time;node=node.value;}
    else if(node.type==='not'){state.negative=true;node=node.value;}
    else if(node.type==='modal'){state.modal=node.kind;node=node.value;}
    else if(node.type==='event'){state.event=node;node=null;}
    else fail(`Unknown AST node ${node.type}`);
  }
  if(!state.event)fail('Tree must contain an EVENT');
  return state;
}
export function notation(tree){
  if(tree.type==='event'){const sp=PREDICATES[tree.predicate];return `EVENT(${tree.predicate}, ${tree.agent}, ${tree[sp.slot]})`;}
  if(tree.type==='modal')return `${tree.kind.toUpperCase()}(${notation(tree.value)})`;
  if(tree.type==='not')return `NOT(${notation(tree.value)})`;
  if(tree.type==='when')return `WHEN(${notation(tree.value)}, ${tree.time})`;
  if(tree.type==='ask')return `ASK(${notation(tree.value)})`;
  if(tree.type==='please')return `PLEASE(${notation(tree.value)})`;
  throw new TypeError('Unknown AST');
}

