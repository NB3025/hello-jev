# Jev (테크 레벨) Resources

이 워크스페이스의 상위 조사 문서: [`../../JEV_RESEARCH.md`](../../JEV_RESEARCH.md) (모델 개요·아키텍처), [`../../research/jev-use-cases.md`](../../research/jev-use-cases.md) (유즈케이스·질문 설계 패턴·임계값·수치·안티패턴). 특히 use-cases 문서 3절(질문 설계 패턴)과 7절(안티패턴)이 이 미션의 핵심 지식이다.

## Knowledge

### TypeSafe 공식 개념 문서 (1차 출처)
- [Docs: System One 개념](https://docs.typesafe.ai/concepts/system-one) · [State](https://docs.typesafe.ai/concepts/state) · [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
  모델 클래스 정의, state에 무엇을 넣는가, 하네스 안에서의 역할. Use for: 원리 설명 레슨과 state 설계 레슨의 기준.
- [Docs: Primitives — Choice / Score / Noul](https://docs.typesafe.ai/primitives)
  Choice ≤255 옵션, Score 2~10단계, Noul은 confidence 없음, 컨텍스트 약 32K. Use for: 질문 유형 선택 규칙.
- [Docs: Confidence](https://docs.typesafe.ai/confidence)
  confidence가 분포 형태에서 어떻게 나오는지. Use for: 임계값 설계 레슨.
- [Docs: Patterns — fan-out / confidence-routing / composite-scoring / intent-routing](https://docs.typesafe.ai/patterns)
  공식 4대 패턴. Use for: 아키텍처 다이어그램의 어휘.
- [Docs: Cookbooks (rerank, parallel_questions, llm_guardrails, function_calling, citation_check, classification_using_confidence, consistency_*)](https://docs.typesafe.ai/cookbooks/rerank_typesafe)
  유즈케이스별 질문 구성 예. Use for: 실습 문제의 정답 참조. 미러에는 description만 남아 있음.
- [Docs: Model jaggedness (jev-1.13)](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
  공식이 인정한 약점(산술·날짜·비영어 등). Use for: 안티패턴 레슨.
- [Docs 미러: thiagoadril/typesafe-docs (GitHub)](https://github.com/thiagoadril/typesafe-docs)
  위 문서들의 이 환경에서 읽을 수 있는 사본. Use for: 원문 문구 확인.
- [Blog: "Introducing System One Models & Jev"](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
  비자기회귀 병렬 샘플러, RLCD, 합성 데이터 언급의 유일한 원본. Use for: 원리 레슨 인용. 접근 불가 → 검색 요약.

### 공식 SDK·어댑터 (요청/응답 모양 확인용, 코드는 읽기만)
- [typesafe-ai/typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python) · [typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js) · [system-one-adapter-python](https://github.com/typesafe-ai/system-one-adapter-python)
  Use for: state/questions/answers JSON 구조를 그림으로 옮길 때.

### 실제 설계 사례 (임계값·질문 문구가 코드에 있음)
- [kenhuangus/jev-usecases](https://github.com/kenhuangus/jev-usecases)
  공식 use-case map을 미러한 프로덕션 하네스. auto/confirm/human/block 기본 임계값 0.72/0.45/0.70/0.30/0.88/0.85. Use for: 임계값 설계 레슨의 출발점.
- [y0usaf/pi-jev](https://github.com/y0usaf/pi-jev)
  코딩 에이전트 툴콜 게이트. 질문 문구가 결과를 바꾼 기록. Use for: 가드레일 설계 실습.
- [AnshChoudhary/typesafe-ai-firewall (report.md)](https://github.com/AnshChoudhary/typesafe-ai-firewall)
  단일 "위험한가?" 질문은 hard negative 39% 차단 vs 5-Noul 배터리 0%. Use for: 질문 분해 원칙.
- [FirasSX914/Janus (RESEARCH.md)](https://github.com/FirasSX914/Janus)
  임계값이 도메인 간 이전되지 않음. Use for: "임계값은 재검증하라" 원칙.
- [jujumilk3/jev-calibration-audit (FINDINGS.md)](https://github.com/jujumilk3/jev-calibration-audit)
  캘리브레이션 실측. Use for: 캘리브레이션의 집합 속성 설명.
- [fstandhartinger/jevbench (RESULTS-v1.2.md)](https://github.com/fstandhartinger/jevbench)
  독립 벤치. Use for: 정확도 기대치 보정.
- [RomanSlack/jev-drone](https://github.com/RomanSlack/jev-drone) · [ably-labs/jev-pong](https://github.com/ably-labs/jev-pong) · [amoghcreator/doom-jev](https://github.com/amoghcreator/doom-jev)
  실시간 루프 사례. "답이 state 안에 있어야 한다"(drone), 227ms/400ms p95(pong), ~10Hz(doom). Use for: 실시간 아키텍처 레슨.
- [hotchpotch/jev-reranker](https://github.com/hotchpotch/jev-reranker)
  RAG 리랭킹 설계. Use for: 리랭킹 질문 구성.

### 통합 아키텍처 (하네스 안 위치 확인용)
- [LangChain partners/typesafe (TypeSafeClassifier, ModelRouterMiddleware)](https://github.com/langchain-ai/langchain/tree/master/libs/partners/typesafe) · [LangChain Blog: Building a harness with Jev](https://www.langchain.com/blog/building-a-harness-with-jev)
- [Vercel AI SDK evaluation 문서 (experimental_evaluate)](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/32-evaluation.mdx)
- [Cloudflare 카탈로그 JSON](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/catalog-models/typesafe-jev.json) · [Pydantic AI typesafe.md](https://github.com/pydantic/pydantic-ai/blob/main/docs/models/typesafe.md)
- [LiteLLM complexity_router/jev_classifier.py](https://github.com/BerriAI/litellm/blob/main/litellm/router_strategy/complexity_router/jev_classifier.py)
  Use for: "라우터·게이트·판정자·압축기" 네 위치가 실제 프레임워크에서 어디에 붙는지.

### 독립 분석 (원리·한계)
- [Gao Dalie (Substack): "Jev: Non-Autoregressive System-1 Model"](https://gaodalie.substack.com/p/jev-the-ultimate-evolution-of-ai)
  아키텍처 심층 해설. Use for: 병렬 샘플러 설명. 접근 불가 → 검색 요약.
- [Turing Post: "What Is Jev AI? Inside TypeSafe's RLCD Model"](https://www.turingpost.com/p/what-is-jev-rlcd) · [systemonemodels.org: RLCD explained](https://systemonemodels.org/guides/rlcd-explained/)
  RLCD 해설. 공개 정보가 세 곳(런치 포스트·docs primer·TechCrunch)뿐임을 명시. Use for: "무엇을 모르는가" 정직하게 말하기.
- [beri.net: 62.6% → 95% 분해 실험](https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval)
- [dev.to (webofmike): agent tool-call risk calibration 벤치](https://dev.to/webofmike/i-benchmarked-jev-on-agent-tool-call-risk-calibration-held-49i3)

### 오픈 재현 (원리 이해용, 실습 제외)
- [com-kotobalabs/open-jev-deberta-v3-large](https://huggingface.co/com-kotobalabs/open-jev-deberta-v3-large) · [AlexWortega/openjev](https://huggingface.co/AlexWortega/openjev) · [multimodalart/jev-reproductions-tracker](https://huggingface.co/spaces/multimodalart/jev-reproductions-tracker)
  cross-encoder + 옵션 그룹 softmax 구조. Use for: "안에서 대략 무슨 일이 일어나는가"를 그림으로 설명할 때.

## Wisdom (Communities)

- [Hacker News 스레드](https://news.ycombinator.com/item?id=49736660)
  아키텍처·prior art 논쟁. Use for: 원리 설명이 실무자에게 통하는지 검증.
- [kenhuangus/jev-usecases Issues](https://github.com/kenhuangus/jev-usecases/issues) · [AbdelStark/awesome-typesafe-jev](https://github.com/AbdelStark/awesome-typesafe-jev)
  설계 질문을 올리거나 유사 사례를 찾는 곳.
- 사용자 커뮤니티 참여 선호: 아직 확인 안 함.

## Gaps
- 컨텍스트 한도 원문 불일치(32K / 64K / 66K). 설계 레슨에서는 "state+최장 질문 32K 가정, 확인 필요"로 둔다.
- RLCD의 보상 함수·데이터셋·재현 가능한 평가는 공개된 것이 없다. 원리 레슨은 "공개된 범위"를 명시해야 한다.
- 공식 쿡북 본문(질문 문구 원문)을 미러에서 읽을 수 없음. 커뮤니티 코드의 질문 문구로 대체.
- 한국어 입력에 대한 성능 자료 없음(jaggedness에 비영어 약점 언급만).
