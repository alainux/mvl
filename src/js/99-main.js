function render(){document.documentElement.dataset.theme=state.theme;$('#sidebar').innerHTML=navMarkup();$('#sidebar').classList.toggle('open',state.menu);$('#backdrop').classList.toggle('open',state.menu);let pages={home,recipes:recipesPage,grammar:grammarPage,situations:scenarioPage,builder:builderPage,phrases:phrasesPage,practice:practicePage,blocks:blocksPage,notes:notesPage,plan:planPage,cheat:cheatPage};$('#view').innerHTML=(state.q.trim()?searchPage:(pages[state.section]||home))();document.title=(state.q?'Search':navItems.find(x=>x[0]===state.section)?.[1]||'Manual')+' · Minimum Viable German'}
function route(section,topic=''){state.q='';$('#globalSearch').value='';state.section=section;state.topic=topic;state.menu=false;location.hash=section+(topic?'/'+topic:'');render();window.scrollTo({top:0,behavior:'instant'})}
function parseHash(){let bits=decodeURIComponent(location.hash.replace(/^#/,'' )).split('/');if(navItems.some(x=>x[0]===bits[0])){state.section=bits[0];state.topic=bits[1]||''}}
function saveNote(key,value){state.notes[key]=value;store('notes',state.notes)}
function toggleSaved(id){const i=state.saved.indexOf(id);if(i>=0){state.saved.splice(i,1);toast('Removed from saved pages')}else{state.saved.push(id);toast('Saved to your shelf')}store('bookmarks',state.saved);render()}
async function copyText(t){try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(t)}else{const e=document.createElement('textarea');e.value=t;e.style.position='fixed';e.style.left='-9999px';document.body.append(e);e.select();if(!document.execCommand('copy'))throw new Error('copy');e.remove()}toast('Copied German sentence')}catch(e){toast('Copy unavailable; select the sentence and copy it manually')}}
function nextQuiz(){if(state.quizIndex>=D.quiz.length-1){state.quizIndex=0;state.quizAnswer=null;state.quizAnswered=0;state.quizScore=0;state.quizOrder=D.quiz.map((_,i)=>i);shuffle(state.quizOrder)}else{state.quizIndex++;state.quizAnswer=null}render()}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function exportNotes(){let lines=['# Minimum Viable German · My Notes','',`Saved page count: ${state.saved.length}`,''];for(const id of state.saved){let name=D.recipes.find(x=>x.id===id)?.title || D.grammar.find(x=>'g:'+x.id===id)?.title || D.scenarios.find(x=>'s:'+x.id===id)?.title || id;lines.push('- '+name)}lines.push('','## Personal notes','');for(const [key,value] of Object.entries(state.notes)){if(!String(value).trim())continue;lines.push('### '+key,'',String(value),'')}const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='minimum-viable-german-notes.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Notes exported')}
document.addEventListener('click',e=>{
 let el=e.target.closest('[data-route]');if(el){route(el.dataset.route,el.dataset.topic||'');return}
 el=e.target.closest('[data-copy]');if(el){copyText(el.dataset.copy);return}
 el=e.target.closest('[data-save]');if(el){toggleSaved(el.dataset.save);return}
 el=e.target.closest('[data-category]');if(el){state.phraseCategory=el.dataset.category;render();return}
 el=e.target.closest('[data-mode]');if(el){state.practiceMode=el.dataset.mode;render();return}
 el=e.target.closest('[data-quiz-answer]');if(el&&state.quizAnswer===null){state.quizAnswer=Number(el.dataset.quizAnswer);state.quizAnswered++;if(state.quizAnswer===D.quiz[state.quizOrder[state.quizIndex]].correct)state.quizScore++;render();return}
 if(e.target.closest('[data-quiz-next]')){nextQuiz();return}
 if(e.target.closest('[data-quiz-reset]')){state.quizIndex=0;state.quizAnswer=null;state.quizScore=0;state.quizAnswered=0;shuffle(state.quizOrder);render();return}
 if(e.target.closest('[data-write-reveal]')){state.writeReveal=!state.writeReveal;render();return}
 if(e.target.closest('[data-write-next]')){state.writeIndex=(state.writeIndex+1)%D.writing.length;state.writeReveal=false;state.writeInput='';render();return}
 el=e.target.closest('[data-write-mark]');if(el){state.writeScores[state.writeIndex]=el.dataset.writeMark;store('writeScores',state.writeScores);state.writeIndex=(state.writeIndex+1)%D.writing.length;state.writeReveal=false;state.writeInput='';render();toast('Self-check saved');return}
 if(e.target.closest('[data-theme-toggle]')){state.theme=state.theme==='light'?'dark':'light';store('theme',state.theme);render();return}
 if(e.target.closest('[data-export]')){exportNotes();return}
 if(e.target.closest('[data-print]')){state.section='cheat';state.topic='';state.q='';$('#globalSearch').value='';render();requestAnimationFrame(()=>window.print());return}
});
document.addEventListener('input',e=>{
 if(e.target.matches('[data-note]'))saveNote(e.target.dataset.note,e.target.value);
 if(e.target.matches('[data-write-input]'))state.writeInput=e.target.value;
});
document.addEventListener('change',e=>{
 if(e.target.matches('[data-builder-intent]')){state.builderIntent=e.target.value;state.builderChoice=0;render()}
 if(e.target.matches('[data-builder-choice]')){state.builderChoice=Number(e.target.value);render()}
 if(e.target.matches('[data-builder-polite]')){state.builderPolite=e.target.checked;render()}
 if(e.target.matches('[data-block-intent]')){state.blockChoice=0;route('blocks',e.target.value)}
 if(e.target.matches('[data-block-language]')){state.blockLanguage=e.target.value;store('blockLanguage',state.blockLanguage);render()}
 if(e.target.matches('[data-block-choice]')){state.blockChoice=Number(e.target.value);render()}
 if(e.target.matches('[data-check]')){let key=e.target.dataset.check;if(e.target.checked&&!state.completed.includes(key))state.completed.push(key);if(!e.target.checked)state.completed=state.completed.filter(x=>x!==key);store('completed',state.completed);render()}
});
$('#mobileMenu').addEventListener('click',()=>{state.menu=!state.menu;render()});
$('#backdrop').addEventListener('click',()=>{state.menu=false;render()});
$('#globalSearch').addEventListener('input',e=>{state.q=e.target.value;render()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus();$('#globalSearch').select()}if(e.key==='Escape'){if(state.menu){state.menu=false;render()}else if(state.q){state.q='';$('#globalSearch').value='';render();$('#globalSearch').blur()}}});
window.addEventListener('hashchange',()=>{if(state.q)return;parseHash();render()});
parseHash();render();
