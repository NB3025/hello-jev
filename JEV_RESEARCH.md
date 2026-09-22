# Jev (TypeSafe AI) 모델 조사 보고서

조사일: 2026-09-22

## 1. 개요

| 항목 | 내용 |
|---|---|
| 개발사 | TypeSafe AI (샌프란시스코, 2024년 설립, 2년간 스텔스) |
| 창업자 | Diogo Almeida (전 OpenAI 연구원, InstructGPT/ChatGPT/RLHF 공동 개발), Erik Gafni, Sasha Sheng |
| 공개일 | 2026-09-15, 제한적 Early Access (대기열 방식) |
| 투자 | DCVC 주도 시드 라운드 US$40M |
| 모델 분류 | "System One Model" (TypeSafe가 새로 정의한 모델 클래스) |
| 이름 유래 | 경제학자 William Stanley Jevons |
| 라이선스 | 독점(proprietary), 가중치 비공개 |

Jev는 LLM이 아니다. 자연어 텍스트를 생성하지 않고, **타입이 정해진 값(typed value) + 확률 + 신뢰도**를 반환한다.
출력은 사람이 읽는 것이 아니라 **다른 소프트웨어가 바로 소비**하는 용도로 설계됐다.
"System One"은 카너먼의 빠르고 직관적인 사고(System 1)에서 따온 이름으로, 느린 추론(System 2)을 하는 LLM과 대비된다.

## 2. 아키텍처

### 2.1 핵심 특징
- **Transformer 기반**이지만 **비자기회귀(non-autoregressive)**. 토큰을 순차 생성하지 않고, 하드웨어 친화적 **병렬 샘플러(parallel sampler)**가 모든 구조화 출력값을 한 번의 쿼리로 동시에 산출한다.
- 학습 데이터는 **100% 합성 데이터(synthetic data)**.
- 학습 방법: **RLCD (Reinforcement Learning for Calibrated Decisions)**.
  - RLHF(사람 선호)나 RLVR(검증 가능한 보상)과 달리, "결정이 맞았는가"와 "모델이 말한 90%가 실제로 약 90%인가"(캘리브레이션)를 동시에 최적화한다.
- 컨텍스트 예산: 약 **32K 토큰** (장문맥 LLM 대비 한 자릿수 낮음).
- 파라미터 수, 레이어 구조 등 세부 스펙은 비공개.

### 2.2 입출력 인터페이스
입력은 **State(상태)** 하나와 **Question(질문)** 여러 개. State는 문자열 또는 JSON 같은 구조화 텍스트.
질문 유형은 3가지:

| 유형 | 설명 | 반환값 |
|---|---|---|
| **Noul** | 예/아니오 명제 | 0~1 확률 하나 (별도 confidence 없음) |
| **Choice** | 최대 255개 라벨 중 하나 선택 | 선택된 key, 옵션별 확률 분포, confidence(0~1) |
| **Score** | 2~10단계 순서형 스펙트럼 위 위치 | 소수 점수 + 전체 분포, confidence |

- confidence는 확률 분포의 형태로부터 도출된다.
- 스키마 밖의 값은 절대 출력하지 않으므로 **형식 오류/문자열 환각이 구조적으로 불가능**하다.
  단, 허용된 옵션 중 **틀린 것을 고르거나 확률을 잘못 매기는 것은 가능**하다.
- 한 번의 호출(~100ms)에 질문 여러 개를 동시에 처리할 수 있다.

### 2.3 커뮤니티 해석
독립 재현(open-jev)들은 Jev를 사실상 **cross-encoder / NLI 분류기의 일반화**로 본다.
State+Question+Candidate를 함께 인코딩하고 질문별 옵션 그룹 안에서 softmax를 취하는 구조로 유사한 동작을 재현했다.

## 3. 성능·비용

| 항목 | 수치 |
|---|---|
| 가격 | 입력 $0.042 / 1M tokens, 출력 무료 |
| 지연시간 | 70~500ms (일반적으로 ~150ms) |
| TypeSafe 자체 주장 | 프론티어 LLM 대비 40~200배 빠름, 40~400배 저렴 (최대 193.6배 / 444.6배) |
| 환각률 | 0% (단, 스키마 매칭 보장에서 정의상 도출된 수치이며 실증치가 아님) |

### 벤치마크 관련 주의점
- 193.6x / 444.6x는 TypeSafe **자체** 4개 업무 워크플로우 평가에서 나왔다. 정답 라벨은 GPT-6 Astra와 Claude Fable 5.1(고추론 모드) 답변의 평균으로 만들었고, 회사도 편향 가능성을 인정했다.
- **독립 테스트**에서는 소형 모델 대비 중위값 2.0~3.6배 빠르고, 최저가 소형 모델 대비 4.7~7.5배 저렴하며, 정확도는 소형 모델과 비슷한 수준으로 나왔다. 광고 수치는 재현되지 않았다.
- 정확도가 **질문 구성 방식에 크게 의존**한다. 한 번에 물으면 62.6%였던 과제를 5개 질문으로 분해하면 95%까지 오른 사례가 보고됐다.

## 4. 유즈케이스

Jev는 LLM을 **대체**하는 것이 아니라 LLM **옆에서** 빠른 판정을 맡는 구성요소로 쓰일 때 가장 잘 맞는다.

