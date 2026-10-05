/* jev-tech 공유 컴포넌트: 파인만 연습지 점검기.
   사용법:
   <textarea class="fy-input" id="fy-1" data-target-sec="90"></textarea>
   <button class="fy-check" data-for="fy-1">점검</button>
   <div class="fy-result" id="fy-1-result"></div>
   Feynman.setup({ concepts: { 'fy-1': [{label, re}] }, jargon: [{term, re, plain}] })

   - 쓴 글을 브라우저에 저장한다(이 기기에서만, 실패해도 페이지는 동작).
   - "점검"을 누르면: 꼭 들어가야 할 생각이 들어갔는지, 친구가 모를 단어를 썼는지, 말하면 몇 초 분량인지 보여준다.
   점검은 단어 패턴만 본다. 뜻이 맞는지는 판단하지 못하므로, 최종 판단은 모범 대본과 직접 비교해서 한다. */
(function (global) {
  'use strict';
  const KEY = 'jev-feynman-v1:';
  function load(id) { try { return localStorage.getItem(KEY + id) || ''; } catch (e) { return ''; } }
  function save(id, v) { try { localStorage.setItem(KEY + id, v); } catch (e) { /* 저장 불가 환경: 무시 */ } }
  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  // 발표 속도: 쉼과 강조를 포함해 대략 초당 4음절. 영문 단어는 단어당 0.4초로 계산.
  function speakSeconds(text) {
    const hangul = (text.match(/[가-힣]/g) || []).length;
    const latin = (text.match(/[A-Za-z]+/g) || []).length;
    const digits = (text.match(/\d+/g) || []).length;
    return Math.round(hangul / 4 + latin * 0.4 + digits * 0.5);
  }

  function setup(cfg) {
    document.querySelectorAll('.fy-input').forEach(ta => {
      ta.value = load(ta.id);
      const counter = document.getElementById(ta.id + '-count');
      const upd = () => {
        save(ta.id, ta.value);
        if (counter) {
          const s = speakSeconds(ta.value), t = +ta.dataset.targetSec || 0;
          counter.textContent = ta.value.trim() ? `말하면 약 ${s}초 · 목표 ${t}초` : `목표 ${t}초 분량`;
          counter.className = 'fy-count' + (t && s > t * 1.25 ? ' over' : '');
        }
      };
      ta.addEventListener('input', upd);
      upd();
    });

    document.querySelectorAll('.fy-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.for;
        const ta = document.getElementById(id);
        const out = document.getElementById(id + '-result');
        const text = (ta && ta.value) || '';
        if (!text.trim()) { out.innerHTML = '<p class="fy-empty">먼저 위 칸에 친구에게 말하듯 써 보세요. 틀려도 됩니다. 막히는 곳을 찾는 게 목적입니다.</p>'; out.hidden = false; return; }

        const concepts = (cfg.concepts[id] || []).map(c => ({ label: c.label, ok: c.re.test(text) }));
        const hit = concepts.filter(c => c.ok).length;
        const jargon = cfg.jargon.filter(j => j.re.test(text));
        const s = speakSeconds(text), t = +ta.dataset.targetSec || 0;

        out.innerHTML =
          `<div class="fy-block"><div class="fy-h">꼭 들어가야 할 생각 <span>${hit} / ${concepts.length}</span></div><ul class="fy-list">` +
          concepts.map(c => `<li class="${c.ok ? 'ok' : 'miss'}">${c.ok ? '들어감' : '빠짐'} · ${esc(c.label)}</li>`).join('') + '</ul></div>' +
          `<div class="fy-block"><div class="fy-h">친구가 모를 단어 <span>${jargon.length}개</span></div>` +
          (jargon.length
            ? '<ul class="fy-list">' + jargon.map(j => `<li class="warn"><b>${esc(j.term)}</b> → ${esc(j.plain)}</li>`).join('') + '</ul>'
            : '<p class="fy-ok">없음. 친구가 끝까지 따라올 수 있는 말입니다.</p>') + '</div>' +
          `<div class="fy-block"><div class="fy-h">분량</div><p>말하면 약 <b>${s}초</b>, 목표 ${t}초. ${s > t * 1.25 ? '길다. 비유 하나와 핵심 문장만 남기고 덜어 내 보세요.' : s < t * 0.5 ? '짧다. 친구가 "왜?"라고 물을 곳에 한 문장씩 더해 보세요.' : '적당합니다.'}</p></div>` +
          `<p class="fy-note">이 점검은 단어 패턴만 봅니다. "빠짐"이 나왔다면 다른 말로 썼을 수도 있으니, 아래 모범 대본을 열어 직접 비교하세요.</p>`;
        out.hidden = false;
      });
    });
  }
  global.Feynman = { setup, speakSeconds };
})(window);
