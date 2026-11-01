/** Profiles derive a minimum *operator dependency closure*, not an empirically optimal lexicon. */
export const OPERATOR_DEPENDENCIES=Object.freeze({
 EVENT:[],CAN:['EVENT'],WANT:['EVENT'],NOT:['EVENT'],WHEN:['EVENT'],ASK:['EVENT'],PLEASE:['ASK']
});
export const CAPABILITIES=Object.freeze({
 assert:{title:'Describe a situation',description:'Express a basic fact or event',operators:['EVENT']},
 deny:{title:'Deny a proposition',description:'Express that something is not the case',operators:['NOT']},
 ask:{title:'Seek confirmation',description:'Ask whether something is the case',operators:['ASK']},
 ability:{title:'Express ability',description:'Say whether someone can do something',operators:['CAN']},
 desire:{title:'Express desire',description:'Say what someone wants to do',operators:['WANT']},
 situate:{title:'Situate in time',description:'Locate an event in the present or near future',operators:['WHEN']},
 request:{title:'Polite help request',description:'Ask a person politely whether they can help',operators:['CAN','ASK','PLEASE']}
});
export function deriveProfile(goals){
 if(!Array.isArray(goals)||goals.length===0)throw new TypeError('Select at least one communicative capability');
 const required=new Set();
 function add(operator){
  if(!Object.hasOwn(OPERATOR_DEPENDENCIES,operator))throw new TypeError(`Unknown operator ${operator}`);
  for(const dep of OPERATOR_DEPENDENCIES[operator])add(dep);
  required.add(operator);
 }
 for(const id of goals){
  const cap=CAPABILITIES[id];if(!cap)throw new TypeError(`Unknown capability: ${id}`);
  for(const op of cap.operators)add(op);
 }
 const operators=Object.keys(OPERATOR_DEPENDENCIES).filter(op=>required.has(op));
 return Object.freeze({goals:[...new Set(goals)],operators,omitted:Object.keys(OPERATOR_DEPENDENCIES).filter(op=>!required.has(op))});
}
