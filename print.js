'use strict';
(async()=>{
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let job;try{const hash=new URLSearchParams(location.hash.slice(1));job=hash.has('job')?JSON.parse(hash.get('job')):JSON.parse(localStorage.getItem(window.ARCHIVE_STORAGE_KEY('korean2028-print-job')));}catch{}
 const data=window.APP_DATA,sets=(data?.exams||[]).flatMap(exam=>exam.sets.map((s,i)=>({...s,exam,key:`${exam.id}::${i}`})));
 const chosen=[...new Set(job?.keys||[])].map(key=>sets.find(s=>s.key===key)).filter(Boolean);const failures=[];let pageNo=0;
 const nums=r=>{const n=String(r).match(/\d+/g)?.map(Number)||[];return n.length>1?Array.from({length:n[1]-n[0]+1},(_,i)=>n[0]+i):n;};
 const questions=window.ARCHIVE_QUESTIONS;
 function sheet(title,eyebrow,cls=''){const el=document.createElement('section');el.className='sheet '+cls;el.innerHTML=`<header class="sheet-head"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2></header><footer class="page-footer"><span>국어영역 기출 아카이브 · 원본 문항 번호 유지</span><span>${++pageNo}</span></footer>`;$('#sheets').append(el);return el;}
 function header(s,kind){return [s.title,`${s.exam.title} · ${s.range}번 · ${s.subLabel||s.area} · ${kind}`];}
 function imgLoad(src){return new Promise((resolve,reject)=>{const im=new Image();let timer=setTimeout(()=>{im.src='';reject(Error('이미지 응답 시간 초과'));},25000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(Error('이미지 파일을 찾을 수 없음'));};im.src=src;});}
 function clipPath(s,k,p){return `pages/${s.exam.id}_${k}_${p}.webp`;}
 function pieces(s,kind){const clips=s[kind==='q'?'questionClips':'explanationClips'];if(clips?.length)return clips.map(c=>typeof c==='string'?{src:c}:c);return (s[kind==='q'?'questionPages':'explanationPages']||[]).map(p=>({src:clipPath(s,kind,p),page:p,fullPage:true,fallback:true}));}
 async function renderOriginal(s,kind,shared){if(kind==='a'&&s.answerUnavailable){const p=sheet(...header(s,'별도 해설 안내'));const note=document.createElement('p');note.className='source-note';note.textContent='제공 폴더에 이 선택과목의 해설이 없어 해설 원문을 포함하지 않았습니다. 정답표는 포함되어 있습니다. 아카이브의 별도 해설 PDF 링크에서 확인하세요.';p.append(note);return;}const title=header(s,kind==='q'?'문제':'해설');let cols=null,col=0,used=0;
  function fresh(){const page=sheet(...title);cols=document.createElement('div');cols.className='columns';cols.innerHTML='<div class="column"></div><div class="column"></div>';page.append(cols);col=0;used=0;}
  for(const piece of pieces(s,kind)){
   if(shared?.has(piece.src))continue;if(shared)shared.add(piece.src);
   let im;try{im=await imgLoad(piece.src);}catch(e){failures.push(`${s.exam.title} ${s.range}번: ${piece.src} (${e.message})`);continue;}
   if(piece.fullPage||piece.fallback||(kind==='a'&&s.exam.id==='reference')){cols=null;const page=sheet(...title);if(piece.fallback){const n=document.createElement('p');n.className='source-note';n.textContent='원문 페이지 보존: 인접 문항이 함께 보일 수 있습니다.';page.append(n);}const box=document.createElement('div');box.className='full-original';box.append(im);page.append(box);continue;}
   if(!cols)fresh();const widthMM=90,capacity=246;
   const ratio=im.naturalHeight/im.naturalWidth;
   let drawWidth=widthMM,drawHeight=ratio*drawWidth;
   if(drawHeight>capacity-7){drawHeight=capacity-7;drawWidth=drawHeight/ratio;}
   if(used+drawHeight+7>capacity){if(col===0){col=1;used=0;}else fresh();}
   const fig=document.createElement('figure');fig.className='clip';fig.style.marginLeft='0';fig.style.marginRight='0';fig.innerHTML=`<figcaption class="clip-label">${kind==='q'?'문제':'해설'} · 원문 ${piece.page||''}쪽</figcaption>`;
   im.style.width=drawWidth+'mm';im.style.height=drawHeight+'mm';im.style.maxWidth='100%';fig.append(im);cols.children[col].append(fig);used+=drawHeight+7;

  }
 }
 function renderAnswers(){let body;chosen.forEach((s,i)=>{if(i%12===0){const p=sheet('선택 문항 정답표','공식 정답 · 원본 시험 번호 기준');const t=document.createElement('table');t.className='answer-table';t.innerHTML='<thead><tr><th>시험 · 영역</th><th>문항별 정답</th></tr></thead><tbody></tbody>';p.append(t);body=t.tBodies[0];}const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(s.exam.title)}<br>${esc(s.subLabel||s.area)} · ${esc(s.range)}번</td><td>${questions(s).map(q=>`<b>${q.number}</b> ${esc(q.answer)}`).join('　 ')}</td>`;body.append(tr);});}
 function analysis(s){const page=sheet(...header(s,'비교·출제 참고'));const el=document.createElement('div');el.className='analysis-content';el.innerHTML=`<h3>지문 개요</h3><p>${esc(s.summary)}</p><h3>평가 요소</h3><p>${esc((s.skills||[]).join?.(' · ')||s.skills)}</p><h3>출제 시 살펴볼 점</h3><p>${esc(s.designNote)}</p>${window.ARCHIVE_MODE==='elective'?'':'<h3>예시문항과의 비교</h3><p>'+esc(s.comparisonNote||'기준 예시문항입니다.')+'</p>'}<p class="source-note">문항 구조와 평가 기능의 유사성을 비교한 자료이며 직접 변형 관계를 뜻하지 않습니다.</p>`;page.append(el);}
 $('#returnBtn').onclick=()=>{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();}else location.href=window.ARCHIVE_URL(job?.source==='booklet'?'booklet.html':'index.html');};$('#printNow').onclick=()=>window.print();
 if(job?.source==='booklet')document.querySelector('#returnBtn').textContent='선택 자료 출력으로 돌아가기';
 if(!chosen.length){$('#progress').textContent='선택된 자료가 없습니다.';$('#errors').innerHTML='자료 탐색에서 자료를 인쇄 모음에 담은 뒤 다시 열어 주세요. <a href="index.html">자료 탐색으로 이동</a>';return;}
 const mode=['questions','answers','both'].includes(job.mode)?job.mode:'questions';document.title=(job.title||'국어 기출 자료집')+' · '+chosen.length+'묶음';
 if(job.cover){const page=sheet('선택 자료 안내','국어영역 기출 아카이브','cover');const el=document.createElement('div');el.innerHTML=`<h1>${esc(job.title||'국어 기출 자료집')}</h1><span class="section-tag">${chosen.length}묶음 · ${chosen.reduce((n,s)=>n+questions(s).length,0)}문항</span><p class="lead">${mode==='questions'?'문제편':mode==='answers'?'정답표':'문제 및 해설편'} · 원본 문항 번호 유지</p><p class="source-note">자료를 선택한 순서로 구성했습니다. 각 지문의 출처와 문항 범위를 해당 페이지 상단에 표시했습니다.</p><ol class="cover-list">${chosen.slice(0,12).map(s=>`<li>${esc(s.exam.title)} · ${esc(s.range)}번<br>${esc(s.title)}</li>`).join('')}</ol>${chosen.length>12?`<p>외 ${chosen.length-12}묶음. 각 자료의 출처는 본문에서 확인할 수 있습니다.</p>`:''}`;page.append(el);}
 if(mode!=='answers'){for(let i=0;i<chosen.length;i++){const s=chosen[i];$('#progress').textContent=`문제 ${i+1}/${chosen.length}묶음 준비 중…`;if(job.includeAnalysis)analysis(s);await renderOriginal(s,'q');await new Promise(r=>setTimeout(r,0));}}
 if(mode!=='questions'){renderAnswers();if(mode==='both'){const seen=new Set();for(let i=0;i<chosen.length;i++){$('#progress').textContent=`해설 ${i+1}/${chosen.length}묶음 준비 중…`;await renderOriginal(chosen[i],'a',seen);await new Promise(r=>setTimeout(r,0));}}}
 const imgs=[...document.images];await Promise.all(imgs.map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;})));
 if(failures.length){$('#errors').innerHTML='<b>일부 원문을 불러오지 못해 인쇄를 중단했습니다.</b><br>'+failures.map(esc).join('<br>')+'<br>압축을 모두 해제했는지 확인한 후 다시 열어 주세요.';$('#progress').textContent='원문 파일 확인이 필요합니다.';}else{$('#progress').textContent=`${chosen.length}묶음 · ${pageNo}쪽 준비 완료`;$('#printNow').disabled=false;}
 window.PRINT_READY=!failures.length;window.PRINT_RESULT={keys:chosen.map(s=>s.key),pageCount:pageNo,mode,failures};
})().catch(e=>{document.querySelector('#errors').textContent='자료집을 만들지 못했습니다: '+e.message;document.querySelector('#progress').textContent='오류가 발생했습니다.';});

