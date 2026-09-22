/* jev-tech 코스 공유 퀴즈 컴포넌트.
   사용법:
   <div class="quiz" data-answer="b" data-explain="정답 설명">
     <p class="q">질문</p>
     <ul class="opts">
       <li data-key="a">보기 A</li>
       <li data-key="b">보기 B</li>
     </ul>
   </div>

   빈칸형:
   <div class="quiz" data-fill="choice|probabilities|confidence" data-explain="설명">
     <p class="q">질문</p>
     <div class="fill"><input placeholder="…"><button>확인</button></div>
   </div>
   data-fill 은 '|'로 구분된 허용 답안 목록(대소문자·공백 무시).

   페이지에 <div class="quiz-summary"></div> 를 두면 진행 상황을 보여준다.
*/
(function () {
  'use strict';

  const quizzes = Array.from(document.querySelectorAll('.quiz'));
  const state = { total: quizzes.length, done: 0, correct: 0 };
  const summary = document.querySelector('.quiz-summary');

  function normalize(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, '').replace(/["'`]/g, '');
  }

  function renderSummary() {
    if (!summary) return;
    const pct = state.total ? Math.round((state.correct / state.total) * 100) : 0;
    summary.innerHTML =
      '<strong>연습 진행</strong> ' + state.done + ' / ' + state.total + ' 문항 완료 · 정답 ' + state.correct +
      '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
      '<small>' + (state.done === state.total && state.total > 0
        ? (state.correct === state.total
            ? '전부 맞혔습니다. 내일 다시 열어 같은 문항을 기억만으로 풀어 보세요 — 그때 맞히면 진짜 저장된 겁니다.'
            : '틀린 문항의 설명을 읽고, 내일 다시 풀어 보세요. 틀린 것이 가장 잘 기억됩니다.')
        : '한 문항씩 답하면 즉시 피드백이 나옵니다.') + '</small>';
  }

  function attachFeedback(quiz) {
    let fb = quiz.querySelector('.fb');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'fb';
      quiz.appendChild(fb);
    }
    return fb;
  }

  function finish(quiz, ok, fb, message) {
    if (quiz.dataset.done) return;
    quiz.dataset.done = '1';
    state.done += 1;
    if (ok) state.correct += 1;
    fb.className = 'fb show ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = (ok ? '<strong>맞습니다.</strong> ' : '<strong>아닙니다.</strong> ') + (message || '');
    renderSummary();
  }

  quizzes.forEach(function (quiz, i) {
    const q = quiz.querySelector('.q');
    if (q && !q.querySelector('.idx')) {
      const idx = document.createElement('span');
      idx.className = 'idx';
      idx.textContent = 'Q' + (i + 1) + '.';
      q.prepend(idx);
    }
    const fb = attachFeedback(quiz);
    const explain = quiz.dataset.explain || '';

    // 선택형
    const opts = quiz.querySelector('.opts');
    if (opts && quiz.dataset.answer) {
      const answer = quiz.dataset.answer;
      const items = Array.from(opts.querySelectorAll('li'));
      items.forEach(function (li) {
        const key = li.dataset.key;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = li.innerHTML;
        btn.dataset.key = key;
        li.innerHTML = '';
        li.appendChild(btn);
        btn.addEventListener('click', function () {
          const ok = key === answer;
          items.forEach(function (other) {
            const b = other.querySelector('button');
            b.disabled = true;
            if (other.dataset.key === answer) b.classList.add('correct');
          });
          if (!ok) btn.classList.add('wrong');
          finish(quiz, ok, fb, explain);
        });
      });
    }

    // 빈칸형
    const fill = quiz.querySelector('.fill');
    if (fill && quiz.dataset.fill) {
      const accepted = quiz.dataset.fill.split('|').map(normalize);
      const input = fill.querySelector('input');
      const btn = fill.querySelector('button');
      const check = function () {
        if (quiz.dataset.done) return;
        const ok = accepted.indexOf(normalize(input.value)) !== -1;
        input.classList.add(ok ? 'correct' : 'wrong');
        input.disabled = true;
        btn.disabled = true;
        finish(quiz, ok, fb, (ok ? '' : '정답: <code>' + quiz.dataset.fill.split('|')[0] + '</code>. ') + explain);
      };
      btn.addEventListener('click', check);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    }
  });

  renderSummary();
})();
