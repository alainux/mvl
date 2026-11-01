// MVL pilot: shared goals have independently curated realizations in each language.
function renderBlock(pack, id, choice) {
 const rule=pack.realizations[id];
 const entry=Object.entries(rule.slots||{})[0];
 const options=entry?entry[1]:[];
 const value=options[choice]||options[0];
 return {rule,options,key:entry?entry[0]:null,text:rule.pattern.replace(/\{([a-z]+)\}/g,(_,name)=>(entry&&name===entry[0]&&value)?value.value:"…")};
}
function blocksPage(){
 const f=D.framework;
 const intent=f.intents.find(x=>x.id===state.topic)||f.intents[0];
 const lang=f.languages.find(x=>x.code===state.blockLanguage)||f.languages[0];
 const current=renderBlock(lang,intent.id,state.blockChoice);
 let result=head("Framework / language blocks","Language-independent intentions","One communication goal, multiple grammatical implementations. These are curated templates, not machine translation.");
 result+='<div class="panel block-intro"><div><div class="snippet-title">SHARED INTENT</div><h2 class="block-code code">'+esc(intent.id.toUpperCase())+'</h2><p>'+esc(intent.canDo)+'</p></div><span class="badge">'+esc(intent.category)+'</span></div>';
 result+='<div class="builder-controls section-gap"><div><label class="form-label" for="blockIntent">1 · COMMUNICATION GOAL</label><select id="blockIntent" data-block-intent>'+f.intents.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===intent.id?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></div>';
 result+='<div><label class="form-label" for="blockLang">2 · LANGUAGE</label><select id="blockLang" data-block-language>'+f.languages.map(x=>'<option value="'+esc(x.code)+'" '+(x.code===lang.code?'selected':'')+'>'+esc(x.name)+' — '+esc(x.variety)+'</option>').join('')+'</select></div></div>';
 if(current.options.length)result+='<div class="block-slot"><label class="form-label" for="blockChoice">3 · CHOOSE A SAFE SUBSTITUTE</label><select id="blockChoice" data-block-choice>'+current.options.map((x,i)=>'<option value="'+i+'" '+(i===state.blockChoice?'selected':'')+'>'+esc(x.value)+' — '+esc(x.gloss)+'</option>').join('')+'</select></div>';
 result+='<div class="builder-output"><div class="snippet-title">EXAMPLE · '+esc(lang.name.toUpperCase())+'</div><div class="builder-sentence" lang="'+esc(lang.htmlLang)+'">'+esc(current.text)+'</div><div class="builder-translation">Template: <code>'+esc(current.rule.pattern)+'</code></div><div class="builder-opts">'+copyButton(current.text,'Copy sentence')+'</div><p>'+esc(current.rule.usage)+'</p><p class="micro">'+esc(lang.editorialNote)+'</p></div>';
 result+='<section class="section-gap"><h2>The same goal, different grammars</h2><div class="grid cols-2">'+f.languages.filter(x=>x.code!==lang.code).map(x=>{const v=renderBlock(x,intent.id,state.blockChoice);return '<div class="panel"><span class="badge">'+esc(x.name)+'</span><h3 lang="'+esc(x.htmlLang)+'">'+esc(v.text)+'</h3><p class="micro">'+esc(v.rule.usage)+'</p></div>';}).join('')+'<div class="panel"><span class="badge">DESIGN RULE</span><h3>Shared meaning ≠ shared word order</h3><p class="micro">Each language owns its natural grammar, register, agreement, and safe phrase substitutions. Only the communication goal is shared.</p></div></div></section>';
 result+='<section class="section-gap panel"><h3>A pilot, not a complete language course</h3><p>The original German reference includes grammar, conversations and exercises. The other languages currently demonstrate the shared block architecture only.</p></section>';
 return result+foot();
}
