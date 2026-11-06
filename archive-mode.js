'use strict';
(() => {
  let requested = window.ARCHIVE_REQUESTED_MODE || new URLSearchParams(location.search).get('archive');
  try { const job = JSON.parse(new URLSearchParams(location.hash.slice(1)).get('job') || 'null'); if (job?.archive) requested = job.archive; } catch {}
  const mode = requested === 'elective' ? 'elective' : 'common';
  window.ARCHIVE_MODE = mode;
  window.ARCHIVE_STORAGE_KEY = key => mode === 'elective' ? key.replace(/^korean2028-/, 'korean-elective-') : key;
  window.ARCHIVE_URL = file => file + (mode === 'elective' ? '?archive=elective' : '');
  if (mode === 'elective') window.APP_DATA = window.ELECTIVE_DATA;
  window.ARCHIVE_QUESTIONS = s => {
    const nums = String(s.range).match(/\d+/g)?.map(Number) || [];
    return (s.exam.questions || []).filter(q => (!s.subject || q.subject === s.subject) && Number(q.number) >= nums[0] && Number(q.number) <= nums[nums.length - 1]);
  };
  document.documentElement.dataset.archive = mode;
  document.querySelectorAll('[data-archive-mode]').forEach(a => {
    const active = a.dataset.archiveMode === mode;
    a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'page');
  });
  if (mode === 'elective') {
    document.title = '선택형 수능·평가원 | 국어 기출 아카이브';
    const subtitle = document.querySelector('.brand small');
    if (subtitle) subtitle.textContent = '선택형 수능·평가원 · 공통 / 화법과 작문 / 언어와 매체';
    const year = document.getElementById('gradeFilter');
    if (year) {
      document.querySelector('label[for="gradeFilter"]').textContent = '시행연도';
      year.innerHTML = '<option value="">전체 시행연도</option>' + [...new Set(window.APP_DATA.exams.map(e => e.year))].sort().reverse().map(y => `<option value="${y}">${y}년</option>`).join('');
      document.querySelector('label[for="referenceFilter"]').textContent = '시험 구분';
    }
  }
})();
