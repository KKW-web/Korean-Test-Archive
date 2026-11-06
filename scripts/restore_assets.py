"""Recreate archive image assets from checked-in PDFs and retained crop metadata."""
import json,re,pathlib,fitz
from PIL import Image
root=pathlib.Path('.')
text=(root/'data.js').read_text(encoding='utf-8')
data=json.loads(text[text.index('=')+1:].strip().rstrip(';'))
for folder in ['pages','clips']:(root/folder).mkdir(exist_ok=True)
made=0
for exam in data['exams']:
    for kind in ['q','a']:
        pdf=root/'assets'/f"{exam['id']}_{kind}.pdf"
        doc=fitz.open(pdf)
        for n,page in enumerate(doc):
            dest=root/'pages'/f"{exam['id']}_{kind}_{n+1}.webp"
            if not dest.exists():
                pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),alpha=False)
                Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(dest,'WEBP',quality=90)
        for s in exam['sets']:
            for clip in s.get('questionClips' if kind=='q' else 'explanationClips',[]):
                if not isinstance(clip,dict):continue
                dest=root/clip['src']
                if dest.exists():continue
                page=doc[int(clip['page'])-1]
                box=clip.get('sourceBox') or clip.get('bboxPdf')
                if not box:raise ValueError(f'Missing crop metadata: {dest}')
                scale=clip.get('dpi',clip.get('renderDpi',180))/72
                pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),clip=fitz.Rect(box),alpha=False)
                image=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
                trim=clip.get('verticalTrimPixels')
                if trim:image=image.crop((0,trim[0],image.width,min(trim[1],image.height)))
                image.save(dest,'WEBP',quality=95)
                made+=1
        doc.close()
missing=[]
def check(x):
    if isinstance(x,str) and re.match(r'^(assets|clips|pages)/',x) and not (root/x).is_file():missing.append(x)
    elif isinstance(x,dict):
        for v in x.values():check(v)
    elif isinstance(x,list):
        for v in x:check(v)
check(data)
assert not missing,missing
print(json.dumps({'exams':len(data['exams']),'questions':sum(len(x['questions']) for x in data['exams']),'restored_clips':made,'missing':missing}))
