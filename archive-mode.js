'use strict';
(() => {
  let requested = window.ARCHIVE_REQUESTED_MODE || new URLSearchParams(location.search).get('archive');
  try { const job = JSON.parse(new URLSearchParams(location.hash.slice(1)).get('job') || 'null'); if (job?.archive) requested = job.archive; } catch {}
  const mode = requested === 'elective' ? 'elective' : 'common';
  window.ARCHIVE_MODE = mode;
  window.ARCHIVE_STORAGE_KEY = key => mode === 'elective' ? key.replace(/^korean2028-/, 'korean-elective-') : key;
  window.ARCHIVE_URL = file => file + (mode === 'elective' ? '?archive=elective' : '');
  if (mode === 'elective') {
    window.APP_DATA = window.ELECTIVE_DATA;
    window.APP_DATA.notice = '2021~2026년 시행 자료 18회(수능 6회·6월/9월 모의평가 12회)를 수록했습니다. 수능은 홀수형 기준입니다. 시험마다 공통 1~34번은 한 번만, 화법과 작문 35~45번과 언어와 매체 35~45번은 각각 수록하여 총 1,008문항입니다(18회 × 56문항). 실제 응시자는 공통과 선택과목 하나를 합쳐 45문항을 풉니다. 문제와 해설은 모두 아카이브에 포함되어 있으며, 통합 HTML에서도 인터넷 연결 없이 열람·인쇄할 수 있습니다. 2027학년도 수능 정답은 11월 19일 공개본 기준입니다.';
  }
  // 문학 자료의 화면·검색·인쇄 제목 표기를 일관되게 정규화한다.
  // 원본 데이터와 작품명 안에 들어 있는 쉼표, 복합 지문 구분자는 보존한다.
  function normalizeLiteraryTitle(title) {
    return String(title).split(/(·| \/ )/).map(part => {
      if (part === '·' || part === ' / ') return part;
      let label = part.replace(/‘([^’]+)’/g, '「$1」').replace(/｢/g, '「').replace(/｣/g, '」');
      label = label.replace(/(^|[\s·/()–—-])(작자 미상|[가-힣]{2,4})\s*,?\s*(?=「)/g, '$1$2, ');
      if (!label.includes('「')) {
        const match = label.match(/^(\s*)(작자 미상|[가-힣]{2,4}),\s*(.+?)(\s*)$/);
        if (match) label = match[1] + match[2] + ', 「' + match[3] + '」' + match[4];
      }
      return label;
    }).join('');
  }
  for (const exam of window.APP_DATA.exams || []) {
    for (const set of exam.sets || []) {
      if (/문학|고전시가|고전산문|현대시|현대소설|수필|극/.test(set.area || '')) {
        set.title = normalizeLiteraryTitle(set.title);
      }
    }
  }
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
