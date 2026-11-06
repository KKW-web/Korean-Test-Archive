# Korean Test Archive publishing

- This repository is the publication target for the Korean exam archive requested by the user.
- Target repository: KKW-web/Korean-Test-Archive.
- Expected GitHub Pages URL: https://kkw-web.github.io/Korean-Test-Archive/.
- For future user-requested archive changes, update this repository and verify the Pages deployment as part of completing the work. Do not report publication until verified.
- Preserve question, answer, and source assets, relative links, and browser storage compatibility.
- Check the remote branch before writing; preserve unrelated remote changes. Never force-push without explicit authorization.
- The separate existing ChatGPT Sites deployment remains private; do not change its audience.

## HTML delivery and publication consistency
- For every user-requested improvement, deliver an HTML file/link in the final response and publish the same revision to GitHub Pages.
- Generate the downloadable HTML from the exact same source commit and assets used for the hosted website; keep its visible layout, content, and features consistent. Asset embedding for offline use is allowed, but do not redesign or simplify the exported interface.
- Use scripts/build_offline.cjs in the Pages build so the downloadable HTML and hosted files are created together.
- Do not show an HTML download button in the website UI. Provide the HTML file/link directly in the conversation instead.
- Verify deployment before reporting completion and identify any limitations honestly.


## Archive modes
- Default `index.html#browse` uses the original common-format archive. `?archive=elective#browse` uses the elective CSAT/KICE archive. Preserve both datasets and their separate browser storage.
- Question identity in the elective dataset is exam + subject + number; common 1–34 occurs once, each elective has its own 35–45.
- PDF originals are restored from SHA-256-verified source-packs by scripts/restore_elective.py. Keep crops and sources consistent.
- Missing supplied explanations are explicitly marked; external explanation links need internet, including in the offline HTML.
