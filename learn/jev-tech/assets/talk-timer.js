/* jev-tech 공유 컴포넌트: 발표 리허설 타이머.
   사용법: 구간마다 <section class="seg" data-start="0" data-end="60"> … </section>
   페이지에 <div class="talk-bar" id="talkbar"></div> 를 두고 TalkTimer.mount('#talkbar') 호출.
   현재 구간을 강조하고, 전체 경과·구간 남은 시간을 보여준다. 구간 제목을 누르면 그 시점으로 이동. */
(function (global) {
  'use strict';
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function mount(sel) {
    const bar = document.querySelector(sel);
    if (!bar) return;
    const segs = Array.from(document.querySelectorAll('.seg[data-start]'));
    const total = segs.length ? +segs[segs.length - 1].dataset.end : 600;
    let elapsed = 0, running = false, last = 0, raf = 0, lastIdx = -1;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    bar.innerHTML =
      '<div class="tb-row">' +
        '<button type="button" class="tb-btn" id="tb-play">시작</button>' +
        '<div class="tb-time"><b id="tb-el">0:00</b> / ' + fmt(total) + '</div>' +
        '<div class="tb-seg"><span id="tb-name">준비</span><span id="tb-left"></span></div>' +
        '<button type="button" class="tb-btn ghost" id="tb-reset">처음</button>' +
      '</div>' +
      '<div class="tb-track"><div class="tb-fill" id="tb-fill"></div>' +
        segs.map(s => '<i style="left:' + (+s.dataset.start / total * 100) + '%"></i>').join('') +
      '</div>';

    const $ = id => document.getElementById(id);
    function idxAt(t) { for (let i = 0; i < segs.length; i++) if (t < +segs[i].dataset.end) return i; return segs.length - 1; }

    function paint() {
      const i = idxAt(elapsed);
      const s = segs[i];
      $('tb-el').textContent = fmt(elapsed);
      $('tb-fill').style.width = Math.min(100, elapsed / total * 100) + '%';
      $('tb-name').textContent = s ? s.dataset.label : '';
      $('tb-left').textContent = s ? ' · 이 구간 ' + fmt(+s.dataset.end - elapsed) + ' 남음' : '';
      if (i !== lastIdx) {
        segs.forEach((x, k) => x.classList.toggle('now', k === i && (running || elapsed > 0)));
        if (running && s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        lastIdx = i;
      }
      if (elapsed >= total) { running = false; $('tb-play').textContent = '끝'; }
    }
    function tick(now) {
      if (!running) return;
      elapsed += (now - last) / 1000; last = now;
      paint();
      raf = requestAnimationFrame(tick);
    }
    $('tb-play').addEventListener('click', () => {
      if (elapsed >= total) return;
      running = !running;
      $('tb-play').textContent = running ? '일시정지' : '계속';
      if (running) { last = performance.now(); lastIdx = -1; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
    });
    $('tb-reset').addEventListener('click', () => {
      running = false; cancelAnimationFrame(raf); elapsed = 0; lastIdx = -1;
      $('tb-play').textContent = '시작';
      segs.forEach(x => x.classList.remove('now'));
      paint();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    segs.forEach(s => {
      const h = s.querySelector('.seg-head');
      if (!h) return;
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      const jump = () => { elapsed = +s.dataset.start; lastIdx = -1; paint(); segs.forEach(x => x.classList.toggle('now', x === s)); };
      h.addEventListener('click', jump);
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); } });
    });
    paint();
  }
  global.TalkTimer = { mount };
})(window);
