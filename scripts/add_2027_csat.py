"""Add the November 2026 odd-form exam after restoring the historical archive."""
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re
import fitz
from PIL import Image

ROOT = Path('.')
ID = 'elective_2026_11'
SETS = [
    ('1~3','독서 이론','디지털 문서의 비판적 읽기'),
    ('4~9','인문','불교를 둘러싼 논쟁과 인식 변화 — 정도전·기화·조선 유학자'),
    ('10~13','과학 + 기술','가상 메모리와 주소 변환'),
    ('14~17','사회','사실 표현과 의견 표현의 법적 책임'),
    ('18~21','고전산문','작자 미상 「창선감의록」'),
    ('22~26','현대시 + 수필','윤동주 「참회록」 · 허만하 「횟집 어항 앞에서」 · 김소연 「유리와 거울」'),
    ('27~30','현대소설','김채원 「봄의 환(幻)」'),
    ('31~34','고전시가','연안 이씨 「부여노정기」 · 송종원 「서리 내린 달 밝은 밤에」 · 김충선 「남풍이 건듯 불어」'),
    ('35~37','화법','향신료를 소개하는 발표'),
    ('38~42','화법·작문 통합','기수역 생태 탐방을 위한 대화와 보고서'),
    ('43~45','작문','작은 영화관 도입을 제안하는 기고문'),
    ('35~36','언어','복수 표준어와 직접 구성 요소'),
    ('37','언어','안긴절과 생략된 문장 성분'),
    ('38','언어','문장의 중의성'),
    ('39','언어','중세 국어의 모음 변화'),
    ('40~43','매체','인터넷 방송과 블로그의 정보 전달'),
    ('44~45','매체','누리 소통망 대화와 발표 자료'),
]
ANSWERS = ['1432353214253135321541453525421244','15533513424','52534121534']

def source(urls, pages):
    for url in urls:
        try:
            raw = urlopen(Request(url, headers={'User-Agent':'Mozilla/5.0'}), timeout=30).read()
            doc = fitz.open(stream=raw, filetype='pdf')
            assert len(doc) == pages and '2027' in doc[0].get_text()
            return doc
        except Exception as exc:
            print(f'{url}: {exc}', flush=True)
    raise RuntimeError('Unable to load the 2027 exam source')

def lines(doc, columns):
    result = []
    for p, page in enumerate(doc):
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(span['text'] for span in line['spans']).strip()
                x,y,_,_ = line['bbox']
                col = int(columns and x >= page.rect.width/2 - 2)
                result.append(((p,col,y),value))
    return sorted(result)

def locate(rows, pattern, first, last):
    for pos, value in rows:
        if first <= pos[0] < last and re.match(pattern, re.sub(r'\s+','',value)):
            return pos
    raise ValueError((pattern, first, last))

def clips(doc, start, stop, cols, tag):
    parts = []
    for p in range(start[0], min(stop[0]+1,len(doc))):
        for col in range(cols):
            if not start[:2] <= (p,col) <= stop[:2]:
                continue
            width,height = doc[p].rect.width, doc[p].rect.height
            top = max(0,start[2]-3) if (p,col)==start[:2] else 0
            bottom = max(0,stop[2]-3) if (p,col)==stop[:2] else height
            if bottom-top < 4:
                continue
            box = fitz.Rect(col*width/cols,top,(col+1)*width/cols,bottom)
            path = f'clips/{ID}_{tag}_{len(parts)+1}.webp'
            pix = doc[p].get_pixmap(matrix=fitz.Matrix(1.9,1.9),clip=box,alpha=False)
            Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(path,'WEBP',quality=85)
            parts.append(dict(src=path,page=p+1,bboxPdf=list(box),renderDpi=137,fullPage=cols==1))
    assert parts
    return parts