### 4.1 에이전트 하네스 내부
- **라우팅**: 모델 선택, 툴 선택, 의도 분류
- **가드레일**: 제안된 툴 호출이 안전한지 / 확인 필요 / 차단 판정
- **컨텍스트 압축**: 과거 툴 결과의 관련성 판정
- **RAG 리랭킹**, **인용 검증(citation check)**, **LLM-as-judge 대체 채점**
- 예: pi-jev(코딩 에이전트 툴 호출 게이트), LangChain/Vercel/Pydantic AI/Cloudflare 통합

### 4.2 콘텐츠 모더레이션·안전
- 스팸, 괴롭힘, 사기, 독성, 자해, 정책 위반 여부를 한 호출에 여러 질문으로 동시 판정

### 4.3 분류·라우팅·스코어링
- 고객지원 티켓/이메일/문서를 담당 팀·큐로 배정
- 리드 스코어링, 리스크 평가, 긴급도·불만도·품질 순위 매기기

### 4.4 실시간 루프
- **게임**: DOOM을 약 10 decisions/sec로 플레이(시간당 약 $7), Pong 데모 평균 227ms / p95 400ms
- 로봇, 드론, 주행 시뮬레이터 등 밀리초 단위 결정이 필요한 곳

### 4.5 데이터 파이프라인
- 레이크하우스(Apache Iceberg 등)에서 대량 레코드 분류·태깅

## 5. 한계

- 자유 텍스트 생성, 코드 작성, 대화 불가.
- **근거(rationale)를 제공하지 않음**: 숫자만 반환하므로 디버깅과 규제 산업 감사에 불리.
- 캘리브레이션은 집합 단위 속성. 개별 0.8 예측은 여전히 틀릴 수 있음.
- 컨텍스트 32K 제한.
- 질문 설계(프롬프트 엔지니어링에 해당)에 따라 정확도 편차가 큼.
- 독점 모델, 가중치 비공개, Early Access 대기열.

## 6. 접근 경로

- TypeSafe 네이티브 API (docs.typesafe.ai) 및 SDK
- Vercel AI Gateway (`experimental_evaluate`, 2026-09-25까지 무료, ZDR/no-training 옵션)
- Cloudflare Workers AI
- Pydantic AI 통합
- LangChain 하네스 가이드

## 7. 오픈소스 재현 (비공식)

| 프로젝트 | 내용 |
|---|---|
| AlexWortega/openjev | Qwen3.5-4B를 3-class NLI cross-encoder로 파인튜닝, 이미지 입력 가능, DOOM 플레이 |
| com-kotobalabs/open-jev-deberta-v3-large | DeBERTa-v3-large 기반. 18K states / 42K questions, 1 epoch, H100 229초(≈$0.25). in-domain 0.847, OOD 0.678 |
| C-Tianyu/NanoJev | state/question/candidate-set 인터페이스 재현 |
| featherless-ai/simple-jev | 아무 오픈 모델의 next-token logits로 Jev 스타일 JSON 응답 생성 |
| multimodalart/jev-reproductions-tracker | 재현 프로젝트 모음 HF Space |

## 8. 요약

Jev는 "말하는 AI"가 아닌 "결정하는 AI"다. LLM 하네스 안에서 라우팅·가드레일·채점처럼 **닫힌 선택지에서 빠르고 싸게 확률적 판정**을 내리는 역할에 특화되어 있다.
속도·비용 이점은 실재하지만 광고 수치보다는 작으며, 정확도는 질문 설계에 좌우된다. LLM 대체가 아닌 **보완 프리미티브**로 이해하는 것이 정확하다.

## 출처

- https://en.wikipedia.org/wiki/Jev_(AI_model)
- https://typesafe.ai/blog/introducing-system-one-models-and-jev
- https://docs.typesafe.ai/api
- https://docs.typesafe.ai/concepts/use-case-map
- https://techcrunch.com/2026/09/18/a-new-kind-of-ai-model-from-a-chatgpt-inventor-is-thrilling-developers/
- https://www.dcvc.com/news-insights/typesafe-emerges-from-stealth-with-a-new-way-of-doing-ai/
- https://www.langchain.com/blog/building-a-harness-with-jev
- https://www.datacamp.com/blog/system-one-models-jev
- https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/
- https://www.requesty.ai/blog/typesafe-jev-explained
- https://www.firecrawl.dev/blog/what-is-jev
- https://gaodalie.substack.com/p/jev-the-ultimate-evolution-of-ai
- https://www.mindstudio.ai/blog/jev-system-one-model-launch
- https://www.eigent.ai/ko/blog/typesafe-ai-jev-system-one-models
- https://www.digitaltoday.co.kr/en/view/105587/typesafe-ai-jev-probability-model-draws-developers-attention
- https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk
- https://developers.cloudflare.com/ai/models/typesafe/jev/
- https://pydantic.dev/docs/ai/models/typesafe/
- https://www.cloudraft.io/blog/top-use-cases-of-jev-typesafe-ai-model
- https://www.ayautomate.com/blog/jev-vs-llm-benchmark
- https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval
- https://xenospectrum.com/en/jev-typesafe-bert-classifier-decomposition/
- https://dev.to/miruky/jev-does-not-replace-the-llm-it-changes-who-owns-the-decision-3n6
- https://github.com/ably-labs/jev-pong
- https://github.com/amoghcreator/doom-jev
- https://github.com/y0usaf/pi-jev
- https://github.com/AbdelStark/awesome-typesafe-jev
- https://huggingface.co/AlexWortega/openjev
- https://huggingface.co/com-kotobalabs/open-jev-deberta-v3-large
- https://huggingface.co/spaces/multimodalart/jev-reproductions-tracker
