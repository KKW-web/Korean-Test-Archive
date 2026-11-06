const fs=require('fs'),path=require('path'),vm=require('vm');
module.exports=function(root){
 const c={window:{}},assets=new Set();for(const f of ['data.js','elective-data.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 function visit(x){if(typeof x==='string'&&/^(assets|clips|pages)\/[\w.-]+$/.test(x))assets.add(x);else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit);}
 visit(c.window.APP_DATA);visit(c.window.ELECTIVE_DATA);
 for(const data of [c.window.APP_DATA,c.window.ELECTIVE_DATA])for(const e of data.exams){
  for(const [k,field] of [['q','questionClips'],['a','explanationClips']])for(const s of e.sets)if(!s[field]?.length&&!s.answerUnavailable)for(const p of s[k==='q'?'questionPages':'explanationPages']||[])assets.add(`pages/${e.id}_${k}_${p}.webp`);
 }
 for(const f of fs.readdirSync(root))if(f.endsWith('.pdf'))assets.add(f);
 for(const p of assets)if(!fs.existsSync(path.join(root,p)))throw Error('Missing source asset '+p);
 return [...assets].sort();
};
