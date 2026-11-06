const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};for(const file of ['data.js','elective-data.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const common=ctx.window.APP_DATA,elective=ctx.window.ELECTIVE_DATA;
assert.equal(common.exams.length,10);assert.equal(common.exams.reduce((n,e)=>n+e.questions.length,0),450);
assert.equal(elective.exams.length,17);assert.equal(elective.exams.reduce((n,e)=>n+e.questions.length,0),952);
for(const e of elective.exams){
 assert.equal(e.questions.length,56);assert.equal(new Set(e.questions.map(q=>q.subject+':'+q.number)).size,56);
 for(const [subject,start,end] of [['common',1,34],['speech',35,45],['language',35,45]]){
  const qs=e.questions.filter(q=>q.subject===subject);assert.equal(qs.length,end-start+1);
  for(let n=start;n<=end;n++)assert.equal(qs.filter(q=>q.number===n).length,1);
  const assigned=[];for(const s of e.sets.filter(s=>s.subject===subject)){
   const ns=s.range.match(/\d+/g).map(Number);for(let n=ns[0];n<=ns[ns.length-1];n++)assigned.push(n);
   assert(s.questionClips.length);if(!s.answerUnavailable)assert(s.explanationClips.length);
   else assert(s.externalExplanation.startsWith('https://'));
   for(const c of [...s.questionClips,...s.explanationClips]){assert(fs.existsSync(c.src),c.src);const b=c.bboxPdf;if(b)assert(b[2]>b[0]&&b[3]>b[1],c.src);}
  }assert.deepEqual(assigned,[...qs].sort((a,b)=>a.number-b.number).map(q=>q.number));
 }
 for(const q of e.questions)assert(Number.isInteger(q.answer)&&q.answer>=1&&q.answer<=5);
 assert(fs.existsSync(e.questionFile));assert(fs.existsSync(e.explanationFile));
}
for(const f of ['app.js','reader.js','print.js','archive-mode.js'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
console.log(JSON.stringify({common:{exams:10,questions:450},elective:{exams:17,questions:952,sets:elective.exams.reduce((n,e)=>n+e.sets.length,0)},verified:true}));
