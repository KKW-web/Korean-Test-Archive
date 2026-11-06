"""Download missing explanations and attach source crops to the existing archive."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib,json,re,time,fitz
from PIL import Image
R=Path('.')
data_path=R/'elective-data.js'
data=json.loads(data_path.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
targets=[('elective_2025_06','speech',20,26,[4,4,1,1,3,3,2,1,5,4,2]),('elective_2025_09','language',22,28,[1,3,5,4,5,4,3,5,3,4,2])]
report=[]
def lines(page):
    return sorted([(line['bbox'],''.join(span['text'] for span in line['spans']).strip()) for block in page.get_text('dict')['blocks'] if 'lines' in block for line in block['lines']],key=lambda x:(x[0][1],x[0][0]))
def anchor(doc,first,number,end=None):
    patterns=[]
    if end is not None and end!=number:patterns.append(re.compile(r'^\['+str(number)+r'[~～∼−–-]'+str(end)+r'\]'))
    patterns.append(re.compile(r'^'+str(number)+r'\.(?![①②③④⑤0-9])'))
    for pattern in patterns:
        for i in range(first,len(doc)):
            for box,t in lines(doc[i]):
                if pattern.search(re.sub(r'\s+','',t)):
                    return i,max(20,box[1]-3)
    raise ValueError(('Missing explanation anchor',number,end))
for eid,subject,first,total,answers in targets:
    exam=next(e for e in data['exams'] if e['id']==eid)
    sets=[s for s in exam['sets'] if s['subject']==subject]
    assert all(s.get('answerUnavailable') and s.get('externalExplanation') for s in sets)
    urls={s['externalExplanation'] for s in sets};assert len(urls)==1
    url=urls.pop()
    for attempt in range(3):
        try:
            raw=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read()
            assert raw.startswith(b'%PDF'), 'Response is not a PDF'
            break
        except Exception:
            if attempt==2:raise
            time.sleep(3)
    source=fitz.open(stream=raw,filetype='pdf');assert len(source)==total
    title=source[0].get_text()
    assert '2026' in title and ('6월' if '_06' in eid else '9월') in re.sub(r'\s+','',title)
    text='\n'.join(p.get_text() for p in source)
    answer_table={int(n):'①②③④⑤'.index(v)+1 for n,v in re.findall(r'(3[5-9]|4[0-5])\.\s*([①②③④⑤])',text)}
    assert [answer_table[n] for n in range(35,46)]==answers,(eid,answer_table)
    assert [q['answer'] for q in sorted(exam['questions'],key=lambda q:q['number']) if q['subject']==subject]==answers
    original_path=R/'assets'/f'{eid}_{subject}_explanation.pdf';original_path.write_bytes(raw)
    merged_path=R/exam['explanationFile'];merged=fitz.open(merged_path);offset=len(merged)
    merged.insert_pdf(source,from_page=first)
    out=merged_path.with_suffix('.new.pdf');merged.save(out,garbage=3,deflate=True);merged.close();out.replace(merged_path)
    starts=[]
    for s in sets:
        nums=list(map(int,re.findall(r'\d+',s['range'])))
        starts.append(anchor(source,first,nums[0],nums[-1]))
    assert starts==sorted(starts) and len(set(starts))==len(starts)
    count=0
    for i,s in enumerate(sets):
        start=starts[i];end=starts[i+1] if i+1<len(starts) else (len(source),20)
        clips=[]
        for p in range(start[0],min(end[0]+1,len(source))):
            page=source[p];top=start[1] if p==start[0] else 25
            bottom=end[1] if p==end[0] else page.rect.height-25
            if bottom<=top+2:continue
            box=fitz.Rect(25,top,page.rect.width-25,bottom)
            src=f'clips/{eid}_{subject}_{s["range"].replace("~","-")}_a_{len(clips)+1}.webp'
            pix=page.get_pixmap(matrix=fitz.Matrix(130/72,130/72),clip=box,alpha=False)
            Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(R/src,'WEBP',quality=85)
            clips.append({'src':src,'page':offset+(p-first)+1,'bboxPdf':[round(v,3) for v in box],'renderDpi':130,'fullPage':True})
            count+=1
        assert clips
        s['explanationClips']=clips;s['explanationPages']=sorted({c['page'] for c in clips})
        s.pop('answerUnavailable',None);s.pop('externalExplanation',None)
        s['summary']='문제와 정답·해설을 함께 수록했습니다. 해설은 원본 PDF를 문항 묶음별로 나누어 제공합니다.'
    for q in exam['questions']:
        if q['subject']==subject:
            q['answerSource']=exam['explanationFile']
            q['explanation']='첨부된 해설 원문에서 정답 해설과 오답 풀이를 확인할 수 있습니다.'
    report.append({'exam':eid,'subject':subject,'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'original':str(original_path),'sourcePages':total,'attachedPages':list(range(first+1,total+1)),'sets':len(sets),'clips':count,'answersVerified':11})
    source.close()
data['notice']='2021~2026년 시행 수능·평가원 17회를 수록했습니다. 공통 34문항과 두 선택과목 각 11문항을 포함해 총 952문항이며, 문제와 해설을 함께 열람·인쇄할 수 있습니다.'
assert not any(s.get('answerUnavailable') or s.get('externalExplanation') for e in data['exams'] for s in e['sets'])
data_path.write_text('window.ELECTIVE_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(R/'supplemental-explanations.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'attachedExplanations':report},ensure_ascii=False),flush=True)
