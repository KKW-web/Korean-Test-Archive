'use strict';
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='korean2028-booklet-draft',read=(k,f)=>{try{return JSON.parse(localStorage.getItem(window.ARCHIVE_STORAGE_KEY(k)))??f;}catch{return f;}};
const defaults=()=>({source:'all',query:'',grade:'',exams:[],areas:[],subs:[],includeMixed:true,excluded:[],sort:'exam',title:'국어 기출 자료집',mode:'both',cover:true,includeAnalysis:false});
let state={...defaults(),...read(KEY,{})};const data=window.APP_DATA,exams=data?.exams||[];
if(!exams.length){$('#bookletError').hidden=false;$('#bookletError').textContent='자료를 불러오지 못했습니다. 파일 묶음을 모두 압축 해제한 뒤 다시 열어 주세요.';$('#bookletPreview').disabled=true;return;}
const groups=[['문학',['현대시','현대소설','고전시가','고전산문','수필','극'],'literature'],['독서',['인문','사회','과학','기술','예술'],'reading'],['화법',['토의','협상','토론'],'speech'],['작문',[],'writing'],['언어',['문법'],'language']];
const sets=exams.flatMap((exam,ei)=>exam.sets.map((s,index)=>({...s,key:`${exam.id}::${index}`,exam,index,ei}))),parts=s=>String(s.area).split(/[·+]/).map(v=>v.trim()),subs=s=>s.subcategories||[],isRef=e=>e.id==='reference',grade=e=>isRef(e)?'reference':String(e.grade||e.id.match(/_(\d)$/)?.[1]||''),combined=s=>s.isComposite||parts(s).length>1;
const range=s=>{const n=String(s.range).match(/\d+/g)?.map(Number)||[];return n.length===1?n:Array.from({length:Math.max(0,(n[1]||0)-(n[0]||0)+1)},(_,i)=>n[0]+i);};
const qCount=s=>(s.exam.questions||[]).filter(q=>range(s).includes(Number(q.number))).length;
const parent=sub=>groups.find(g=>g[1].includes(sub))?.[0];
for(const field of ['exams','areas','subs','excluded'])if(!Array.isArray(state[field]))state[field]=[];
if(!['all','favorites','collection'].includes(state.source))state.source='all';
if(!['both','questions','answers'].includes(state.mode))state.mode='both';
if(!['exam','latest','title'].includes(state.sort))state.sort='exam';
const sourceKeys=()=>state.source==='all'?null:read(state.source==='favorites'?'korean2028-bookmarks':'korean2028-collection',[]);
function found(){const source=sourceKeys(),terms=String(state.query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let list=sets.filter(s=>{
 if(source&&!source.includes(s.key))return false;
 if(state.exams.length&&!state.exams.includes(s.exam.id))return false;
 if(state.grade&&grade(s.exam)!==state.grade)return false;
 if((state.areas.length||state.subs.length)&&!state.areas.some(a=>parts(s).includes(a))&&!state.subs.some(t=>subs(s).includes(t)))return false;
 if(!state.includeMixed&&combined(s))return false;
 const corpus=[s.title,s.summary,s.area,s.subLabel,...subs(s),s.exam.title,...(s.exam.questions||[]).filter(q=>range(s).includes(Number(q.number))).map(q=>q.stem)].join(' ').toLocaleLowerCase();return terms.every(t=>corpus.includes(t));
 });if(state.sort==='latest')list.sort((a,b)=>Number(isRef(a.exam))-Number(isRef(b.exam))||b.exam.id.localeCompare(a.exam.id)||a.index-b.index);else if(state.sort==='title')list.sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko')||a.ei-b.ei||a.index-b.index);return list;}
const selected=list=>list.filter(s=>!state.excluded.includes(s.key));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function controls(){
 $$('[name=bookletSource]').forEach(el=>el.checked=el.value===state.source);$$('[name=bookletMode]').forEach(el=>el.checked=el.value===state.mode);
 for(const [id,key] of [['bookletQuery','query'],['bookletGrade','grade'],['bookletTitle','title'],['bookletSort','sort']])$( '#'+id).value=state[key];
 $('#bookletMixed').checked=state.includeMixed;$('#bookletCover').checked=state.cover;$('#bookletAnalysis').checked=state.includeAnalysis;
 $('#bookletAreas').innerHTML=groups.map(([area,,tone])=>`<button class="area-button ${tone}" data-booklet-area="${area}" aria-pressed="${state.areas.includes(area)}">${area}</button>`).join('');
 const activeGroups=groups.filter(([a,ss])=>state.areas.includes(a)||ss.some(t=>state.subs.includes(t)));
 $('#bookletSubs').innerHTML=activeGroups.map(([a,ss,tone])=>`<div class="subgroup ${tone}"><h3>${a} 세부 분류</h3>${ss.length?`<div class="sub-options">${ss.map(s=>`<button data-booklet-sub="${s}" aria-pressed="${state.subs.includes(s)}">${s}</button>`).join('')}</div>`:'<p class="help">작문 전체를 선택했습니다. 시험·검색 조건으로 자료를 더 좁힐 수 있습니다.</p>'}</div>`).join('');
 $('#bookletExams').innerHTML=exams.map(e=>`<label><input type="checkbox" data-booklet-exam="${esc(e.id)}" ${state.exams.includes(e.id)?'checked':''}><span>${esc(isRef(e)?'예시문항(28학년도)':e.title)}</span></label>`).join('');
 $('#examChoiceSummary').textContent=state.exams.length?`${state.exams.length}개 선택`:'전체 시험 · 예시문항 포함';
 $('#sourceHint').textContent=state.source==='all'?'전체 자료에는 28학년도 예시문항과 기출 시험이 함께 포함됩니다.':state.source==='favorites'?'아카이브에서 별표로 저장한 지문 묶음 안에서 찾습니다.':'아카이브의 인쇄모음에 담은 지문 묶음 안에서 찾습니다.';
 $('#bookletAnalysis').disabled=state.mode==='answers';$('#analysisHint').textContent=state.mode==='answers'?'정답표만 출력할 때는 비교·출제 분석을 넣지 않습니다.':'분석은 선택한 지문의 출제 참고 자료입니다.';
}
function renderResults(){const list=found(),chosen=selected(list),n=chosen.reduce((v,s)=>v+qCount(s),0),examCount=new Set(chosen.map(s=>s.exam.id)).size;
 $('#bookletResultCount').textContent=`검색 결과 ${list.length}묶음 중 ${chosen.length}묶음 · ${n}문항 선택`;
 $('#bookletSelectAll').disabled=!list.length||chosen.length===list.length;$('#bookletSelectNone').disabled=!chosen.length;
 $('#bookletResults').innerHTML=list.length?list.map(s=>{const checked=!state.excluded.includes(s.key);return `<div class="booklet-item ${checked?'':'excluded'}"><input type="checkbox" data-booklet-select="${esc(s.key)}" ${checked?'checked':''} aria-label="${esc(s.exam.title+' '+s.range+'번 '+s.title)} 출력 선택"><div><small>${esc(isRef(s.exam)?'예시문항(28학년도)':s.exam.title)} · ${esc(s.range)}번 · ${qCount(s)}문항</small><h3><button class="card-reader-title" data-booklet-open="${esc(s.key)}">${esc(s.title)}</button></h3><div class="item-meta">${esc(parts(s).length>1?parts(s).join(' + '):s.area+' · '+(s.subLabel||subs(s).join(' + ')))}${s.isComposite?' · 갈래 복합':parts(s).length>1?' · 영역 통합':''}</div><button class="booklet-read-button" data-booklet-open="${esc(s.key)}">문제·해설 보기</button></div></div>`;}).join(''):`<div class="empty"><h3>조건에 맞는 자료가 없습니다.</h3><p>${state.source==='all'?'시험·영역·검색어 조건을 줄여 보세요.':'저장된 자료가 있는지 확인하거나 전체 자료에서 찾아보세요.'}</p></div>`;
 $('#bookletSummary').innerHTML=`<div class="summary-count"><strong>${n}</strong><span>문항</span></div><div class="summary-detail">${examCount}개 시험 · ${chosen.length}묶음</div><div class="summary-detail">${{both:'문제 + 정답·해설',questions:'문제만',answers:'정답표만'}[state.mode]}${state.cover?' · 표지 포함':''}</div>`;
 $('#bookletPreview').disabled=!chosen.length;$('#bookletPreview').textContent=chosen.length?`${chosen.length}묶음 인쇄·PDF 미리보기`:'출력할 자료를 선택하세요';
}
function update({filters=false,refresh=true}={}){if(filters)state.excluded=[];save();if(refresh)controls();renderResults();$('#bookletNotice').textContent='';}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.bookletOpen){window.ArchiveReader?.open(b.dataset.bookletOpen);return;}
 if(b.dataset.bookletArea){const area=b.dataset.bookletArea,on=state.areas.includes(area);state.areas=state.areas.filter(a=>a!==area);state.subs=state.subs.filter(s=>parent(s)!==area);if(!on)state.areas.push(area);update({filters:true});document.querySelector(`[data-booklet-area="${area}"]`)?.focus({preventScroll:true});}
 if(b.dataset.bookletSub){const sub=b.dataset.bookletSub,on=state.subs.includes(sub);state.areas=state.areas.filter(a=>a!==parent(sub));state.subs=state.subs.filter(s=>s!==sub);if(!on)state.subs.push(sub);update({filters:true});document.querySelector(`[data-booklet-sub="${sub}"]`)?.focus({preventScroll:true});}
 if(b.id==='bookletAllExams'){state.exams=[];update({filters:true});}
 if(b.id==='clearBookletFilters'){const old=state;state={...defaults(),source:old.source,title:old.title,mode:old.mode,cover:old.cover,includeAnalysis:old.includeAnalysis,sort:old.sort};update();}
 if(b.id==='resetBooklet'){state=defaults();update();}
 if(b.id==='bookletSelectAll'){state.excluded=[];update({refresh:false});}
 if(b.id==='bookletSelectNone'){state.excluded=found().map(s=>s.key);update({refresh:false});}
 if(b.id==='bookletPreview')preview();
});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.bookletExam){state.exams=t.checked?[...new Set([...state.exams,t.dataset.bookletExam])]:state.exams.filter(x=>x!==t.dataset.bookletExam);update({filters:true});}
 if(t.dataset.bookletSelect){state.excluded=t.checked?state.excluded.filter(x=>x!==t.dataset.bookletSelect):[...new Set([...state.excluded,t.dataset.bookletSelect])];update({refresh:false});document.querySelector(`[data-booklet-select="${t.dataset.bookletSelect}"]`)?.focus({preventScroll:true});}
 if(t.name==='bookletSource'){state.source=t.value;update({filters:true});}
 if(t.name==='bookletMode'){state.mode=t.value;update();}
 if(t.id==='bookletGrade'){state.grade=t.value;update({filters:true});}
 if(t.id==='bookletMixed'){state.includeMixed=t.checked;update({filters:true});}
 if(t.id==='bookletSort'){state.sort=t.value;update({refresh:false});}
 if(t.id==='bookletCover'||t.id==='bookletAnalysis'){state[t.id==='bookletCover'?'cover':'includeAnalysis']=t.checked;update({refresh:false});}
});
$('#bookletQuery').addEventListener('input',e=>{state.query=e.target.value;update({filters:true,refresh:false});});
$('#bookletTitle').addEventListener('input',e=>{state.title=e.target.value;save();});
window.addEventListener('storage',e=>{if(['korean2028-bookmarks','korean2028-collection'].includes(e.key))renderResults();});
function preview(){const chosen=selected(found());if(!chosen.length)return;const job={archive:window.ARCHIVE_MODE,source:'booklet',keys:chosen.map(s=>s.key),mode:state.mode,title:String(state.title).trim()||'국어 기출 자료집',cover:state.cover,includeAnalysis:state.mode!=='answers'&&state.includeAnalysis};try{localStorage.setItem(window.ARCHIVE_STORAGE_KEY('korean2028-print-job'),JSON.stringify(job));}catch{}save();const popup=window.open(window.ARCHIVE_URL('print.html')+'#job='+encodeURIComponent(JSON.stringify(job)),'_blank');if(!popup)$('#bookletNotice').textContent='미리보기 창이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.';}
controls();renderResults();save();
})();

