# 전체 기출 아카이브

10종 시험, 129개 지문 묶음, 450문항의 검색 화면과 원본 PDF·HWP를 포함합니다.

## 현재 상태

일부 문제·해설 이미지의 GitHub 업로드는 아직 완료되지 않았습니다. 원본 PDF와 이미지 영역 정보는 보존되어 있습니다. 아래 절차로 이미지를 생성한 뒤 전체 아카이브를 열 수 있습니다.

```sh
python -m pip install pymupdf pillow
python scripts/restore_assets.py
node scripts/build_offline.cjs . korean_exam_archive.html
```

생성된 `korean_exam_archive.html`은 문제·해설 이미지와 PDF가 포함된 단일 HTML입니다. 원본 폴더에서는 `index.html`을 열 수 있습니다.

GitHub Actions 자동 생성 및 GitHub Pages 공개 배포는 아직 구성하지 않았습니다. 기존 ChatGPT Sites 주소의 접근 설정은 유지됩니다.
