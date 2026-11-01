import {ROLES,CONCEPTS,PREDICATES,OPERATORS,makeTree,notation} from './algebra.mjs';
import {languages} from './languages/index.mjs';
import {CAPABILITIES,deriveProfile} from './profile.mjs';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state={predicate:'help',agent:'addressee',argument:'speaker',modal:'can',negative:false,time:'',question:true,polite:false};
const selectedGoals=new Set(['assert','deny','ask','ability','request']);
const programs={
 assistance:{predicate:'help',agent:'addressee',argument:'speaker',modal:'can',negative:false,time:'',question:true,polite:true},
 information:{predicate:'understand',agent:'speaker',argument:'this',modal:'',negative:true,time:'',question:false,polite:false},
 movement:{predicate:'go',agent:'speaker',argument:'station',modal:'want',negative:false,time:'tomorrow',question:false,polite:false},
 possession:{predicate:'have',agent:'addressee',argument:'time',modal:'',negative:false,time:'',question:true,polite:false}
};
const options=(map,selected)=>Object.entries(map).map(([key,label])=>`<option value="${escape(key)}" ${key===selected?'selected':''}>${escape(label)}</option>`).join('');
function renderProfiles(){
  $('#capability-options').innerHTML=Object.entries(CAPABILITIES).map(([id,cap])=>`<label class="capability"><input type="checkbox" data-goal="${id}" ${selectedGoals.has(id)?'checked':''}><span><strong>${escape(cap.title)}</strong><small>${escape(cap.description)}</small></span></label>`).join('');
  const profile=deriveProfile([...selectedGoals]);
  $('#profile-count').textContent=`${profile.operators.length} / ${Object.keys(OPERATORS).length}`;
  $('#profile-ops').innerHTML=Object.keys(OPERATORS).map(op=>`<span class="operator-chip ${profile.operators.includes(op)?'included':'excluded'}">${op}</span>`).join('');
  $('#profile-goals').textContent=`${profile.goals.length} capabilities · ${profile.omitted.length} operators excluded`;
  $$('#capability-options input').forEach(input=>input.addEventListener('change',e=>{
    if(e.target.checked)selectedGoals.add(input.dataset.goal);
    else if(selectedGoals.size>1)selectedGoals.delete(input.dataset.goal);
    else {e.target.checked=true;return;}
    renderProfiles();
  }));
}
function renderReference(){
  $('#types-grid').innerHTML=[['Person','speaker · addressee','Participants rather than surface pronouns'],['Thing','help · ticket · time · this','Objects independent of grammatical gender'],['Place','home · station','Destinations; each language chooses its prepositions'],['Event','predicate + typed slots','Atomic meaning with agent and argument'],['Clause','event + operators','Modal, negative, temporal meaning'],['Question','ASK(clause)','An information-seeking speech act']].map(([name,ex,desc])=>`<article class="reference-item"><span class="type-icon">T</span><div><strong>${name}</strong><code>${ex}</code><p>${desc}</p></div></article>`).join('');
  $('#operators-list').innerHTML=Object.entries(OPERATORS).map(([name,signature])=>`<div class="operator-row"><code>${name}</code><span>${escape(signature)}</span></div>`).join('');
  $('#predicate-table').innerHTML=Object.entries(PREDICATES).map(([id,spec])=>`<tr><td><code>${id.toUpperCase()}</code></td><td>${escape(spec.description)}</td><td><code>${escape(spec.slot)}</code></td><td>${spec.values.map(x=>`<span class="mini-tag">${escape(x)}</span>`).join(' ')}</td></tr>`).join('');
  $('#adapter-cards').innerHTML=languages.map(l=>`<article class="adapter-card"><div class="adapter-header"><span class="dot"></span><div><h3>${escape(l.profile.name)}</h3><span>${escape(l.profile.region)}</span></div><code>${l.profile.code}</code></div><ul>${l.profile.features.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><div class="adapter-bottom"><span>6 predicates</span><span>7 operators</span><span>native realizer</span></div></article>`).join('');
}
function renderForm(){
 const e=PREDICATES[state.predicate];
 if(!e.values.includes(state.argument)||state.predicate==='help'&&state.agent===state.argument)state.argument=e.values.find(x=>state.predicate!=='help'||x!==state.agent);
 if(!e.modals.includes(state.modal))state.modal='';
 $('#predicate').innerHTML=options(Object.fromEntries(Object.entries(PREDICATES).map(([id,s])=>[id,id.toUpperCase()+' — '+s.description])),state.predicate);
 $('#agent').innerHTML=options(ROLES,state.agent);
 $('#argument-label').textContent=e.slot.replace(/^./,x=>x.toUpperCase());
 $('#argument').innerHTML=options(Object.fromEntries(e.values.filter(x=>state.predicate!=='help'||x!==state.agent).map(id=>[id,CONCEPTS[id]||ROLES[id]])),state.argument);
 $('#modal').innerHTML=options({'':'No modal',...Object.fromEntries(e.modals.map(x=>[x,x.toUpperCase()+'(event)']))},state.modal);
 $('#negative').checked=state.negative; $('#time').value=state.time;$('#question').checked=state.question;$('#polite').checked=state.polite;
 $('#polite').disabled=!state.question;
 $('#question-help').textContent=state.polite?'PLEASE wraps ASK; disabling ASK also removes PLEASE.':'Asking a question changes word order or punctuation by language.';
}
function renderOutput(){
 try{
  const tree=makeTree(state);
  const expression=notation(tree);
  $('#ast-view').textContent=expression;
  $('#ast-json').textContent=JSON.stringify(tree,null,2);
  $('#output-grid').innerHTML=languages.map(l=>`<article class="output-card"><div class="output-top"><span>${escape(l.profile.name)}</span><code>${l.profile.code}</code></div><p lang="${l.profile.code}">${escape(l.realize(tree))}</p><div class="output-foot">${escape(l.profile.features[0])}</div></article>`).join('');
  $('#status').className='status success';$('#status').textContent='Well-typed · supported by all 3 adapters';
 }catch(err){$('#status').className='status error';$('#status').textContent=err.message;$('#output-grid').innerHTML='';$('#ast-view').textContent='Invalid expression';$('#ast-json').textContent=String(err.message);}
}
function update(){renderForm();renderOutput();}
function bind(){
 $('#predicate').addEventListener('change',e=>{state.predicate=e.target.value;update();});
 $('#agent').addEventListener('change',e=>{state.agent=e.target.value;update();});
 $('#argument').addEventListener('change',e=>{state.argument=e.target.value;update();});
 $('#modal').addEventListener('change',e=>{state.modal=e.target.value;update();});
 $('#negative').addEventListener('change',e=>{state.negative=e.target.checked;update();});
 $('#time').addEventListener('change',e=>{state.time=e.target.value;update();});
 $('#question').addEventListener('change',e=>{state.question=e.target.checked;if(!state.question)state.polite=false;update();});
 $('#polite').addEventListener('change',e=>{state.polite=e.target.checked;update();});
 $$('.program').forEach(button=>button.addEventListener('click',()=>{Object.assign(state,programs[button.dataset.program]);update();$('#workbench').scrollIntoView({behavior:'smooth',block:'start'}); $$('.program').forEach(x=>x.classList.toggle('active',x===button));}));
 $('#copy-ast').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#ast-view').textContent);$('#copy-ast').textContent='Copied';setTimeout(()=>$('#copy-ast').textContent='Copy expression',1300);}catch{}});
 $$('.nav-link').forEach(link=>link.addEventListener('click',()=>{if(matchMedia('(max-width: 850px)').matches)$('#mobile-nav').checked=false;}));
}
renderProfiles();renderReference();update();bind();
