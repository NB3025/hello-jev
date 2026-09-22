# NOTES (jev-tech)

## 사용자 선호
- 답변은 항상 3문장 이내로 간결하게. 궁금하면 사용자가 더 깊게 묻는다.
- 학습·레슨 언어: 한국어. **레슨이 추천하는 1차 자료(영문)는 매번 한글 번역본을 `reference/readings-ko-NNNN.html`로 함께 만든다** (사용자 요청, 2026-09-22). 원문 우선, 역주는 표시.
- 사용자는 모바일로 본다. 레슨마다 Claude 아티팩트 링크를 함께 제공 (레슨 0001: https://claude.ai/artifact/CLet8sSk4v5gCWWmP76LaB). GitHub Pages 설정 안내는 했고 사용자가 켜면 index 페이지 추가.
- **코드 없이 개념만.** 실습은 질문 세트 표, 임계값 표, 아키텍처 다이어그램, JSON 모양 정도까지.
- 주 5시간 이상, 레슨당 약 30분, 매일 1개 가능.

## 작업 메모
- 워크스페이스 생성일: 2026-09-22. 미션은 사용자 답변(AskUserQuestion 2회)으로 확정.
- 자매 워크스페이스: `../jev-sales/` (피치·유즈케이스 매핑·반론). 비기술 화법은 거기로.
- 첫 레슨 후보 순서: ① System One vs LLM, 요청/응답 모양 → ② Noul/Choice/Score 선택 규칙 → ③ 질문 분해 원칙(39% vs 0%, 62.6→95%) → ④ confidence와 auto/confirm/human/block → ⑤ 하네스 안 4위치 다이어그램 → ⑥ 원리(병렬 샘플러·RLCD·캘리브레이션) → ⑦ 안티패턴 판별.
- 실습 형식 아이디어: 업무 시나리오를 주고 질문 세트+state+임계값을 표로 작성 → 커뮤니티 코드(kenhuangus, pi-jev)의 실제 설계와 비교해 즉시 피드백.
- 2026-09-22: 레슨 0001(System One vs LLM, 요청/응답 해부) 작성. 자산: `assets/course.css`(공유 스타일), `assets/quiz.js`(선택형·빈칸형 퀴즈, 즉시 피드백, 진행 요약). 참조: `reference/request-response-shape.html`. 사용자가 레슨 6절 "말로 설명해 보기" 답을 보내면 피드백 후 첫 학습 기록(0001) 작성 예정. GLOSSARY는 사용자가 용어를 올바르게 쓴 증거가 생긴 뒤 시작.
- 환경 제약: typesafe.ai, docs.typesafe.ai, langchain.com, vercel.com, cloudflare 문서 등 WebFetch 차단. GitHub raw/미러와 WebSearch 요약으로 대체. git clone은 가능.
