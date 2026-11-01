'use strict';
const D = JSON.parse(document.getElementById('mvgData').textContent);
const $ = q => document.querySelector(q);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = (key, fallback) => {try{const v=localStorage.getItem('mvg-v1-'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}};
const store = (key,val) => {try{localStorage.setItem('mvg-v1-'+key,JSON.stringify(val))}catch(e){}};
const savedNotes = read('notes', {});
const state = {
 section:'home', topic:'', q:'', menu:false,
 notes: savedNotes && typeof savedNotes==='object' ? savedNotes : {},
 saved: read('bookmarks',[]), completed:read('completed',[]),
 theme:read('theme','light'), phraseCategory:'All',
 builderIntent:'need',builderChoice:0,builderPolite:false,
 blockLanguage:read('blockLanguage','de'),blockChoice:0,
 practiceMode:'choice',quizOrder:D.quiz.map((_,i)=>i),quizIndex:0,quizAnswer:null,quizScore:0,quizAnswered:0,
 writeIndex:0,writeReveal:false,writeInput:'',writeScores:read('writeScores',{}),
};
if (!Array.isArray(state.saved)) state.saved=[];
if (!Array.isArray(state.completed)) state.completed=[];
document.documentElement.dataset.theme=state.theme;
let toastTimer;
function toast(message){const e=$('#toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
const navItems=[['home','Overview','⌂'],['recipes','Sentence recipes','{}'],['grammar','10 core rules','≡'],['situations','Real-life situations','↗'],['builder','Sentence builder','＋'],['blocks','Language blocks','⊞'],['phrases','Phrase library','“'],['practice','Practice lab','✓'],['notes','My notes & saved','✎'],['plan','Study roadmap','◷'],['cheat','Printable cheat sheet','▤']];
