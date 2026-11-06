const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(process.argv[2]||'github-archive'),out=path.resolve(process.argv[3]||'deliverables/korean_exam_archive.html');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
function inline(name){return read(name).replace(/<link[^>]+href="([^"?]+)(?:\?[^"]*)?"[^>]*>/g,(m,f)=>f.endsWith('.css')?'<style>'+read(f)+'</style>':m).replace(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g,(m,f)=>'<script>'+read(f).replace(/<\/script/gi,'<\\/script')+'</script>');}
const assets={};for(const dir of ['assets','clips','pages'])for(const f of fs.readdirSync(path.join(root,dir))){const p=dir+'/'+f;assets[p]=fs.readFileSync(path.join(root,p)).toString('base64');}
for(const f of ['analysis_report.pdf','modern_poetry_questions_answers.pdf','modern_poetry_theory_analysis.pdf'])if(fs.existsSync(path.join(root,f)))assets[f]=fs.readFileSync(path.join(root,f)).toString('base64');
const runtime=function(){
 const shared=window.opener?.ARCHIVE_OFFLINE;const payload=shared||JSON.parse(document.getElementById('offline-assets').textContent);window.ARCHIVE_OFFLINE=payload;const urls=shared?.urls||{};payload.urls=urls;
 function resolve(p){if(!p)return p;const clean=p.split('#')[0].split('?')[0].replace(/^\.\//,'');if(!payload.assets[clean])return p;if(!urls[clean]){let s=atob(payload.assets[clean]),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);urls[clean]=URL.createObjectURL(new Blob([b],{type:clean.endsWith('.webp')?'image/webp':clean.endsWith('.pdf')?'application/pdf':'application/octet-stream'}));}return urls[clean]+(p.includes('#')?'#'+p.split('#').slice(1).join('#'):'');}
 const rewrite=s=>String(s).replace(/\b(src|href)="([^"]+)"/g,(m,k,p)=>k+'="'+resolve(p)+'"');
 const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{...desc,set(v){desc.set.call(this,rewrite(v));}});
 const set=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){return set.call(this,k,/^(src|href)$/i.test(k)?resolve(String(v)):v);};
 for(const [proto,key] of [[HTMLImageElement.prototype,'src'],[HTMLAnchorElement.prototype,'href'],[HTMLIFrameElement.prototype,'src']]){const d=Object.getOwnPropertyDescriptor(proto,key);if(d)Object.defineProperty(proto,key,{...d,set(v){d.set.call(this,resolve(String(v)));}});}
 const open=window.open.bind(window);window.open=(url,target,features)=>{const file=String(url).split('#')[0];if(payload.pages[file]){const w=open('about:blank',target||'_blank',features);if(w){w.ARCHIVE_OFFLINE=payload;if(String(url).includes('#'))w.location.hash=String(url).split('#').slice(1).join('#');w.document.open();w.document.write(payload.pages[file]);w.document.close();}return w;}return open(resolve(String(url)),target,features);};
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(a){const href=a.getAttribute('href');if(href&&payload.pages[href.split('#')[0]]){e.preventDefault();window.open(href,'_blank');}}});
};
const boot='<script>('+runtime.toString()+')();</script>';
const pages={};for(const f of ['print.html','booklet.html'])pages[f]=inline(f).replace('</head>',boot+'</head>');
const payload={assets,pages};const html=inline('index.html').replace('</head>','<script type="application/json" id="offline-assets">'+JSON.stringify(payload).replace(/</g,'\\u003c')+'</script>'+boot+'</head>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log(JSON.stringify({file:out,bytes:fs.statSync(out).size,assets:Object.keys(assets).length}));
