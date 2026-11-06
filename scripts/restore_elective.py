"""Restore content-addressed elective PDFs, then render retained source crops."""
import hashlib,io,json,tarfile,pathlib,fitz
from PIL import Image
root=pathlib.Path('.')
manifest=json.loads((root/'source-packs/manifest.json').read_text())
parts=[]
for p in manifest['parts']:
    raw=(root/p['path']).read_bytes()
    assert len(raw)==p['bytes'] and hashlib.sha256(raw).hexdigest()==p['sha256'],p['path']
    parts.append(raw)
archive=b''.join(parts)
assert hashlib.sha256(archive).hexdigest()==manifest['sha256']
with tarfile.open(fileobj=io.BytesIO(archive),mode='r:xz') as tar:
    for m in tar.getmembers():
        assert m.isfile() and m.name.startswith('assets/elective_') and m.name.endswith('.pdf') and '..' not in pathlib.PurePosixPath(m.name).parts
    tar.extractall(root,filter='data')
text=(root/'elective-data.js').read_text(encoding='utf-8');data=json.loads(text.split('=',1)[1].strip().rstrip(';'))
count=0
for e in data['exams']:
    for kind,key in [('q','questionClips'),('a','explanationClips')]:
        doc=fitz.open(root/'assets'/f'{e["id"]}_{kind}.pdf')
        for s in e['sets']:
            for c in s[key]:
                dest=root/c['src'];dest.parent.mkdir(exist_ok=True)
                page=doc[c['page']-1];box=c.get('bboxPdf')
                scale=c.get('renderDpi',145)/72
                pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),clip=fitz.Rect(box) if box else None,alpha=False)
                Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(dest,'WEBP',quality=85)
                count+=1
        doc.close()
assert len(data['exams'])==17
assert sum(len(e['questions']) for e in data['exams'])==952
print(json.dumps({'electiveExams':17,'questions':952,'sourceCrops':count}))
