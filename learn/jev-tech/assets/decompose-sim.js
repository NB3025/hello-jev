/* jev-tech 공유 컴포넌트: 질문 분해 시뮬레이터.
   두 가지 마운트:
   DecomposeSim.mountGate('#gate', {cases, single, battery, policy})
     - 같은 툴 호출들에 대해 "단일 질문" vs "질문 배터리 + 코드 정책"의 결과를 나란히 비교.
   DecomposeSim.mountWeights('#weights', {signals, cases, bands})
     - Noul 여러 개를 코드 가중치로 합산. 슬라이더로 가중치를 바꾸면 결과 밴드가 즉시 바뀐다.
   모든 확률 값은 학습용 추정치다(실제 Jev 응답 아님). 호출하는 레슨이 그 사실을 표시한다. */
(function (global) {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function bar(p, cls) { return `<span class="dbar"><span class="dfill ${cls || ''}" style="width:${Math.round(p * 100)}%"></span></span><span class="dval">${p.toFixed(2)}</span>`; }
  const ACT = { ALLOW: '통과', APPROVE: '사람 확인', BLOCK: '차단' };

  function mountGate(sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    let mode = 'single', sel_i = 0;
    function render() {
      const c = cfg.cases[sel_i];
      const singleAct = c.single >= cfg.singleThreshold ? 'BLOCK' : 'ALLOW';
      const fired = cfg.policy(c.battery);
      const batAct = fired.length ? fired[0].action : 'ALLOW';
      const act = mode === 'single' ? singleAct : batAct;
      const ok = act === c.expected;

      const tabs = cfg.cases.map((k, i) => `<button type="button" class="dtab${i === sel_i ? ' on' : ''}" data-i="${i}">${esc(k.label)}</button>`).join('');
      const modes = `<button type="button" class="dmode${mode === 'single' ? ' on' : ''}" data-m="single">A · 질문 하나</button><button type="button" class="dmode${mode === 'battery' ? ' on' : ''}" data-m="battery">B · 질문 배터리 + 코드 정책</button>`;

      let judge = '';
      if (mode === 'single') {
        judge = `<div class="dq"><span class="tag tag-jev">noul</span> <code>is_dangerous</code> <span class="dqt">"${esc(cfg.singleQuestion)}"</span><div class="drow"><span class="dlbl">참</span>${bar(c.single, c.single >= cfg.singleThreshold ? 'hot' : '')}</div></div>
          <div class="dcode">if is_dangerous.noul ≥ ${cfg.singleThreshold} → BLOCK   <span class="c">← 이것이 정책의 전부. "무섭게 보이는가"와 "사용자가 요청한 무서운 일인가"를 구분할 정보가 없다</span></div>`;
      } else {
        judge = `<div class="dgrid">${cfg.battery.map(q => {
          const v = c.battery[q.id];
          const isScore = q.type === 'score';
          return `<div class="dq"><span class="tag tag-jev">${q.type}</span> <code>${q.id}</code> <span class="dqt">"${esc(q.text)}"</span><div class="drow"><span class="dlbl">${isScore ? 'score' : '참'}</span>${isScore ? `<span class="dbar"><span class="dfill" style="width:${Math.round(v / q.max * 100)}%"></span></span><span class="dval">${v.toFixed(2)} / ${q.max}</span>` : bar(v)}</div></div>`;
        }).join('')}</div>
        <div class="dcode"><b>코드 정책 (위에서부터 첫 규칙이 적용)</b>${cfg.rules.map(r => {
          const hit = fired.find(f => f.name === r.name);
          return `<div class="drule ${hit ? 'hit' : ''}"><code>${esc(r.expr)}</code> → ${r.action}${hit ? ' <span class="dfire">← 발동</span>' : ''}</div>`;
        }).join('')}<div class="drule ${fired.length ? '' : 'hit'}"><code>그 외</code> → ALLOW${fired.length ? '' : ' <span class="dfire">← 발동</span>'}</div></div>`;
      }

      root.innerHTML = `
        <div class="dtop"><div class="dtabs">${tabs}</div><div class="dmodes">${modes}</div></div>
        <div class="dbody">
          <div class="dcase"><div class="dmini">사용자 요청</div><div>${esc(c.user)}</div><div class="dmini" style="margin-top:.5rem">에이전트가 제안한 툴 호출</div><code class="dcall">${esc(c.call)}</code>${c.note ? `<div class="dnote">${esc(c.note)}</div>` : ''}</div>
          ${judge}
          <div class="dresult ${ok ? 'ok' : 'bad'}"><div><span class="dmini">이 설계의 결정</span><b>${ACT[act]} (${act})</b></div><div><span class="dmini">정답(사람이 원한 것)</span><b>${ACT[c.expected]} (${c.expected})</b></div><div class="dverdict">${ok ? '일치' : '불일치'}${c.why && !ok ? ' · ' + esc(c.why) : ''}</div></div>
        </div>
        <div class="dfoot">${mode === 'single'
          ? `A 설계로 다섯 사례를 모두 눌러 보라. 공격은 잘 잡지만 <b>정당한데 무섭게 보이는 요청</b>을 함께 막는다. 실측(typesafe-ai-firewall 600건): 정상 hard-negative의 <b>39%</b> 차단.`
          : `B 설계로 다섯 사례를 모두 눌러 보라. 같은 모델, 같은 state인데 <b>어느 위험인지</b>가 보이니 코드가 "차단"과 "사람 확인"을 갈라 준다. 실측: hard-negative 차단 <b>0%</b>, 공격 탐지 100%, 호출 비용 약 1.7배.`}</div>`;

      root.querySelectorAll('.dtab').forEach(b => b.addEventListener('click', () => { sel_i = +b.dataset.i; render(); }));
      root.querySelectorAll('.dmode').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; render(); }));
    }
    render();
  }

  function mountWeights(sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    const w = cfg.signals.map(s => s.weight);
    function band(x) { for (const b of cfg.bands) if (x >= b.min) return b; return cfg.bands[cfg.bands.length - 1]; }
    function render() {
      const sum = w.reduce((a, b) => a + b, 0) || 1;
      const norm = w.map(x => x / sum);
      const sliders = cfg.signals.map((s, i) => `<label class="dsl"><span><code>${s.id}</code> <span class="dqt">"${esc(s.text)}"</span></span><input type="range" min="0" max="100" value="${Math.round(norm[i] * 100)}" data-i="${i}" id="w-${s.id}"><span class="dval">${norm[i].toFixed(2)}</span></label>`).join('');
      const rows = cfg.cases.map(c => {
        const risk = cfg.signals.reduce((acc, s, i) => acc + norm[i] * c.values[s.id], 0);
        const b = band(risk);
        return `<tr><td>${esc(c.label)}<div class="dnote">${esc(c.note || '')}</div></td>${cfg.signals.map(s => `<td class="dnum">${c.values[s.id].toFixed(2)}</td>`).join('')}<td class="dnum"><b>${risk.toFixed(2)}</b></td><td><span class="dband ${b.cls}">${esc(b.label)}</span></td></tr>`;
      }).join('');
      root.innerHTML = `
        <div class="dbody">
          <div class="dcode">spam_risk = ${cfg.signals.map((s, i) => `<b>${norm[i].toFixed(2)}</b>·${s.id}`).join(' + ')}<br>${cfg.bands.slice().reverse().map(b => `${b.min > 0 ? `spam_risk ≥ ${b.min}` : '그 외'} → ${esc(b.label)}`).join(' · ')}</div>
          <div class="dsliders">${sliders}</div>
          <div class="dtablewrap"><table class="dtable"><thead><tr><th>티켓</th>${cfg.signals.map(s => `<th>${esc(s.short || s.id)}</th>`).join('')}<th>합계</th><th>밴드</th></tr></thead><tbody>${rows}</tbody></table></div>
        </div>
        <div class="dfoot">가중치를 움직여 보라. <b>모델은 한 번도 다시 부르지 않았다.</b> 세 Noul은 그대로이고, 우선순위가 바뀐 것은 코드의 숫자 세 개다. 공식 문서: "우선순위가 바뀌면 프롬프트를 다시 쓰는 대신 계수를 바꾼다."</div>`;
      root.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => { w[+r.dataset.i] = +r.value / 100; render(); document.getElementById(r.id) && document.getElementById(r.id).focus(); }));
    }
    render();
  }

  global.DecomposeSim = { mountGate, mountWeights };
})(window);
