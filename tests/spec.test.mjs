import test from 'node:test';
import assert from 'node:assert/strict';
import {PREDICATES,OPERATORS,event,modal,makeTree,notation,analyze} from '../src/algebra.mjs';
import {languages,linearize} from '../src/languages/index.mjs';
import {deriveProfile,CAPABILITIES} from '../src/profile.mjs';

test('grammar is small and interfaces conform',()=>{
 assert.equal(Object.keys(PREDICATES).length,6);
 assert.equal(Object.keys(OPERATORS).length,7);
 assert.deepEqual(languages.map(x=>x.profile.code),['de','fr','es']);
 for(const l of languages){assert.equal(typeof l.realize,'function'); assert.ok(l.profile.features.length>=4);}
});
test('typed core rejects invalid operations and slots',()=>{
 assert.throws(()=>event('need','speaker','station'),/requires/);
 assert.throws(()=>event('help','speaker','speaker'),/differ/);
 assert.throws(()=>modal('can',event('have','speaker','time')),/not supported/);
 assert.throws(()=>makeTree({predicate:'help',agent:'addressee',argument:'speaker',polite:true}),/PLEASE requires/);
 assert.throws(()=>event('madeup','speaker','help'),/Unknown/);
});
test('syntax tree has no language-specific vocabulary',()=>{
 const tree=makeTree({predicate:'help',agent:'addressee',argument:'speaker',modal:'can',question:true,polite:true});
 assert.equal(notation(tree),'PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))');
 assert.equal(analyze(tree).event.predicate,'help');
 assert.doesNotMatch(JSON.stringify(tree),/Sie|vous|usted|helfen/);
});
const cases=[
 [{predicate:'help',agent:'addressee',argument:'speaker',modal:'can',question:true},['Können Sie mir helfen?','Est-ce que vous pouvez m’aider ?','¿Usted puede ayudarme?']],
 [{predicate:'need',agent:'speaker',argument:'help'},['Ich brauche Hilfe.','J’ai besoin d’aide.','Necesito ayuda.']],
 [{predicate:'understand',agent:'speaker',argument:'this',negative:true},['Ich verstehe das nicht.','Je ne comprends pas ça.','No entiendo esto.']],
 [{predicate:'go',agent:'speaker',argument:'station',modal:'want',time:'tomorrow'},['Ich will morgen zum Bahnhof gehen.','Je veux aller à la gare demain.','Quiero ir a la estación mañana.']],
 [{predicate:'have',agent:'addressee',argument:'time',negative:true,question:true},['Haben Sie keine Zeit?','Est-ce que vous n’avez pas le temps ?','¿Usted no tiene tiempo?']],
 [{predicate:'help',agent:'addressee',argument:'speaker',modal:'can',question:true,polite:true},['Können Sie mir bitte helfen?','Est-ce que vous pouvez m’aider, s’il vous plaît ?','¿Usted puede ayudarme, por favor?']],
 [{predicate:'buy',agent:'speaker',argument:'ticket',negative:true},['Ich kaufe kein Ticket.','Je n’achète pas de billet.','No compro un billete.']],
 [{predicate:'help',agent:'speaker',argument:'addressee'},['Ich helfe Ihnen.','Je vous aide.','Le ayudo.']],
 [{predicate:'help',agent:'addressee',argument:'speaker',negative:true},['Sie helfen mir nicht.','Vous ne m’aidez pas.','Usted no me ayuda.']]
];
for(const [cfg,results] of cases){test(`golden realization: ${JSON.stringify(cfg)}`,()=>{
 const tree=makeTree(cfg);
 assert.deepEqual(languages.map(x=>x.realize(tree)),results);
});}
test('shared AST generation matrix: every allowed combination works in 3 languages',()=>{
 let count=0;
 for(const [predicate,spec] of Object.entries(PREDICATES))for(const agent of ['speaker','addressee'])for(const argument of spec.values){
  if(predicate==='help'&&agent===argument)continue;
  for(const mode of ['',...spec.modals])for(const negative of [false,true])for(const question of [false,true])for(const time of ['','today','tomorrow']){
    const tree=makeTree({predicate,agent,argument,modal:mode,negative,question,time});
    for(const lang of languages){const result=lang.realize(tree);assert.ok(result.length>4,lang.profile.code);assert.doesNotMatch(result,/undefined|null|  /);assert.match(result,/^[A-ZÄÖÜÉ¿J]/);assert.match(result,question?/\?$/:/\.$/);count++;}
  }
 }
 assert.ok(count>=400);
});

test('profile derivation computes the smallest required operator closure',()=>{
  assert.deepEqual(deriveProfile(['assert']).operators,['EVENT']);
  assert.deepEqual(deriveProfile(['request']).operators,['EVENT','CAN','ASK','PLEASE']);
  assert.deepEqual(deriveProfile(['ask','deny','situate']).operators,['EVENT','NOT','WHEN','ASK']);
  assert.equal(Object.keys(CAPABILITIES).length,7);
  assert.throws(()=>deriveProfile([]),/Select at least/);
  assert.throws(()=>deriveProfile(['made-up-goal']),/Unknown capability/);
});
