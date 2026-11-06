const fs=require('fs'),path=require('path');const assets=require('./asset_manifest.cjs')('.');
fs.mkdirSync('_site',{recursive:true});
const files=[...fs.readdirSync('.').filter(f=>/\.(html|js|css|pdf|json)$/.test(f)&&fs.statSync(f).isFile()),...assets];
let bytes=0;for(const p of new Set(files)){const target=path.join('_site',p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(p,target);bytes+=fs.statSync(p).size;}
fs.writeFileSync('_site/.nojekyll','');
if(bytes>1000*1024*1024)throw Error('Pages publication exceeds safe size limit: '+bytes);
console.log(JSON.stringify({stagedFiles:new Set(files).size,bytes}));
