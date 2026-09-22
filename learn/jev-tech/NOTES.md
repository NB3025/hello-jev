# NOTES (jev-tech)

## 사용자 선호
- 답변은 항상 3문장 이내로 간결하게. 궁금하면 사용자가 더 깊게 묻는다.
- 학습·레슨 언어: 한국어.
- **코드 없이 개념만.** 실습은 질문 세트 표, 임계값 표, 아키텍처 다이어그램, JSON 모양 정도까지.
- 주 5시간 이상, 레슨당 약 30분, 매일 1개 가능.

## 작업 메모
- 워크스페이스 생성일: 2026-09-22. 미션은 사용자 답변(AskUserQuestion 2회)으로 확정.
- 자매 워크스페이스: `../jev-sales/` (피치·유즈케이스 매핑·반론). 비기술 화법은 거기로.
- 첫 레슨 후보 순서: ① System One vs LLM, 요청/응답 모양 → ② Noul/Choice/Score 선택 규칙 → ③ 질문 분해 원칙(39% vs 0%, 62.6→95%) → ④ confidence와 auto/confirm/human/block → ⑤ 하네스 안 4위치 다이어그램 → ⑥ 원리(병렬 샘플러·RLCD·캘리브레이션) → ⑦ 안티패턴 판별.
- 실습 형식 아이디어: 업무 시나리오를 주고 질문 세트+state+임계값을 표로 작성 → 커뮤니티 코드(kenhuangus, pi-jev)의 실제 설계와 비교해 즉시 피드백.
- 환경 제약: typesafe.ai, docs.typesafe.ai, langchain.com, vercel.com, cloudflare 문서 등 WebFetch 차단. GitHub raw/미러와 WebSearch 요약으로 대체. git clone은 가능.