def build():
    qdoc = source(['https://cdn2.kice.re.kr/27dae-suneung/27DaeSuneung_1.pdf',
                   'https://snblog.vercel.app/pdfs/2027-suneung-korean.pdf'],40)
    qdoc.select(range(20))
    adoc = source(['https://mogozip.com/downloads/ebsi-fullservice/20261119/go3/kor_main_hsj_Y78V37UD.pdf'],33)
    question_file, explanation_file = [f'assets/{ID}_{suffix}.pdf' for suffix in ['q','a']]
    qdoc.save(question_file)
    adoc.save(explanation_file)
    qr,ar = lines(qdoc,True),lines(adoc,False)
    exam = dict(id=ID,title='2027학년도 대학수학능력시험 (수능)',shortTitle='26년 수능',year=2026,
                academicYear=2027,examType='csat',questionFile=question_file,explanationFile=explanation_file,sets=[],questions=[])
    starts = []
    for i,(rg,sub,title) in enumerate(SETS):
        ns = [int(n) for n in rg.split('~')]
        group = 0 if i < 8 else 1 if i < 11 else 2
        lo,hi = [(0,12),(12,16),(16,20)][group]
        alo,ahi = [(0,21),(21,26),(26,33)][group]
        prefix = rf'^\[{ns[0]}[~～∼–-]{ns[-1]}\]' if len(ns)>1 else rf'^{ns[0]}\.'
        qp = locate(qr,prefix,lo,hi)
        try:
            ap = locate(ar,prefix,alo,ahi)
        except ValueError:
            ap = locate(ar,rf'^{ns[0]}\.(?![①②③④⑤])',alo,ahi)
        starts.append((qp,ap))
        area = ('독서' if i < 4 else '문학') if group==0 else ['','화법과 작문','언어와 매체'][group]
        subject = ['common','speech','language'][group]
        skills = []
        for n in range(ns[0],ns[-1]+1):
            marker = rf'^{n}\.(?![①②③④⑤])'
            pos = locate(qr,marker,lo,hi)
            a_pos = locate(ar,marker,alo,ahi)
            skill = next(v for k,v in ar if k==a_pos and re.match(marker,re.sub(r'\s+','',v)))
            skill = re.sub(r'^\s*\d+\s*\.\s*','',skill).strip()
            chunk=[]
            for k,v in qr:
                if k < pos or k[0]!=pos[0] or k[1]!=pos[1]: continue
                if chunk and re.match(r'^[①②③④⑤㉠]|\[?보기\]?|^<',v): break
                chunk.append(v)
                if '?' in v or '？' in v or len(chunk)>=5: break
            stem = re.sub(r'^\s*\d+\s*\.\s*','',' '.join(chunk)).split('?')[0].strip()
            if '?' in ' '.join(chunk): stem += '?'
            skills.append(skill)
            exam['questions'].append(dict(number=n,subject=subject,setRange=rg,area=area,stem=stem,skill=skill,
                                          answer=int(ANSWERS[group][n-(1 if group==0 else 35)]),questionPage=pos[0]+1,
                                          explanationPage=a_pos[0]+1,explanation='11월 19일 공개 정답 기준. 해설 원문을 확인하세요.'))
        exam['sets'].append(dict(range=rg,subject=subject,area=area,subcategories=sub.split(' + '),subLabel=sub,
                                 isComposite=' + ' in sub or '통합' in sub,title=title,skills=list(dict.fromkeys(skills)),
                                 summary='2026년 11월 19일 시행 · 홀수형 · 시험 당일 공개 정답 기준',designNote=''))
    for j,doc in enumerate([qdoc,adoc]):
        positions=[pair[j] for pair in starts]+[(len(doc),0,0)]
        assert all(x<y for x,y in zip(positions,positions[1:])),positions
        for i,s in enumerate(exam['sets']):
            tag = 'q' if j==0 else 'a'
            name = 'question' if j==0 else 'explanation'
            parts=clips(doc,positions[i],positions[i+1],2 if j==0 else 1,f'{i}_{tag}')
            s[name+'Clips']=parts
            s[name+'Pages']=sorted({p['page'] for p in parts})
    path=ROOT/'elective-data.js'
    data=json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    assert not any(e['id']==ID for e in data['exams'])
    data['exams'].insert(0,exam)
    path.write_text('window.ELECTIVE_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

if __name__ == '__main__':
    build()
