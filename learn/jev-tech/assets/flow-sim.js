/* jev-tech 공유 컴포넌트: 결정 흐름 시뮬레이터.
   원본 데이터 → state 조립 → 요청 → Jev 병렬 판정 → 응답 → 코드 분기, 5단계를 클릭으로 따라간다.

   사용법:
   <div class="flow-sim" id="sim"></div>
   <script>FlowSim.mount('#sim', SCENARIOS)</script>

   SCENARIOS = [{
     id, label, raw: {…원본 객체…}, state: {…조립된 state…},
     questions: { id: {type, instructions, criteria} },
     answers:   { id: {choice|score|noul, probabilities, confidence, legend} },   // 예시 값(추정). 실제 응답 아님.
     decide: fn(answers) -> [{check, result:true|false|null, note}], finalRoute, finalNote
   }]
*/
(function (global) {
  'use strict';

  const STEPS = [
    { key: 'raw',      title: '① 원본 데이터',        sub: '애플리케이션이 가진 전부. 아직 Jev와 무관.' },
    { key: 'state',    title: '② state 조립 (코드)',   sub: '결정적 규칙으로 걸러내고, 질문에 필요한 필드만 골라 이름을 붙인다.' },
    { key: 'request',  title: '③ 요청 전송',           sub: 'state 하나 + 질문 여러 개. 호출은 한 번.' },
    { key: 'model',    title: '④ Jev 판정 (병렬)',     sub: '질문마다 내가 정한 옵션들 위에 확률을 배분한다. 텍스트 생성 없음.' },
    { key: 'response', title: '⑤ 응답',                sub: 'choice · score · noul · probabilities · confidence. 코드가 바로 읽는다.' },
    { key: 'decide',   title: '⑥ 코드 분기',           sub: '임계값과 규칙은 코드에 있다. Jev는 라우팅하지 않는다.' }
  ];

  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function json(o) { return esc(JSON.stringify(o, null, 2)); }
  function pct(p) { return Math.round(p * 100); }

  function renderBars(qid, q, a) {
    let rows = '';
    if (q.type === 'noul') {
      rows = `<div class="bar-row"><span class="lbl">참</span><div class="bar"><div class="fill" style="width:${pct(a.noul)}%"></div></div><span class="val">${a.noul.toFixed(2)}</span></div>
              <div class="bar-row"><span class="lbl">거짓</span><div class="bar"><div class="fill dim" style="width:${pct(1 - a.noul)}%"></div></div><span class="val">${(1 - a.noul).toFixed(2)}</span></div>`;
    } else {
      const keys = Object.keys(a.probabilities);
      const top = q.type === 'choice' ? a.choice : null;
      rows = keys.map(k => {
        const p = a.probabilities[k];
        const label = q.type === 'score' ? `${k} · ${esc(a.legend[k])}` : esc(k);
        const win = (q.type === 'choice' && k === top) ? ' win' : '';
        return `<div class="bar-row${win}"><span class="lbl">${label}</span><div class="bar"><div class="fill" style="width:${pct(p)}%"></div></div><span class="val">${p.toFixed(2)}</span></div>`;
      }).join('');
    }
    const head = q.type === 'choice' ? `choice = <b>${esc(a.choice)}</b> · confidence ${a.confidence.toFixed(2)}`
               : q.type === 'score' ? `score = <b>${a.score.toFixed(2)}</b> · confidence ${a.confidence.toFixed(2)}`
               : `noul = <b>${a.noul.toFixed(2)}</b> · (confidence 없음)`;
    return `<div class="qcard"><div class="qhead"><span class="tag tag-jev">${q.type}</span> <code>${esc(qid)}</code> <span class="qtext">${esc(typeof q.instructions === 'string' ? q.instructions : q.instructions.question)}</span></div>${rows}<div class="qfoot">${head}</div></div>`;
  }

  function stripForResponse(q, a) {
    const out = { type: q.type };
    if (q.type === 'choice') { out.choice = a.choice; out.probabilities = a.probabilities; out.confidence = a.confidence; }
    if (q.type === 'score') { out.score = a.score; out.legend = a.legend; out.probabilities = a.probabilities; out.confidence = a.confidence; }
    if (q.type === 'noul') { out.noul = a.noul; }
    return out;
  }

  function mount(sel, scenarios) {
    const root = document.querySelector(sel);
    if (!root) return;
    let sIdx = 0, step = 0;

    function render() {
      const sc = scenarios[sIdx];
      const st = STEPS[step];
      let body = '';
      if (st.key === 'raw') {
        body = `<pre><code>${json(sc.raw)}</code></pre><p class="note">${esc(sc.rawNote || '')}</p>`;
      } else if (st.key === 'state') {
        body = `<div class="two"><div><div class="mini">코드가 한 일</div><ul>${(sc.stateSteps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul></div><div><div class="mini">결과: state</div><pre><code>${json(sc.state)}</code></pre></div></div>`;
      } else if (st.key === 'request') {
        body = `<pre><code>${json({ state: '(② 의 state)', model: 'jev-latest', questions: sc.questions })}</code></pre><p class="note">questions의 키(${Object.keys(sc.questions).map(k => '<code>' + esc(k) + '</code>').join(', ')})는 모델에 전달되지 않는다. instructions와 criteria만 본다.</p>`;
      } else if (st.key === 'model') {
        body = `<div class="qgrid">${Object.keys(sc.questions).map(k => renderBars(k, sc.questions[k], sc.answers[k])).join('')}</div><p class="note"><span class="tag tag-indep">예시 값</span> 이 막대들은 학습용 추정치다. 실제 Jev 응답이 아니며, 실제 값은 모델 버전과 질문 문구에 따라 달라진다.</p>`;
      } else if (st.key === 'response') {
        const answers = {};
        Object.keys(sc.questions).forEach(k => { answers[k] = stripForResponse(sc.questions[k], sc.answers[k]); });
        body = `<pre><code>${json({ model: 'jev-latest', answers, usage: { input_tokens: sc.inputTokens || 300, output_tokens: 40 } })}</code></pre>`;
      } else if (st.key === 'decide') {
        const checks = sc.decide(sc.answers);
        body = `<ol class="checks">${checks.map(c => `<li class="${c.result === true ? 'hit' : c.result === false ? 'miss' : 'skip'}"><code>${esc(c.check)}</code><span class="res">${c.result === true ? '참 → 이 분기' : c.result === false ? '거짓 → 다음으로' : '도달 안 함'}</span>${c.note ? `<div class="cnote">${esc(c.note)}</div>` : ''}</li>`).join('')}</ol><div class="final"><span class="mini">최종</span> <code>${esc(sc.finalRoute)}</code><div class="cnote">${esc(sc.finalNote || '')}</div></div>`;
      }

      root.innerHTML = `
        <div class="sim-top">
          <div class="sim-scn">${scenarios.map((s, i) => `<button type="button" class="scn${i === sIdx ? ' on' : ''}" data-i="${i}">${esc(s.label)}</button>`).join('')}</div>
          <div class="sim-steps">${STEPS.map((s, i) => `<button type="button" class="stp${i === step ? ' on' : ''}${i < step ? ' done' : ''}" data-i="${i}">${esc(s.title)}</button>`).join('')}</div>
        </div>
        <div class="sim-body">
          <div class="sim-h"><b>${esc(st.title)}</b><span>${esc(st.sub)}</span></div>
          ${body}
        </div>
        <div class="sim-nav">
          <button type="button" class="prev" ${step === 0 ? 'disabled' : ''}>← 이전</button>
          <span class="pos">${step + 1} / ${STEPS.length}</span>
          <button type="button" class="next" ${step === STEPS.length - 1 ? 'disabled' : ''}>다음 →</button>
        </div>`;

      root.querySelectorAll('.scn').forEach(b => b.addEventListener('click', () => { sIdx = +b.dataset.i; render(); }));
      root.querselectorAllSafe = null;
      root.querySelectorAll('.stp').forEach(b => b.addEventListener('click', () => { step = +b.dataset.i; render(); }));
      const prev = root.querySelector('.prev'), next = root.querySelector('.next');
      if (prev) prev.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
      if (next) next.addEventListener('click', () => { step = Math.min(STEPS.length - 1, step + 1); render(); });
    }
    render();
  }

  global.FlowSim = { mount };
})(window);
