'use strict';
// Enter the account name from https://ACCOUNT.goatcounter.com after owner signup.
window.ARCHIVE_ANALYTICS = window.ARCHIVE_ANALYTICS || { account: '' };
(() => {
  const account = window.ARCHIVE_ANALYTICS.account;
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(account || '') ||
      window.ARCHIVE_OFFLINE || location.protocol !== 'https:' ||
      location.hostname !== 'kkw-web.github.io') return;
  const path = '/Korean-Test-Archive/';
  if (!location.pathname.startsWith(path)) return;
  const origin = 'https://' + account + '.goatcounter.com';
  const footer = document.querySelector('footer');
  if (!footer || document.getElementById('visitorStats')) return;
  const stats = document.createElement('div');
  stats.id = 'visitorStats';
  stats.setAttribute('aria-label', '방문 통계');
  stats.style.cssText = 'flex-basis:100%;display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:8px;font-size:12px;';
  stats.innerHTML = '<span>오늘 방문자 <b id="visitorsToday">—</b></span><span>전체 방문자 <b id="visitorsTotal">—</b></span><small id="visitorStatsNote">통계는 지연 반영될 수 있습니다.</small>';
  footer.style.flexWrap = 'wrap';
  footer.appendChild(stats);
  const day = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const endpoint = origin + '/counter/' + encodeURIComponent(path) + '.json';
  async function display(url, id) {
    try {
      const res = await fetch(url, {mode:'cors', credentials:'omit', signal:AbortSignal.timeout(8000)});
      if (!res.ok) throw new Error('Statistics unavailable');
      const data = await res.json();
      const count = String(data.count ?? '');
      if (!/^[0-9][0-9,.\s]*$/.test(count)) throw new Error('Invalid count');
      document.getElementById(id).textContent = count + '명';
    } catch {
      document.getElementById('visitorStatsNote').textContent = '방문 통계를 잠시 불러올 수 없습니다.';
    }
  }
  // Both archive modes use one path; searches and selected questions are not sent.
  window.goatcounter = { no_onload:true, no_events:true, endpoint:origin+'/count' };
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.async = true;
  script.onload = () => {
    if (typeof window.goatcounter.count === 'function')
      window.goatcounter.count({path, title:'국어영역 기출 아카이브', referrer:''});
  };
  document.head.appendChild(script);
  display(endpoint + '?start=' + day, 'visitorsToday');
  display(endpoint, 'visitorsTotal');
})();
