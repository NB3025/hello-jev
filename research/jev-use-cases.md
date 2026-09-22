# Jev (TypeSafe AI "System One Model") 유즈케이스 조사

조사일: 2026-09-22
대상 모델: Jev (`jev-1.13.0`, 별칭 `jev-latest`), TypeSafe AI, 2026-09-15 얼리액세스 공개

## 요약

Jev는 텍스트를 생성하지 않고 **State(상태) + 타입이 정해진 질문(Choice / Score / Noul)** 을 받아 **선택지·점수·확률과 confidence** 만 돌려주는 모델이다. TypeSafe 공식 use-case map은 이를 다섯 축(AI 자동화 소프트웨어, 실시간 애플리케이션, 빅데이터 AI Map-Reduce, 범용 검증, 하네스 엔지니어링)으로 정리하고, 그 아래에 검색/RAG, 모델 라우팅, LLM 가드레일, 시맨틱 린팅, 피처 추출, 고객지원, 리드 스코어링, 보험/금융범죄/법률/모더레이션/광고/게임/리스크/수요예측/지식그래프 등 산업별 결정 목록을 둔다([docs.typesafe.ai/concepts/use-case-map](https://docs.typesafe.ai/concepts/use-case-map), 미러: [thiagoadril/typesafe-docs](https://github.com/thiagoadril/typesafe-docs)). 공개 1주일 만에 커뮤니티가 150여 개 프로젝트를 만들었고([cobanov/awesome-jev](https://github.com/cobanov/awesome-jev)), 그중 실측치가 붙은 것은 **에이전트 툴콜 게이트(pi-jev, ~300 ms 4문항 1회)**, **Pong(평균 227 ms / p95 400 ms)**, **DOOM(~10 Hz, ~$7/시간)**, **드론 시뮬(2.5 Hz, 0.11 s 중위)**, **이메일 트리아지(1,000통/1분/3센트)**, **RAG 리랭킹(공식 쿡북 top-1 5%→18%)**, **LLM-as-judge 대체(Fable 5.1과 91.5% 일치, $160/백만 건)** 등이다. 독립 벤치마크는 공통적으로 (1) 속도·비용 이점은 실재하지만 TypeSafe 광고치(193.6x/444.6x)보다 작고, (2) 정확도는 **질문을 어떻게 쪼개느냐**에 크게 좌우되며(피싱 판별 62.6% → 5문항 분해+회귀 95.0%), (3) 임계값은 데이터셋 간에 이전되지 않으므로 자기 데이터로 캘리브레이션해야 한다고 결론 낸다. 자유 텍스트·코드 생성·근거 설명·산술/날짜 비교·32K 초과 컨텍스트는 맞지 않는 용도다.

### 표기 규칙

- **[공식]** TypeSafe 자체 자료(docs.typesafe.ai, typesafe.ai 블로그, evals.typesafe.ai). 이번 조사에서는 docs.typesafe.ai 직접 접근이 차단되어 **GitHub 미러(thiagoadril/typesafe-docs, 2026-09-16~18 추출)** 와 검색 요약으로 확인했다.
- **[독립]** 커뮤니티 리포지토리 코드/README, 제3자 벤치마크, 프레임워크 벤더 문서.
- **[검색요약]** 원문 페이지를 직접 열지 못하고 검색 엔진 요약으로만 확인한 수치. 정확한 문맥은 "확인 못한 것"에 정리했다.

---

## 1. 공식 use-case map

### 1.1 다섯 개의 상위 카테고리 [공식]

출처: [docs.typesafe.ai/concepts/use-case-map](https://docs.typesafe.ai/concepts/use-case-map) (미러 `docs/013-example-use-cases-typesafe-ai.md`)

| 카테고리 | TypeSafe 설명 요지 |
|---|---|
| **AI Automation Software** | 코드가 제어 흐름을 소유하고, Jev가 의미 판단·언어 이해만 맡아 "사람 코파일럿 없이 백그라운드에서 백만 번" 돌릴 수 있는 자동화 |
| **Real-time applications** | "프론티어 지능을 실시간 속도(150 ms)로" — 게임 플레이, UI 내장 |
| **AI Map Reduce over Big Data** | "100배 저렴"하므로 거대 코퍼스 검색, 대량 에이전트 트레이스 분류, 예측용 피처 추출 |
| **Universal Verification** | 다른 AI/LLM의 입력 프롬프트, 추출 결과, 추론 트레이스, 툴콜을 검증 — 탈옥, 인용 오류, 환각, 실수 탐지 |
| **Harness Engineering** | "모델 라우팅, 시맨틱 컨텍스트 검색, LLM 오류 탐지와 가드레일, 추론 트레이스 분류를 초고속·초저가로" |

### 1.2 산업/워크플로 모듈 목록 [공식]

같은 페이지의 "Example automation use cases" 절이 나열하는 모듈과 각 모듈의 결정 내용:

| 모듈 | 무엇을 결정하는가 (공식 문구 요약) |
|---|---|
| **Search and retrieval** (`rag_retrieval`) | RAG의 임베딩을 대체/보완, 쿼리–후보 관련성 점수, 쌍 비교 리랭킹, 크로스 인코딩, 다운스트림용 컨텍스트 선택 |
| **Scientific discovery** | 체계적 문헌고찰 포함/배제 스크리닝, 인터뷰/설문 테마 라벨링, **인용 구절이 주장을 지지하는지 검사**(`citation_check`), 방법론 누락 플래그, 지식그래프용 엔티티·관계 식별 |
| **Model routing** (`model_routing`) | 프롬프트별로 어떤 LLM에 보낼지 커스텀 라우터, 의도·도메인 분류, 난이도·리스크 추정, 비싼 모델로 에스컬레이션 |
| **LLM guardrails** (`llm_guardrails`) | 모든 LLM 입력·출력·툴콜에 시맨틱 체크, 탈옥/프롬프트 인젝션 탐지, 정책 위반·민감정보 노출, 툴콜 오류·응답 품질 실패 실시간 탐지, 구조화 로그 |
| **Semantic code linting** (`semantic_linting`) | 팀 코딩 컨벤션·글쓰기 가이드를 자동 시맨틱 린트로, CI에서 실행 |
| **Feature extraction for predictive modeling** | 자연어에서 확률 피처 추출 → 구조화 데이터와 합쳐 ML 모델 학습, autoresearch로 피처 정의 제안 |
| **Recruiting** | 이력서/지원서/면접 피드백을 명시적 직무 기준으로 평가, 역량 증거 점수, 매칭, 라우팅, 불확실 건 사람 검토 |
| **Lead generation** (`lead_generation`) | 회사 프로필·임원 약력·인바운드 메시지를 ICP에 매칭, 산업 적합도·성숙도 점수, 구매 의도 탐지, 우선순위·라우팅 |
| **Customer support** (`customer_support`) | 티켓을 이슈/제품 영역/의도로 분류, 통화 기록에서 이슈·약속·후속 추출, 긴급도·불만·이탈위험·환불요청 탐지, 팀/큐/자동화로 라우팅, 응답을 정책과 대조 검증 |
| **Insurance claims** | FNOL/조정자 노트/서류 분류, 복잡도·누락정보·사기 지표, STP vs 전문가 검토 우선순위 |
| **Financial crime** | 거래 내러티브·KYC·알림 이력 평가, 불일치 이름 엔티티 매칭, 알림 우선순위 |
| **Legal and compliance** | 계약/정책/공시/마케팅 클레임 분류, 누락 조항·금지 클레임·정책 위반 탐지 |
| **E-commerce marketplaces** | 리스팅 정규화, 속성 추출, 금지 리스팅·위조·리뷰 어뷰즈 탐지 |
| **Moderation and trust & safety** | 회사별 기준으로 독성·괴롭힘·스팸·사기·위험 조언·개인정보·옵트아웃·정책위반 클레임 탐지, **severity와 confidence를 결합해 allow/warn/review/block** |
| **Advertising** | 브랜드 안전, 오디언스 적합성, 규제 준수, 광고–랜딩페이지 정합성 |
| **Gaming** (`gaming`) | 채팅 모더레이션, 어뷰즈·의심 행동, 불만/몰입 점수, 이탈 신호, 플레이어 지원 라우팅 |
| **Risk assessment** | 사고보고·클레임·거래·벤더 평가를 확률 리스크 지표로 |
| **Demand forecasting** | 문의/영업노트/리뷰/티켓에서 구매의도·긴급도·공급우려·경쟁압력 추출 → 시계열 모델 피처 |
| **Graphs and knowledge graphs** | 관계·엔티티 타입 분류, 모순 탐지, 확률적 트래버설, 계층 분류 |

괄호 안 snake_case 이름은 TypeSafe 문서의 모듈을 그대로 구현한 [kenhuangus/jev-usecases](https://github.com/kenhuangus/jev-usecases)의 모듈명이다. 그 README는 이를 두 묶음으로 정리한다 [독립]:

- **Routing and triage**: `customer_support`, `model_routing`, `lead_generation`, `gaming`, `agent_harness`
- **Verification and guardrails**: `llm_guardrails`, `rag_retrieval`, `citation_check`, `agent_trace`, `semantic_linting`, `coding_agent_guardrails`
- 그 외 `security_incidents`, `invoice_processing`, `insurance_claims`, `financial_crime`, `legal_compliance`, `risk_assessment`, `recruiting`, `ecommerce`, `moderation`, `advertising`, `demand_forecasting`, `knowledge_graph`, `feature_extraction`, `function_calling`, `hierarchical_classification`, `scientific_discovery` 등 총 27개 Jev 전용 러너 + 3개 LLM 결합 보안 러너 + 7개 SOC 에이전트.

`agent_trace`, `agent_harness`, `coding_agent_guardrails`는 공식 use-case map의 산업 목록에 별도 항목으로는 없고, 공식 "Harness Engineering" 카테고리와 [evals.typesafe.ai](https://evals.typesafe.ai/)의 "Agent Trace Observability" 워크플로, 공식 [skill_suggestion 쿡북](https://docs.typesafe.ai/cookbooks/skill_suggestion)에 대응한다.

### 1.3 결정 형태(task shape) 표 [공식]

| 결정 형태 | 언제 | 예시 |
|---|---|---|
| Classification | 알려진 카테고리 하나가 이겨야 할 때 | 의도, 토픽, 부서, 리스크 유형 |
| Detection | 한 속성의 존재 확률이 필요할 때 | 스팸, 사기, 긴급도, 탈옥, 민감정보 |
| Scoring | 답이 순서형 루브릭 위에 있을 때 | 심각도, 관련성, 품질, 불만 |
| Routing | 카테고리가 다음 코드 경로를 고를 때 | 툴 사용, 에스컬레이션, 모델 라우팅, 지원 큐 |
| Search / Retrieval / Ranking | 자연어 쿼리로 항목 찾기·정렬 | 시맨틱 검색, RAG 컨텍스트, 추천 |
| Verification | 산출물의 특정 실패 모드 점검 | 인용 지지, 정책 위반, 툴콜 오류 |
| ML Feature Extraction | 고전 ML 모델용 의미 신호 | 구매 의도, 경쟁 압력, 이탈 신호 |
| Structured Data Extraction | 비정형 입력에서 알려진 필드 복원 | 후보 속성, 주문 필드, 문서 라벨 |

### 1.4 공식 패턴과 쿡북 [공식]

패턴 페이지([docs.typesafe.ai/patterns](https://docs.typesafe.ai/patterns)):

| 패턴 | 내용 | 공식 예시 |
|---|---|---|
| Speculative Fan-Out | 필요할 수도 있는 질문까지 한 호출에 전부 넣고 코드가 관련 답만 사용. "모든 질문은 병렬 평가되므로 질문을 더해도 보통 지연이 늘지 않는다" | 지원 티켓: `category`(Choice) + `bug_severity`(Score) + `has_reproducible_steps`/`refund_requested`(Noul) + `frustration`(Score) 한 번에 ([fan-out](https://docs.typesafe.ai/patterns/fan-out)) |
| Confidence-Gated Routing | 답은 "무엇", confidence는 "행동할지". 리스크별로 임계값을 달리 | 음성 뱅킹: confidence<0.6 → 사람, `check_balance`는 0.6이면 실행, `approve_transfer`는 >0.85만 자동, 그 미만은 재확인 ([confidence-routing](https://docs.typesafe.ai/patterns/confidence-routing)) |
| Composite Scoring | 복합 판단을 원자 Score로 쪼개고 코드에서 가중 합산 | 이력서: `python_depth`/`team_leadership`/`system_design`/`generalist` 각 5단계 Score → IC용·EM용 가중치 다르게 ([composite-scoring](https://docs.typesafe.ai/patterns/composite-scoring)) |
| Intent Routing | 의도 분류 후 결정적 코드 / 전문 LLM / 사람 중 핸들러 선택 | `intent`(Choice 4개) + `complexity`(Score 3단계), confidence<0.5면 사람 ([intent-routing](https://docs.typesafe.ai/patterns/intent-routing)) |

쿡북(미러의 frontmatter description으로 확인, 본문은 미러에서 제거됨):

- [Re-ranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe): CLERC 법률 쿼리 40개, BM25 30개 후보 → 쿼리–후보 쌍당 질문 1개로 **top-1 5%→18%, top-10 38%→62%**.
- [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions): GDPR 위키 문서에 13문항 규제 브리핑, 한 호출로 배치하면 **12.2배 저렴·10.0배 빠름, 답 변화 없음** (primitives 페이지는 같은 실험을 11.5x/9.6x로 인용 — 버전 차이로 보임).
- [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion): Hermes 카탈로그 182개 스킬 중 최대 1개 선택. 1차 요청이 전체 랭킹 + "스킬이 필요한가", 2차가 상위 3개 정독 후 전부 거부 가능. 잘못 로드·불필요 로드 모두 절반 이상 감소.
- [Classifying RAG passages](https://docs.typesafe.ai/cookbooks/classifying_rag_passages): 검색 구절마다 1요청, 질문과 모순되는 구절은 유지·플래그, 숨은 지시/프롬프트 인젠션 구절은 드롭.
- [Double-checking citations](https://docs.typesafe.ai/cookbooks/citation_check): Choice 1문항으로 인용 문맥이 주장을 지지하는지, confidence로 사람 검토 플래그.
- [Guardrails for LLMs](https://docs.typesafe.ai/cookbooks/llm_guardrails): 입·출력 메시지마다 1요청으로 위험 Noul("탈옥 시도인가?") + 심각도 Score("따르면 얼마나 해로운가?") → pass/review/block/route.
- [Function calling](https://docs.typesafe.ai/cookbooks/function_calling): 트레이딩 자연어 요청 → 함수명·닫힌 인자 집합을 Choice/Noul로.
- [Hierarchical classification](https://docs.typesafe.ai/cookbooks/hierarchical_classification): 특허/소매/생의학/소스코드 계층을 Choice 확률 병렬 빔서치로.
- [Classification using confidence](https://docs.typesafe.ai/cookbooks/classification_using_confidence): SEC 연차보고서를 75개 산업그룹 Choice 1개로 분류, confidence 낮으면 상위 division으로 롤업.
- [Smart home demo](https://docs.typesafe.ai/demos/smart-home): "집 전체 불 꺼" → 카테고리/도메인/기기/액션을 speculative 질문으로 한 번에; 복합 명령 여부 Noul이 참이면 LLM이 분할.

---

## 2. 카테고리별 유즈케이스와 구체 사례

### 2.1 에이전트 라우팅 / 툴·스킬·모델 선택

- **[독립] LangChain `ModelRouterMiddleware`** — Jev Choice로 `fast`(예: `openai:gpt-5-mini`, "Simple, well-scoped tasks") vs `powerful` 중 "가장 저렴하면서 적합한 모델"을 고른다 ([langchain_typesafe README](https://raw.githubusercontent.com/langchain-ai/langchain/master/libs/partners/typesafe/README.md); 블로그 [Building a Harness with Jev](https://www.langchain.com/blog/building-a-harness-with-jev), 검색요약).
- **[독립] LiteLLM complexity router** — 프롬프트+시스템 프롬프트를 `state`로, `tier` Choice 1문항으로 티어 분류. 벤치마크에서 **Haiku 대비 5.43배 빠름(중위 126.81 ms vs 688.40 ms), 분류 비용 96.12% 절감, 기대 티어 일치 95.00% vs 73.75%** — 단 라벨은 합성 프롬프트에 저자가 붙인 것 ([litellm jev_classifier.py](https://raw.githubusercontent.com/BerriAI/litellm/main/litellm/router_strategy/complexity_router/jev_classifier.py); [LiteLLM 블로그](https://docs.litellm.ai/blog/jev-auto-router-benchmark), 검색요약).
- **[독립] kenhuangus `model_routing`** — `model`(Choice, fast/balanced/powerful) + `domain`(Choice 5) + `difficulty`(Score) + `needs_tools`/`high_risk`(Noul). `high_risk ≥ 0.70` 또는 `difficulty ≥ 1.6`이면 강한 모델로, confidence < 0.72면 confirm 밴드 ([model_routing.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/model_routing.py)).
- **[독립] 툴 선택 벤치마크** — [baibizhe/jev-decision-benchmarks](https://github.com/baibizhe/jev-decision-benchmarks): MetaTool 유사도구 선택 77.79%, 0-shot abstention 87.04%(ChatGPT 69.05/50.35); When2Call 74.84% acc / macro-F1 56.55; BFCL V4 relevance 87.50%(Claude Opus 4.5·Qwen3-235B와 동률), irrelevance 86.74%(Gemini 2.5 Flash 93.67%에 뒤짐). 지연·비용 미측정.
- **[독립] 기타** — Jevonian(코딩 에이전트 프록시, 결정적 필터 후 Jev가 모델·thinking 레벨 선택, `minConfidence` 미달은 원장에 기록), JevRouter(모델/서브에이전트/스킬/MCP 툴을 Choice 하나로), jev-skill-router(Claude Code 훅, shadow 모드 시작), Composio(툴 shortlist→Choice→닫힌 인자 매핑), Vercel Eve(`auto` 라우터 기본이 Jev) — 모두 [cobanov/awesome-jev](https://github.com/cobanov/awesome-jev) / [AbdelStark/awesome-typesafe-jev](https://github.com/AbdelStark/awesome-typesafe-jev) 목록 및 각 README.

### 2.2 에이전트 가드레일 (툴콜 게이팅)

- **[독립] y0usaf/pi-jev** — Pi 코딩 에이전트의 `bash`/`write`/`edit` 호출 전에 4문항을 한 요청으로(≈300 ms):

  | 질문 | 타입 | 임계값 |
  |---|---|---|
  | Is this action destructive? | noul | 0.90 |
  | 로컬 데이터/시크릿을 외부로 보내는가? | noul | 0.70 |
  | 사용자가 요청한 범위를 넘는가? | noul | 0.85 |
  | 원치 않았다면 피해가 얼마나? (4단계) | score | 2.50 (minConfidence 0.5) |

  임계값은 실측으로 정했다: 정상적인 요청된 `sed -i` 편집도 `destructive` 0.73~0.85까지 나오므로 0.7이면 매번 프롬프트가 떴을 것이고, 진짜 `rm -rf src && git push --force`는 0.99. 첫 초안 질문("버전관리에서 복구 불가능한가?")은 같은 명령을 0.77로만 평가 → "git에 있다"는 추론 경로 때문. 평이한 문구로 바꾸자 0.03 vs 0.99로 분리. 출력 판정기(`leaks_secret` noul 0.90, `failure_class` choice 6개 confidence 0.60)는 53개 픽스처×3회 = 203요청, 0 실패, 요청당 490토큰, **중위 126 ms**. 기본은 shadow 모드, 모든 오류 경로 fail-open ([README](https://github.com/y0usaf/pi-jev), [gate.ts](https://github.com/y0usaf/pi-jev/blob/main/src/gate.ts)).
- **[독립] kenhuangus `coding_agent_guardrails`** — 8개 안전 명제 Noul(`intent_coverage`, `no_secret_egress`, `no_irreversible_damage`, `local_scope`, `path_not_protected`, `no_fetched_code_execution`, `prompt_injection_absent`, `policy_compliance`) + `risk_class` Choice(read_only/reversible/irreversible) + `severity` Score. 어느 하나가 `≤ 1-0.85`면 block, `< 0.75`면 ask, 아니면 allow. 보호 경로 매칭 등 결정적 검사는 Jev 호출 전에 코드로 ([coding_agent_guardrails.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/coding_agent_guardrails.py)).
- **[독립] LangChain `AutoModeMiddleware`** — `NoulCriteria(true="The call writes, deletes, publishes, or changes access.", false="only reads…")`로 특정 툴을 감시, 리스크 확률이 임계값 이상이면 에러 `ToolMessage` 반환 ([README](https://raw.githubusercontent.com/langchain-ai/langchain/master/libs/partners/typesafe/README.md)).
- **[독립] OpenRouter 쿡북 "Gate Agent Tool Calls with Jev"** — `onToolCalled` 훅이 제안된 호출+티켓+정책을 한 요청으로 보내고 approve/block/review 고정 임계값. "확신 있는 benign만 사람 검토를 건너뛰고, dangerous 쪽으로 기울면 즉시 reject"하는 비대칭 정책 ([openrouter.ai 쿡북](https://openrouter.ai/docs/cookbook/building-agents/gate-tool-calls-with-jev), 검색요약).
- **[독립] Pydantic AI 공식 예제** — `Handling(verdict: Enum[run/reject/ask], irreversible: bool)`을 `output_type`으로 두고 `agent.run_sync('rm -rf ./build')` ([pydantic-ai docs](https://raw.githubusercontent.com/pydantic/pydantic-ai/main/docs/models/typesafe.md)).
- **[독립] 실측 연구**
  - [AnshChoudhary/typesafe-ai-firewall](https://github.com/AnshChoudhary/typesafe-ai-firewall) (report.md): 합성 600건(캘리브레이션 280/홀드아웃 320), 5개 위험 Noul 배터리(자격증명, 인젝션, 유출, 범위 이탈, 비가역성). 공격 탐지 100%, 정상 차단 0.55%, hard-negative FP 0%. **단일 질문 "위험한가?"는 정상 hard-negative 39%를 차단, 배터리는 0%**. ECE 0.156(목표 0.10 미달, `irreversible`은 0.277로 과소확신). p50 375 ms / p95 595 ms, 호출당 $0.0000365.
  - [eugeniughelbur/jev-engineering](https://github.com/eugeniughelbur/jev-engineering): 300회 인젠션 키트 — 노골적 인젠션은 위험 명령 30개 중 0개를 통과시켰지만 안전 명령 10%를 오탐, 권위 프레이밍은 30개 중 3개 이동 (awesome-list 요약).
  - [ghubnab99 111-case action-gate](https://github.com/ghubnab99/jev-enterprise-decision-fabric/blob/main/docs/evaluations/agent-action-gate-v1.md): Jev 100/111 vs Claude 102/111 라벨 일치, 각 1건 unsafe allow. 오류의 최대 원인은 모델이 아니라 계약·정책 매핑 (AbdelStark 목록 요약).
  - dev.to "I Benchmarked Jev on Agent Tool-Call Risk. Calibration Held."([webofmike](https://dev.to/webofmike/i-benchmarked-jev-on-agent-tool-call-risk-calibration-held-49i3)) — 제목만 확인, 본문 접근 불가.

### 2.3 콘텐츠 모더레이션

- **[공식]** use-case map: 회사별 기준으로 독성/괴롭힘/스팸/사기/위험 조언/개인정보/옵트아웃 탐지, "severity와 confidence를 결합해 allow, warn, review, block". [Self-consistency: choices 쿡북](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)은 threat/spam/general Choice에 명시적 `uncertain` 결과를 두라고 권고 (Anil-matcha 목록 인용).
- **[독립] kenhuangus `moderation`/`gaming`** — `abuse`/`cheating` Noul + `frustration`/`engagement` Score + `support_intent`/`action` Choice. `cheating ≥ 0.70` 또는 `abuse ≥ 0.85` → ban_review(confirm), `abuse ≥ 0.70` → mute_warn(auto) ([gaming.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/gaming.py)).
- **[독립] 커뮤니티** — [ohernandezdev/jevmod](https://github.com/ohernandezdev/jevmod)(카테고리별 확률, 임계값은 사용자 소유, Discord/Telegram/Reddit 봇), [Zafer-Liu/jev-demo-moderator](https://github.com/Zafer-Liu/jev-demo-moderator)(스팸/어뷰즈/경계 라우팅 "≈$20/백만 코멘트", 검색요약), Jevtown/Crowdcheck(1만 페르소나 시뮬, 7개 모더레이션 질문 포함), [bitnovus/jev-spam-eval](https://github.com/bitnovus/jev-spam-eval)(제로샷 스팸 vs TF-IDF, 사후 튜닝 주의). 한 코멘트에 "스팸인가(Noul) / 얼마나 불친절한가(Score 0–3) / 무엇을 할까(Choice)" 3문항 → publish/review/delete 예시 (OpenTweet, 검색요약).
- **[독립] 주의** — [jujumilk3/jev-calibration-audit](https://github.com/jujumilk3/jev-calibration-audit) (FINDINGS.md): KoBBQ 애매 문항 300개에서 "unknown" 선택지가 있으면 95% 기권, 없으면 **79%가 스테레오타입 답을 confidence 0.793으로** 냄 → 모더레이션/분류 스키마에 반드시 기권 옵션.

### 2.4 RAG 리랭킹과 인용 검증

- **[공식]** 리랭킹 쿡북 top-1 5%→18% (1.4절). RAG 구절 분류 쿡북은 관련성/답 지지/모순/인젝션을 구절당 1요청으로.
- **[독립] hotchpotch/jev-reranker** — `relevance_rerank(query, docs, threshold=0.2)`: 답의 증거로서의 유용성을 Noul로 점수화, 정렬 후 임계값 미만 제거, 아무것도 안 남으면 재검색/기권. 긴 후보 목록 자동 분할, 동기/비동기 ([README](https://github.com/hotchpotch/jev-reranker)). [shinpr/jev-reranker](https://github.com/shinpr/jev-reranker)(Rust CLI: 랭킹/증거 필터/추출 압축을 각각 별 Noul로), [WiktorB2004/llama-index-jev](https://github.com/WiktorB2004/llama-index-jev)(Score 0–3 루브릭, 코사인 유사도 아님), NeuroLink·LiteLLM의 툴 결과 압축 게이트.
- **[독립] kenhuangus `rag_retrieval`/`citation_check`** — 구절별 `relevance`(Score) + `supports_answer`/`contradicts_query`/`prompt_injection`/`sensitive`(Noul); `prompt_injection ≥ 0.70` 또는 `sensitive ≥ 0.85`면 드롭. 인용은 `support` Choice(supports/partial/contradicts/unrelated) + `quote_faithful`/`overclaim` Noul + `evidence_strength` Score; `supports ∧ faithful ≥ 0.70 ∧ overclaim ≤ 0.30 ∧ conf ≥ 0.72`만 자동 수락, contradicts는 block+`flag:hallucinated_citation` ([rag_retrieval.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/rag_retrieval.py), [citation_check.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/citation_check.py)).
- **[독립] 벤치마크/주의** — [anessbelbati/jev-rerank-bench](https://github.com/anessbelbati/jev-rerank-bench) 14개 데이터셋(원응답·부트스트랩 CI·순서 민감도·무관련 문서 테스트 포함). [yodablocks/jev-orderby-bench](https://github.com/yodablocks/jev-orderby-bench): 20 Newsgroups 토픽 멤버십은 6개 랭킹 게이트 통과, Amazon ESCI 사람 등급 상품 관련성은 6개 중 4개 실패; 360행 중 53행이 0.99로 동점; **40행 배치 상태로 보내면 1행/요청일 때 통과하던 게이트가 실패** → "좋은 분류기가 자동으로 좋은 정렬 키는 아니다". [Hippo Memory](https://github.com/kitfunso/hippo-memory) 저자 연구: 랭킹은 좋아졌지만 로컬 크로스인코더 대비 답 품질 향상은 미확인.

### 2.5 LLM-as-judge / 채점

- **[독립] Langfuse "Using TypeSafe's Jev for evals"** — LLM-judge 프롬프트 vs Jev Noul("사용자가 불만을 표했는가") 비교, Langfuse generation을 끌어와 Jev로 채점하고 스코어를 되쓰는 파이썬 스크립트. 인용된 Good Start Labs 결과: **6,003개 루브릭 체크에서 Claude Fable 5.1 판정과 91.5% 일치, 백만 건 채점 비용 $160 vs Fable $33,000(GPT-5.6 Luna $400, Gemini 3.8 Flash $1,600)**. 연속 점수 분산이 Luna/Terra/Sonnet 4.6 대비 92–913배 낮음 ([langfuse.com 블로그](https://langfuse.com/blog/2026-09-18-using-typesafes-jev-for-evals), [Reticle 해설](https://www.reticle.sh/blog/jev-vs-llm-as-judge) — 모두 검색요약). Reticle의 경고: "91.5%가 훌륭한지 쓸모없는지는 나머지 8.5%가 어디에 몰려 있는지에 달렸다", Jev는 근거를 쓰지 못한다.
- **[독립] LangChain "Can Jev Be a Better Agent Evaluator?"** — 4개 워크플로 평균 **Jev 68% 정확도, 건당 $0.0004, 0.4초 / GPT-5.6 Terra 68%, $0.03, 10초 / Opus 5 73%, $0.18, 38초** ([langchain.com](https://www.langchain.com/blog/jev-agent-evals-langsmith), 검색요약). 이 수치는 TypeSafe의 evals.typesafe.ai 정답(GPT-6 Astra·Fable 5.1 고추론 답의 평균) 기준.
- **[공식] evals.typesafe.ai** — security_incidents / invoice_processing / customer_service / agent_trace_observability 4개 워크플로. 정답은 "GPT-6 Astra와 Claude Fable 5.1 high thinking과의 일치"이며 사람 라벨이 아님 (kenhuangus README가 명시). Jev 평균 일치 67.8% (검색요약).
- **[독립] 도구** — [allebee/pytest-jev](https://github.com/allebee/pytest-jev)(LLM 출력에 대한 Noul 주장 배치, 성립 ≥0.8 / 불성립 ≤0.2), [lukstei/slop-grader](https://github.com/lukstei/slop-grader), [mblode/taste-lint](https://github.com/mblode/taste-lint), [danielgshea/jev-as-a-judge](https://github.com/danielgshea/jev-as-a-judge), Arize 블로그 "Can Decision Models Replace LLM Judges?"([arize.com](https://arize.com/blog/typesafe-jev-llm-judge/), 제목만 확인).
- **[독립] kenhuangus `agent_trace`** — `goal_met`/`policy_ok`/`tool_misuse`/`customer_harm`/`needs_review`(Noul) + `urgency`(Score 3단계) + `issue_type`(Choice). `customer_harm ≥ 0.70` 또는 `tool_misuse ≥ 0.85` → review_immediate; 둘 다 정상이면 close_trace + QA 샘플링 ([agent_trace.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/agent_trace.py)).

### 2.6 스코어링과 우선순위 (리드, 리스크, 긴급도)

- **[공식]** Composite Scoring 패턴(1.4절), use-case map의 Lead generation / Insurance / Financial crime / Risk assessment.
- **[독립] kenhuangus `lead_generation`** — `industry_fit`/`size_fit`/`buyer_relevance`/`pain_match`/`disqualified`(Noul) + `purchase_intent`(Score 4단계) + `priority`(Choice discard/nurture/sdr_queue/ae_hot). `disqualified ≥ 0.70`이면 즉시 폐기, 나머지는 코드가 가중합 composite(≥0.75∧intent≥0.5 → ae_hot, ≥0.55 → sdr_queue, ≥0.35 → nurture). 모델의 `priority` 선택이 코드 결정과 다르고 confidence가 높으면 플래그 ([lead_generation.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/lead_generation.py)).
- **[독립] SOC / 보안 사고** — kenhuangus `soc_triage`(8개 닫힌 질문 → auto_close/notify_user/queue_tier2/contain_now), `soc_mitigation`(격리·세션 취소·자격증명 리셋·측면이동 차단 각각 승인/보류, 핵심 자산은 항상 confirm+`page:security_oncall`), `soc_recovery`(격리 경과 시간은 **호출자가 계산해 넘김**, Jev는 시간 계산 안 함). 공식 [Security Incidents 워크플로](https://evals.typesafe.ai/security_incidents): `unauthorized`/`explained_by_record` Noul + `evidence_strength` Score + `asset_tier` Choice → close/queue/notify/containment (Anil-matcha 플레이북 재구성).
- **[독립] 로그/알림 우선순위** — [jyatesdotdev/jev-logtriage](https://github.com/jyatesdotdev/jev-logtriage)(Loki 로그 배치에 Noul/Score/Choice → suppress/watch/review/notify/page), [reachjalil/jevlogs](https://github.com/reachjalil/jevlogs)(OTel 로그, 비싼 분석 전 사전 필터), [koala73/worldmonitor](https://github.com/koala73/worldmonitor)(헤드라인 심각도·토픽 배치 분류, 실패 시 폴백).
- **[독립] 기타 스코어링** — 보험 클레임(kenhuangus `insurance_claims`: STP vs SIU vs 전문가), 채용 composite(공식 패턴), [kyotofin/tax-doc-classifier](https://github.com/kyotofin/tax-doc-classifier), BTK SEO 감사(1,204페이지, 4,816 판정/3분 미만, 12쿼리 배치당 $0.0048, Anil-matcha 목록 인용).

### 2.7 분류 / 라우팅 (티켓, 이메일)

- **[공식]** 퀵스타트 예제가 정확히 이 유즈케이스다: Stripe 연동 실패 티켓 → `department`(Choice billing/technical/sales) 0.84·conf 0.596, `frustration`(Score) 1.035, `is_urgent`(Noul) 0.999, 입력 312토큰 ([quickstart](https://docs.typesafe.ai/introduction/quickstart)). "How to build" 페이지의 완성 예제는 `topic` Choice + 스팸 신호 3개 Noul(자격증명 요구·발신자 불일치·예상치 못한 보상)을 0.45/0.30/0.25 가중합 → 0.4~0.6이면 사람, ≥0.6 격리 ([how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)).
- **[독립] kenhuangus `customer_support`** — `department`(Choice 5) + `intent`(Choice 6) + `urgency`/`refund_requested`/`policy_supports_refund`(Noul) + `frustration`/`churn_risk`(Score). 환불은 high-stakes: `refund_requested ≥ 0.70`이고 `policy_supports_refund ≥ 0.85`일 때만 auto, 그 외 confirm/human; 부서 confidence < 0.45면 무조건 human ([customer_support.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/use_cases/customer_support.py)).
- **[독립] 이메일** — [fazlerocks/jevmail](https://github.com/fazlerocks/jevmail): Gmail을 Needs reply/Updates/Promos/Sales/Spam으로, **1,000통 약 1분, 3센트**, Vercel AI Gateway 경유, 읽기 전용. [elie222/inbox-zero](https://github.com/elie222/inbox-zero)에 Jev가 선택적 분류 백엔드로 들어감(카테고리 Choice + 예/아니오 확률). 얼리액세스 첫 주 "1,700통 트리아지에 18센트" (Flowtivity, 검색요약). [GiesN/typesafe-jev-workflow](https://github.com/GiesN/typesafe-jev-workflow)(LangGraph 이메일 의도 Choice), [emreozyoruk/hush](https://github.com/emreozyoruk/hush)(GitHub 이슈 트리아지: label/spam/needs-more-info/duplicate 한 호출, 임계값 미만은 아무것도 안 함).
- **[독립] 정확도 참고** — ayautomate: 8-way 라우팅에서 confidence ≥ 0.90 항목 정확도 95.5% vs 전체 83.8%(791건); 77-way 의도 라우팅은 GPT-5.6 Terra가 5점 앞섬, **Jev ≥ 0.80만 답하고 나머지를 Terra로 보내면 Terra 단독 정확도를 Terra 비용의 26~28%, 지연 절반으로** 달성 ([ayautomate](https://www.ayautomate.com/blog/jev-vs-llm-benchmark), 검색요약). Janus: Banking77(77 의도, 500건) Jev 77.8% $0.0507 vs DeepSeek 78.8% $0.2207, 임계값 0.67 캐스케이드 80.2% $0.1033 ([Janus RESEARCH.md](https://github.com/FirasSX914/Janus/blob/main/RESEARCH.md)). jev-certify CLINC150: 400건 in-scope에서 84.75% 자동 라우팅, 손실 2.25%/건 ([REPORT.md](https://github.com/nikkoxgonzales/jev-certify/blob/main/results/REPORT.md), AbdelStark 목록 인용).

### 2.8 실시간 루프 (게임, 로봇/시뮬, 브라우저)

**DOOM**

- **[공식/검색요약]** TypeSafe 런치 데모: 구조화된 게임 상태(텍스트)에 **초당 약 10회 질의, 시간당 약 $7**. TypeSafe 스스로 "평범한 스크립트 봇이 더 잘 플레이한다"고 인정 ([typesafe.ai 블로그](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [The Register](https://www.theregister.com/ai-and-ml/2026/09/16/typesafe-ai-debuts-model-for-machines-that-plays-doom/5296711), [DataCamp](https://www.datacamp.com/blog/system-one-models-jev) — 모두 검색요약).
- **[독립] amoghcreator/doom-jev** — ViZDoom 35 tick/s 시뮬과 **~10 Hz 비동기 추론 루프**를 분리, 80~120 ms 왕복 동안 "carry-hold" 액추에이션. 한 요청에 6문항: `macro_goal`(Choice engage/collect_weapon/explore/flee), `target`(Choice, 시야 내 적 라벨을 동적 옵션으로, 없으면 `none`), `movement`(Choice 5), `rotation`(Choice 3), `jump`(Noul), `firing`(Noul). 조준은 Jev 답이 아니라 기하 계산이 덮어씀(적이 보이면 베어링 ±2°로 회전) — "Jev는 매크로, 기하는 마이크로" ([jev_client.py](https://github.com/amoghcreator/doom-jev/blob/main/agent/jev_client.py), [composition_dag.py](https://github.com/amoghcreator/doom-jev/blob/main/agent/composition_dag.py)).
- **[독립] tirukovelamanoj/jev-plays-doom** — `defend_the_center`, 3버튼 Choice(ATTACK/TURN_LEFT/TURN_RIGHT) + speculative `in_danger` Noul. 20에피소드 고정 시드: random 0.75킬, 수작업 조준 6.55킬, **Jev 6.55킬(2,642 호출, 212 ms, 평균 confidence 0.88)**. 옵션 설명에 "베어링 ±8° 안이면 발사"라는 **수치 규칙**을 넣으면 6.20킬, 의도만 설명하면 **−0.60킬(발사 0회)** — "수치 경계를 주면 일관되게 적용하지만, 없으면 bare `bearing_deg`로부터 발사를 추론하지 못함". confidence가 0.88→0.41(개별 0.07)로 떨어지는 것은 캘리브레이션이 의도대로 동작한 것이며 `--conf-floor 0.5`로 스크립트 두뇌 폴백 ([README](https://github.com/tirukovelamanoj/jev-plays-doom)).

**Pong** — [ably-labs/jev-pong](https://github.com/ably-labs/jev-pong) [독립]

- 상태는 ~125바이트 숫자 JSON(`court`, `ball`, `paddle`, `interceptY`, `dir`), 질문은 Choice 1개(`up`/`down`/`stay`), 볼은 결정 1회에 1칸 이동. Vercel iad1에서 Gateway 경유 45초/레인, 2026-09-17:

  | 모델 | 응답 방식 | 결정/초 | 평균 | p95 | 첫 12초 결정 수 |
  |---|---|---|---|---|---|
  | Jev | `experimental_evaluate` | 4.4 | **227 ms** | **400 ms** | **47** |
  | Gemini 3.8 Flash | structured output | 0.32 | 3.2 s | 7.4 s | 3 |
  | Claude Haiku 4.5 | structured output | 0.40 | 2.5 s | 8.4 s | 2 |
  | GPT-5.6 Sol | structured output | 0.28 | 3.5 s | 10.4 s | 2 |

- 09-19 추가 비교(30개 상태, reasoning 최소): Jev 28/29 정답, 중위 222 ms, p95 288 ms; Ministral 3B 26/30, 396 ms(1.8배); 전부 맞춘 가장 빠른 챗 모델은 Gemini 3.5 Flash-Lite 660 ms(3.0배); Claude Fable 5.1(adaptive/low) 4,530 ms(20.4배). 저자 명시: "지능 데모가 아니라 지연 데모. 챗 모델도 95~100% 정답."

**Minecraft / Mario / Tetris / Pokémon / 체스 / Wikirace** [독립]

- [rmalde/minecraft-agent](https://github.com/rmalde/minecraft-agent): GPT-6 Astra가 계획, Jev가 Mineflayer 액션(이동/채굴/수집/제작/상자/식사/수면/전투) 선택. Survival/Peaceful 고정 시드에서 **8분 43.3초에 엔더드래곤 처치(131 Jev 결정, 35 Astra 호출)**, 무사망. OpenRouter `typesafe/jev-1.13` `/api/alpha/decisions` 경유. 영상·이벤트 로그는 로컬에만 있어 재현 불가. 별도 [ellistev/typesafe-minecraft-demo](https://github.com/ellistev/typesafe-minecraft-demo)(캐나다 국기 건설 과제)는 검색요약으로만 확인.
- [fhshaik/typesafe-mario](https://github.com/fhshaik/typesafe-mario): 에뮬레이터 RAM→객체 중심 JSON(`player`, `trajectory`, `hazard`, `terrain`, `reaction_timing`, `recent_control`, `episode`), 요청당 Choice(7개 컨트롤러 매크로) + Noul(지금 점프가 유용한가) + Score(위험). 점프 데드라인 계산은 코드가 `jump_must_start_this_decision` 사실로 넘김, 8프레임/결정.
- [thelau/jev-tetris](https://github.com/thelau/jev-tetris): 코드가 도달 가능한 모든 배치를 영어 문장으로 열거, Choice 5문항으로 전체 확률 → 최고 가중 옵션 플레이. **23줄 regex 베이스라인이 모델을 이긴다**고 스스로 공개 (cobanov 목록).
- [valentynkit/jev-plays-pokemon-red](https://github.com/valentynkit/jev-plays-pokemon-red): 경로·산술은 코드, Jev는 분기점에서만; 배틀 턴마다 기절 예측을 RAM 상태 기준 Brier로 채점.
- [Jev Chess](https://jevchess.com): 모든 합법수를 Choice 하나에, 확률로 보드 음영(소스 비공개).
- Wikiracing: TypeSafe 런치 데모(수백~수천 링크 중 존재하지 않는 링크를 절대 고르지 않음, 검색요약). [404priyanshu/wikirace](https://github.com/404priyanshu/wikirace): GPT-5.6 Sol vs Jev, 페이지당 **255개 후보 상한(Jev의 문항당 옵션 상한)** 을 양쪽에 동일 적용, 홉당 판정 1회.

**로봇 / 시뮬레이션** [독립]

- [RomanSlack/jev-drone](https://github.com/RomanSlack/jev-drone): MuJoCo Skydio X2, 카메라만 사용. 500 Hz 제어 / 50 Hz 안전 반사 / 15 Hz 인식은 코드, **Jev는 ~2.5 Hz 전술 판단(advisory)**. 한 호출 3문항: `maneuver`(Choice hold_course/gap_left/gap_right/climb/brake/reacquire), `risk`(Score), `target_truly_lost`(Noul). 결과: Jev 없는 베이스라인은 매번 17.7 m(2번 스테이션 저빔)에서 정지, Jev 사용 시 **77.5 m 전 코스 완주(80 호출/65 s, 중위 0.11 s, 96k 토큰, 충돌 0)**. 정직한 경고: 단일 런, 더 단순한 아레나 3시드 비교에서는 이점 없음. "주장은 '베이스라인이 구조적으로 못 하는 기동(넘어가기)을 Jev가 공급한다'는 것만". 수직 정보가 없던 초기 state에서는 Jev가 `climb`을 절대 고르지 않았고(옳은 판단), 장애물 상단 높이·가시성·상승 한계를 state에 넣자 p=0.93 — **"모델 실패가 아니라 state 설계 버그"**. Choice가 애매(p=0.24)해도 Noul(`lost=0.12`)은 명확해 탐색 행동은 Noul로 게이트.
- [FBddcz/embodied-jev](https://github.com/FBddcz/embodied-jev)(Franka Panda, 제한된 시뮬 액션 Choice, 비교 결과 미공개), RoboJEV(의도→데카르트 이동/그리퍼 2단계 Choice, 검색요약), [rokbenko/quackd](https://github.com/rokbenko/quackd)(실기 로봇은 LLM 파일럿만 검증, Jev 스테퍼는 미측정), [robokrunch/jev-physical-ai](https://github.com/robokrunch/jev-physical-ai)(창고 로봇 플릿 트리아지 300호출, 하드웨어 없음). explainx는 자율주행 같은 하드 실시간에는 네트워크 왕복 때문에 부적합하다고 논증 ([explainx](https://explainx.ai/blog/jev-self-driving-latency-argument-2026), 제목만 확인).

**브라우저 에이전트** [독립]

- [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast): 관찰마다 새 요소 테이블, 한 요청에 `operation`(Choice CLICK/TYPE_TEXT/SELECT/SCROLL/WAIT/DONE/BLOCKED) + `click_target`/`type_text_target`/`select_target`(speculative Choice, 호환 요소만). 텍스트는 별도 소형 LLM(`inception/mercury-2.5`). **"Zürich→London Google Flights 7.1초"**. "100% 벤치마크 과제 해결, 프론티어 경로 대비 112배 낮은 모델 비용"은 검색요약으로만 확인. 파생: [chy4pro/jev-for-chrome](https://github.com/chy4pro/jev-for-chrome), Cline jev-browser 플러그인, [droidrun/mobile-jev](https://github.com/droidrun/mobile-jev), [jkudish/jev-browser](https://github.com/jkudish/jev-browser).

### 2.9 데이터 파이프라인 (레이크하우스, SQL, 배치 분류)

- **[독립] Iceberg 레이크하우스** — Alex Merced, "Fast Classification Models, LLMs, and the Apache Iceberg Lakehouse" ([dev.to](https://dev.to/alexmercedcoder/fast-classification-models-llms-and-the-apache-iceberg-lakehouse-387d) / [datalakehousehub](https://datalakehousehub.com/blog/jev-classification-models-iceberg-lakehouse/), 검색요약): "입력이 티켓 하나가 아니라 Iceberg 테이블의 4천만 행"인 레이크하우스 규모에서 LLM 대신 Jev로 분류·태깅. 인용된 사례: [Nutlope/1kpapers](https://github.com/Nutlope/1kpapers) — 1,018편 논문을 DeepSeek V4 Flash로 요약($3.99) → 제목+요약+24개 토픽을 Jev에 보내 분류(**$0.08, 논문당 중위 256 ms**).
- **[독립] SQL 통합** — [prasanthj/duckdb-jev](https://github.com/prasanthj/duckdb-jev)(네이티브 DuckDB 확장, Choice 1,000건에서 1,943 rows/s — 합성 티켓 반복 코퍼스, 정확도 미측정), MotherDuck `prompt_jev()`(SQL 텍스트 분류 "50배 빠르고 1% 비용", "10만 행을 40초에 $0.50" — [motherduck.com](https://motherduck.com/blog/motherduck-supports-jev/), 검색요약), [Query-farm/vgi-typesafe](https://github.com/Query-farm/vgi-typesafe)(LATERAL 조인 테이블 함수), [realZachi/pg-jev](https://github.com/realZachi/pg-jev)·[giuliosmall/pg_typesafe](https://github.com/giuliosmall/pg_typesafe)(Postgres 확장), [kylemclaren/jevql](https://github.com/kylemclaren/jevql)(`WHERE jev(alias,'조건')`, 서버 SQL 후 생존 행만 배치 판정), [ktaletsk/jevframe](https://github.com/ktaletsk/jevframe)(pandas/Polars), [AkashPriyadarshii/jev-curate](https://github.com/AkashPriyadarshii/jev-curate)(Parquet/JSONL 스트리밍 필터), [sutro-sh/jev-align](https://github.com/sutro-sh/jev-align)(불확실 행을 사람 라벨링으로, GEPA로 정의 개선).
- **[독립] 주의** — 위 orderby-bench: 40행을 하나의 state로 배치하면 랭킹 게이트 실패. 공식 jaggedness도 "결정과 무관한 내용이 state에 늘수록 정확도 하락"을 경고하므로 대량 처리에서도 행 단위 state를 권장.

---

## 3. 질문 설계 패턴

### 3.1 프리미티브 사양 [공식]

출처: [primitives](https://docs.typesafe.ai/primitives), [choice](https://docs.typesafe.ai/primitives/choice), [score](https://docs.typesafe.ai/primitives/score), [noul](https://docs.typesafe.ai/primitives/noul), [confidence](https://docs.typesafe.ai/confidence) (미러 005/006/007/008/011)

| 타입 | 입력 | 한도 | 반환 | 권장 용도 |
|---|---|---|---|---|
| **Choice** | `instructions` + `criteria`(옵션명→설명 맵) | **최대 255 옵션**, 옵션당 몇 토큰 | `choice`, `probabilities`(전 옵션), `confidence` | 순서 없는 유한 집합. 목록이 불완전할 수 있으면 `other`/`none of the above` 추가 |
| **Score** | `instructions` + `criteria`(낮→높 순서 배열) | **2~10 레벨** | `score`(레벨 사이 값 가능, 확률 가중 평균), `legend`, `probabilities`, `confidence` | 스펙트럼. "정도 아닌 상황을 묘사"(예: "워크어라운드는 있지만 기능 저하"). 숫자만 있는 레벨은 동작 안 함 |
| **Noul** | `instructions` (+ 선택 `criteria{true,false}`) | — | `noul` 0~1 | 예/아니오 확률 자체가 신호일 때. **별도 confidence 없음**, 0.5는 "중간 정도"가 아니라 "불확실" |

- confidence는 `probabilities` 분포의 첨도에서 계산된 통계이며 "선택 답이 맞을 확률"이 아니다. 필요하면 `probabilities`로 자기 정의 지표를 계산.
- 질문 ID는 모델에 전달되지 않으므로 `instructions`에 완전한 질문을 쓴다.
- 같은 요청의 질문들은 **독립·병렬**: 한 답이 다른 질문의 컨텍스트가 되지 않는다. 토큰 예산은 "약 32,000토큰(영어 약 15만 자)"을 state와 질문이 공유(primitives 페이지). Anil-matcha 목록이 인용한 [Models](https://docs.typesafe.ai/models) 페이지는 "요청당 64k, state+가장 긴 질문 32k"로 기술 — 두 수치가 공존한다.
- "한 질문이 다른 답에 의존"하는 경우는 예외: 답을 받아야 다음 state를 가져오거나 다음 옵션 집합을 정할 수 있을 때만 2차 요청(skill suggestion, structure recovery, hierarchical classification 쿡북).

### 3.2 유즈케이스별 질문 패턴 매트릭스

| 유즈케이스 | State 구조 | 질문 구성 (타입) | confidence/확률 게이팅 | 출처 |
|---|---|---|---|---|
| 지원 티켓 트리아지 | `{ticket, order, refund_policy}` 객체 또는 문자열 | `category`/`department` Choice, `frustration` Score, `is_urgent`/`refund_requested` Noul (speculative fan-out) | Choice conf<0.5~0.75 → 사람; refund는 policy Noul≥0.85까지 요구 | 공식 fan-out/how-to-build; kenhuangus |
| 모델 라우팅 | 프롬프트(+시스템 프롬프트, 도메인 힌트) | `model`/`tier` Choice, `difficulty`/`complexity` Score, `high_risk`/`needs_tools` Noul | risk≥0.7 또는 difficulty≥1.6 → 강한 모델; conf<0.72 → confirm | LangChain, LiteLLM, kenhuangus |
| 툴콜 게이트 | `{cwd, tool, arguments(400자 절단), user_request(1200자), platform}` | 위험 명제 3~8개 Noul + `impact`/`severity` Score + `risk_class` Choice | Noul별 개별 임계값(0.70~0.90, 실측), Score는 minConfidence와 결합, 기본 shadow/fail-open | pi-jev, kenhuangus, OpenRouter |
| 콘텐츠 모더레이션 | 게시물/코멘트 + 정책 텍스트 | 카테고리별 Noul 다수(스팸/독성/괴롭힘…) + `harm_severity` Score + `disposition` Choice(allow/review/block) with `uncertain` | 어느 Noul≥0.85 또는 severity≥1.7 → block; ≥0.75 → review | 공식 guardrails 쿡북, kenhuangus, jevmod |
| RAG 리랭킹 | `{query, passage/candidate, document meta}` **구절당 1 state** | `relevance` Score 또는 `matches`/`supports_answer` Noul, `contradicts`/`prompt_injection` Noul | 정렬 후 threshold(예 0.2), 인젝션≥0.7 드롭, 빈 결과면 기권 | 공식 rerank 쿡북, jev-reranker, kenhuangus |
| 인용 검증 | `{claim, quote, source_context}` | `support` Choice(supports/partial/contradicts/unrelated) + `quote_faithful`/`overclaim` Noul + `evidence_strength` Score | supports∧conf≥0.72∧faithful≥0.7∧overclaim≤0.3만 자동 수락 | 공식 citation 쿡북, kenhuangus |
| LLM-as-judge | 프롬프트·응답·루브릭 | 기준별 Noul 1개("사용자가 불만을 표했는가") 또는 Score 루브릭 | 배치 채점, 확률을 그대로 점수로 저장 | Langfuse, pytest-jev |
| 리드 스코어링 | `{company_profile, executive_bio, inbound_message, icp{…}}` | fit Noul 4개 + `purchase_intent` Score + `disqualified` Noul + `priority` Choice | disqualified≥0.7 즉시 폐기; 코드 가중합 composite로 버킷 | 공식 composite, kenhuangus |
| 에이전트 트레이스 리뷰 | 전체 트레이스(지시·대화·툴콜·최종응답·피드백) | `permission_breach`/`goal_met`/`user_satisfied`/`tool_misuse` Noul + `urgency` Score + `failure_kind` Choice | harm≥0.7 또는 misuse≥0.85 → 즉시 리뷰; 정상이면 close+샘플링 | evals.typesafe.ai, kenhuangus |
| 실시간 게임 | 숫자만 있는 소형 JSON(Pong 125B) 또는 베어링/거리 배열(DOOM), 합법 액션은 코드가 열거 | 액션 Choice 1개(옵션=합법 액션, 동적) + speculative Noul(`in_danger`, `jump`) | conf<0.5 → 스크립트 폴백; 조준 등 정밀 제어는 기하로 덮어씀 | jev-pong, jev-plays-doom, doom-jev, mario |
| 드론/로봇 전술 | 5구간 거리·장애물 상단 높이·가시성·상승 한계·타깃 위치 | `maneuver` Choice + `risk` Score + `target_truly_lost` Noul | 코드가 호출 시점 결정(장면 지문 캐시), 50 Hz 안전 반사가 항상 거부권 | jev-drone |
| 브라우저 액션 | 번호 붙은 요소 테이블(가시 텍스트만) | `operation` Choice + 타깃 Choice 3개(speculative, 호환 요소만) | 선택 요소를 DOM에서 재검증, 모델 출력이 셀렉터/JS가 되지 않음 | jev-ultrafast |
| 대량 분류(SQL/레이크하우스) | 행 1개 = state 1개 (배치 금지) | 라벨 Choice(최대 255) 또는 필터 Noul | confidence 낮으면 상위 카테고리 롤업 또는 `UNSURE` | classification_using_confidence 쿡북, jev-sheets, orderby-bench |
| 이메일 트리아지 | 제목/발신자/본문 | 카테고리 Choice + 긴급/스팸/답장필요 Noul | 임계값 미만은 라벨 미부여 | JevMail, Inbox Zero, hush |

### 3.3 confidence 게이팅 코드 패턴

**[독립] kenhuangus `decisions.py`** — 재사용 가능한 기본값 (라벨된 트래픽으로 튜닝 전제):

```python
@dataclass(frozen=True)
class Thresholds:
    auto_confidence: float = 0.72      # Choice/Score: 이 이상이면 사람 없이 실행
    human_confidence: float = 0.45     # 이 미만이면 항상 에스컬레이션
    noul_yes: float = 0.70
    noul_no: float = 0.30
    high_stakes_confidence: float = 0.88   # 송금·파괴적 툴 등
    high_stakes_noul: float = 0.85

# band_for_choice: conf < 0.45 → HUMAN, < floor(0.72 또는 0.88) → CONFIRM, 그 외 AUTO
# band_for_noul(affirmative=True): ≥ yes_floor → AUTO, ≤ 0.30 → BLOCK(high_stakes) / HUMAN, 사이 → CONFIRM
# band_for_noul(affirmative=False, 안전 명제): ≥ yes_floor → AUTO, ≤ 0.30 → BLOCK, 사이 → CONFIRM
```

결과는 `UseCaseResult{decision, action_band ∈ {auto, confirm, human, block}, actions}`이며 "Jev는 이메일을 보내지도, 돈을 옮기지도, 셸 명령을 실행하지도 않는다" ([decisions.py](https://github.com/kenhuangus/jev-usecases/blob/main/src/jev_usecases/decisions.py)).

**[공식]** 세 구간(high → 자동, medium → 확인/플래그, low → 사람/폴백) + "임계값은 리스크에 따라 스케일" — 읽기 전용 액션은 낮게, 파괴적 액션은 높게 ([confidence](https://docs.typesafe.ai/confidence)).

### 3.4 "하나의 질문을 여러 개로 분해" — 실측 근거

| 연구 | 단일 질문 | 분해 후 | 비고 |
|---|---|---|---|
| beri.net (피싱 2,000통) [검색요약] | **62.6%** (Haiku 81.3%) | **95.0%** — 5개 좁은 질문 + 라벨 1,000건으로 로지스틱 회귀 학습, 나머지 1,000건 평가 | "95%는 Jev가 아니라 Jev+당신의 라벨 데이터+당신이 유지하는 회귀". 캘리브레이션은 모델 단위가 아니라 **질문 단위**로 ([beri.net](https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval)) |
| XenoSpectrum (같은 실험 재서술) [검색요약] | 62.6% | 89.4%(단순 결합) | BERT는 학습 시 태스크 고정, Jev는 질문 텍스트가 런타임에 태스크 결정 ([xenospectrum](https://xenospectrum.com/en/jev-typesafe-bert-classifier-decomposition/)) |
| typesafe-ai-firewall (툴콜 600건) | "위험한가?" 1문항: 정상 hard-negative **39% 차단** | 5문항 배터리: **0% 차단**, 공격 탐지 100% | [report.md](https://github.com/AnshChoudhary/typesafe-ai-firewall) |
| agentjournal "Judge vs Dimension Scores" (5,477행, $1.43) | 직접 질문 0.8373 (일본어 NLI) | 12~14차원 Score + 로컬 가중치 0.9076 | 단, hard benign을 공격으로 오탐하는 비율이 약 25배 증가, 4번 수리 시도 실패 (AbdelStark 목록 인용) |
| 공식 parallel_questions 쿡북 | 13회 개별 호출 | 1회 배치: 12.2x 저렴, 10.0x 빠름, 답 동일 | 정확도가 아니라 비용·속도 효과 |
| jev-plays-doom (질문 문구) | 의도 설명만: 발사 0회, −0.60킬 | 수치 규칙 포함: 6.20킬 | "규칙은 지시 따르기, 의도는 판단력을 측정" |
| pi-jev (질문 문구) | "버전관리에서 복구 불가?" → 0.77 | "파괴적인가?" → 0.99 vs 0.03 | 추론 경로를 열어주는 문구 회피 |

공식 가이드도 같은 방향이다: "판단이 여러 독립 요인에 의존하면 요인별로 따로 묻고 코드에서 가중 결합. 'rate this startup pitch' 대신 시장 크기·기술 실현성·차별화를 따로" ([introduction](https://docs.typesafe.ai/introduction), [primitives](https://docs.typesafe.ai/primitives)).

### 3.5 State 설계 원칙 [공식 + 독립]

- 문자열보다 이름 붙은 객체를 기본으로, 결정에 필요한 필드만 ([state](https://docs.typesafe.ai/concepts/state)).
- **jaggedness(jev-1.13)**: 산술·카운팅 불가, 날짜를 순서 있는 양으로 비교 못 함(텍스트로 읽음), 무관한 내용이 늘면 정확도 하락(distractor), 간접 질문에 약함, state는 데이터로만 취급되어 적대적 텍스트(인젝션·자기 분류를 주장하는 문장)가 답을 움직일 수 있음, 상반된 기준은 점수 악화 ([model-jaggedness/jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13); 검색요약 + kenhuangus README 요약).
- 그래서: 합계·날짜·중복·보호 경로 매칭은 코드에서 계산해 **결과를 state에 사실로 넣고** 묻는다(kenhuangus, typesafe-mario `jump_must_start_this_decision`, soc_recovery `hours_contained`).
- **답이 state 안에 있어야 한다**: jev-drone의 `climb` 사례 (2.8절).
- 영어가 주 언어. 한국어 MMLU-ProX 999문항 매칭 비교: 영어 81.3%(conf 0.816) vs 한국어 74.8%(conf 0.729), ECE ~0.076 동일 — "한국어에서 더 못하고, 더 못한다는 것을 안다" ([jev-calibration-audit](https://github.com/jujumilk3/jev-calibration-audit/blob/main/FINDINGS.md)). 옵션 순서 뒤집기: 평균 0.005 변화, 400건 argmax 뒤집힘 0. 예/아니오 vs 2지 Choice 표현 차이: 평균 0.125, 16.3%가 0.2 이상 차이.

---

## 4. 결과 수치

### 4.1 TypeSafe 자체 주장 [공식/검색요약]

| 항목 | 수치 | 출처 |
|---|---|---|
| 가격 | 입력 $0.042/1M 토큰, 출력 무료 | [models](https://docs.typesafe.ai/models) (Anil-matcha·Cloudflare 카탈로그 인용) |
| 지연 | 70~500 ms 엔드투엔드(웨스트코스트), "대부분 약 100 ms", use-case map은 "150 ms" | 런치 블로그(kenhuangus README 인용), how-to-build, use-case map |
| 속도·비용 배수 | 프론티어 LLM 대비 최대 193.6x 빠름 / 444.6x 저렴; "40~200x / 40~400x" | 런치 블로그, Tom's Hardware, LangChain(검색요약) |
| 정확도(자체 evals) | 4개 워크플로 평균 67.8% — 기준은 GPT-6 Astra·Fable 5.1 고추론의 평균 답, 사람 라벨 아님, TypeSafe도 편향 가능성 인정 | evals.typesafe.ai(검색요약), kenhuangus README |
| 평균 결정 비용 | 약 $0.0004/결정(자체 벤치) | 검색요약 |
| DOOM | ~10 결정/초, ~$7/시간, 스크립트 봇이 더 잘함 | 런치 블로그(검색요약) |
| 리랭킹 쿡북 | top-1 5%→18%, top-10 38%→62% | rerank 쿡북 |
| 병렬 질문 | 13문항 배치 12.2x 저렴, 10.0x 빠름 | parallel_questions 쿡북 |
| 한도 | 요청당 64k / state+최장 질문 32k(models) 또는 "약 32,000 토큰"(primitives); 250,000 tok/s, 1,200 req/min | models(인용), primitives |

### 4.2 독립 측정 [독립]

| 항목 | 수치 | 출처 |
|---|---|---|
| Pong 결정 지연 | 평균 227 ms / p95 400 ms (Gateway, iad1); 재측정 중위 222 / p95 288 ms | jev-pong README |
| DOOM(defend_the_center) | 212 ms 평균(2,642 호출), 6.55킬 = 수작업 조준과 동률 | jev-plays-doom |
| pi-jev 게이트 | 4문항 1요청 ≈300 ms; 출력 판정 중위 126 ms, 490 tok/요청 | pi-jev |
| 드론 | 2.5~3 Hz, 중위 0.11 s, 65 s 비행 80~110 호출, 96k 토큰 | jev-drone |
| LiteLLM 분류기 | 중위 126.81 ms vs Haiku 688.40 ms(5.43x), 비용 −96.12%, 라벨 일치 95.00 vs 73.75% | LiteLLM 블로그(검색요약) |
| ayautomate | 소형 모델 대비 중위 2.0~3.6x 빠름, 최저가 소형 대비 4.7~7.5x 저렴, 정확도 비슷; 프론티어 대비 짧은 프롬프트에서 40~49x 저렴; **광고치 193.6x/444.6x는 재현 안 됨** | ayautomate(검색요약) |
| JevBench v1.3 (534건) | Jev 1.13.0 종합 74.4(1위): Intelligence 85.7, Calibration 82.7, Speed 83.3, Cost 52.0; 2위 SemIf(Qwen3.5-4B) 73.1 | [RESULTS-v1.2.md](https://github.com/fstandhartinger/jevbench/blob/main/RESULTS-v1.2.md) |
| Janus | Banking77 Jev 77.8%($0.0507) vs DeepSeek 78.8%($0.2207), 캐스케이드@0.67 80.2%($0.1033); WoS Jev 52.8% vs DeepSeek 49.2%, 캐스케이드 이득 0에 비용 +47%; ECE 0.1568 / 0.3217(과신) | Janus RESEARCH.md |
| 툴 결정 벤치 | MetaTool 77.79% / abstention 87.04%; When2Call 74.84%; BFCL relevance 87.50% | jev-decision-benchmarks |
| Nautilus Assay 캘리브레이션(240문항) | 정확도 92.2%, Brier 0.048, ECE 0.041 | cobanov 목록 인용 |
| 툴콜 방화벽 | 공격 탐지 100%, 정상 차단 0.55%, ECE 0.156, p50 375 / p95 595 ms, $0.0000365/호출 | typesafe-ai-firewall |
| LLM-judge 대체 | Fable 5.1과 91.5% 일치, $160 vs $33,000/백만 건; 4워크플로 68% @ $0.0004 @ 0.4 s | Langfuse·LangChain(검색요약) |
| 이메일 | 1,000통/약 1분/3센트; 1,700통 18센트; 스팸 정의를 명시하면 96.0%→98.3% | JevMail README, Flowtivity·jev-gmail(검색요약) |
| 대량 분류 | 1,018편 논문 24토픽 $0.08, 중위 256 ms; duckdb-jev 1,943 rows/s; MotherDuck 10만 행 40 s $0.50 | 1kpapers·MotherDuck(검색요약), duckdb-jev |
| 한국어 | 74.8% vs 영어 81.3%(MMLU-ProX 999쌍), ECE 동일 | jev-calibration-audit |
| Vercel 내부 | fx auto-mode 안전 분류기가 GPT-5.6 Luna 대비 ~5–18x 빠르고 더 정확 — 벤치마크 미공개 | 검색요약 |
| Minecraft | 8분 43.3초 드래곤 처치, 131 Jev 결정 | minecraft-agent |
| jev-skip | SponsorBlock 스폰서 구간의 77% 포착(23편), 영상당 $0.0008 | cobanov 목록 |

---

## 5. 커뮤니티 프로젝트 목록

(전체 목록은 [cobanov/awesome-jev](https://github.com/cobanov/awesome-jev) 155개, [AbdelStark/awesome-typesafe-jev](https://github.com/AbdelStark/awesome-typesafe-jev), [Anil-matcha/awesome-jev-by-typesafe](https://github.com/Anil-matcha/awesome-jev-by-typesafe) 참조. 아래는 코드/README를 직접 확인했거나 큐레이션 목록에서 실측치가 붙은 것.)

| 프로젝트 | URL | 무엇을 하나 | 질문 타입 | 한 줄 결과 |
|---|---|---|---|---|
| kenhuangus/jev-usecases | github.com/kenhuangus/jev-usecases | 공식 use-case map 27개 모듈 + 보안 3 + SOC 7 러너, confidence 밴드(auto/confirm/human/block) | Choice/Score/Noul 혼합 | 09-18 27개 러너 모두 jev-1.13.0에서 타입 응답 반환(정확도는 미측정) |
| y0usaf/pi-jev | github.com/y0usaf/pi-jev | Pi 코딩 에이전트 툴콜 게이트 + 출력 판정 + `jev_ask` | Noul×3 + Score(게이트), Noul + Choice(출력) | 4문항 ≈300 ms, 출력 판정 중위 126 ms, 실측 임계값 0.90/0.70/0.85 |
| ably-labs/jev-pong | github.com/ably-labs/jev-pong | 결정 1회 = 볼 1칸, Jev vs 챗 LLM 4레인 | Choice(up/down/stay) | 227 ms 평균 / 400 ms p95, 12초에 47결정 vs 2~3 |
| amoghcreator/doom-jev | github.com/amoghcreator/doom-jev | ViZDoom 비동기 ~10 Hz 에이전트, 기하+Jev 하이브리드 | Choice×4 + Noul×2 | 80~120 ms 왕복, 0 드롭 프레임 |
| tirukovelamanoj/jev-plays-doom | github.com/tirukovelamanoj/jev-plays-doom | 3버튼 DOOM, 스크립트 폴백 | Choice + Noul | 212 ms, 6.55킬(수작업 조준과 동률), 규칙 vs 의도 문구 실험 |
| RomanSlack/jev-drone | github.com/RomanSlack/jev-drone | MuJoCo 쿼드로터, 카메라만, 2.5 Hz 전술 | Choice + Score + Noul | 베이스라인 17.7 m 정지 → Jev 77.5 m 완주, 중위 0.11 s |
| rmalde/minecraft-agent | github.com/rmalde/minecraft-agent | Astra 계획 + Jev 액션 선택, Mineflayer | Choice | 8:43 드래곤 처치, 131 Jev 결정 |
| fhshaik/typesafe-mario | github.com/fhshaik/typesafe-mario | NES 텔레메트리→JSON, 8프레임/결정 | Choice + Noul + Score | 결정별 JSONL 로그(정량 결과 미공개) |
| 404priyanshu/wikirace | github.com/404priyanshu/wikirace | GPT-5.6 Sol vs Jev 위키 레이스 | Choice(≤255 링크) | 홉당 판정 1회, 255 상한 양쪽 동일 적용 |
| browser-use/jev-ultrafast | github.com/browser-use/jev-ultrafast | 동적 인덱스 액션 공간 브라우저 에이전트 | Choice(operation) + speculative Choice(targets) | Zürich→London 7.1 s |
| hotchpotch/jev-reranker | github.com/hotchpotch/jev-reranker | RAG 관련성 필터/리랭킹 라이브러리 | Noul | threshold 0.2 기본, 빈 결과면 기권 |
| featherless-ai/simple-jev | github.com/featherless-ai/simple-jev | 오픈 모델 next-token logits로 Jev식 JSON(재현) | choice/score/noul 호환 | 공용 데모 API 2k 컨텍스트·2 RPS, 캘리브레이션 미보장 |
| AnshChoudhary/typesafe-ai-firewall | github.com/AnshChoudhary/typesafe-ai-firewall | 툴콜 사전 방화벽 shadow 검증 | Noul×5 배터리 | 공격 100% 탐지, 정상 차단 0.55%, 단일 질문은 39% 오차단 |
| jujumilk3/jev-calibration-audit | github.com/jujumilk3/jev-calibration-audit | KoBBQ·MMLU-ProX 캘리브레이션 감사 | Choice/Noul | 기권 옵션 있으면 95% 기권, 없으면 79% 스테레오타입; 한국어 −6.5pt |
| fstandhartinger/jevbench | github.com/fstandhartinger/jevbench | 결정 모델 교차 벤치 534건 | 혼합 | Jev 74.4 종합 1위 |
| FirasSX914/Janus | github.com/FirasSX914/Janus | Jev→LLM 캐스케이드 임계값 연구 | Choice | 임계값 데이터셋 간 비이전(0.67↔0.37) |
| baibizhe/jev-decision-benchmarks | github.com/baibizhe/jev-decision-benchmarks | MetaTool/When2Call/BFCL 툴 결정 | Choice | 툴 선택·기권에 강함, BFCL irrelevance는 Gemini에 뒤짐 |
| yodablocks/jev-orderby-bench | github.com/yodablocks/jev-orderby-bench | ORDER BY 확률 정당성 | Noul/Score | 뉴스그룹 통과, ESCI 4/6 실패, 40행 배치 실패 |
| fazlerocks/jevmail | github.com/fazlerocks/jevmail | Gmail 5분류 읽기 전용 | Choice | 1,000통/1분/3센트 |
| elie222/inbox-zero | github.com/elie222/inbox-zero | 이메일 어시스턴트의 선택적 Jev 분류기 | Choice + Noul | 프로덕션 앱의 제한적 통합 |
| eugeniughelbur/jev-engineering | github.com/eugeniughelbur/jev-engineering | 코딩 에이전트 결정 계층(PreToolUse 훅/MCP) | Noul | 300회 인젝션: 위험 30건 중 0 통과, 안전 10% 오거부 |
| xinyao27/jevonian | github.com/xinyao27/jevonian | 코딩 에이전트용 모델 라우팅 프록시 | Choice | `minConfidence` 미달은 기록만 |
| prasanthj/duckdb-jev | github.com/prasanthj/duckdb-jev | DuckDB 네이티브 확장 | Choice/Score/Noul | 1,943 rows/s(합성, 정확도 미측정) |
| kylemclaren/jevql | github.com/kylemclaren/jevql | Postgres용 psql형 시맨틱 필터 | Noul/Choice/Score | 서버 SQL 후 생존 행만 판정 |
| Nutlope/1kpapers | github.com/Nutlope/1kpapers | 논문 1,018편 24토픽 분류 | Choice | $0.08, 중위 256 ms |
| valentynkit/jev-skip | github.com/valentynkit/jev-skip | 유튜브 자막에서 스폰서 구간 확률 | Noul | 77% 포착, $0.0008/영상 |
| thelau/jev-tetris | github.com/thelau/jev-tetris | 모든 배치를 문장으로 열거 후 Choice | Choice×5 | 23줄 regex 베이스라인이 더 높음 |
| gaborishka/jevtown | github.com/gaborishka/jevtown | 1만 페르소나 반응 시뮬 | Score ~60 + Choice 배치 | 시뮬레이션, 실제 예측 아님 |
| AlexWortega/openjev 등 재현 | huggingface.co/AlexWortega/openjev | 오픈 재현(Qwen NLI 크로스인코더 등) | — | 인터페이스 재현, 캘리브레이션 미검증 |

---

## 6. 통합 경로

### 6.1 네이티브 HTTP API [공식]

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <API_KEY>
Content-Type: application/json
```
```json
{
  "state": "Hi, I've been trying to connect my Stripe account for 3 days and it keeps failing. I'm losing sales. Please help ASAP.",
  "model": "jev-latest",
  "questions": {
    "department": {"type": "choice", "instructions": "Which team should handle this",
                   "criteria": {"billing": "Payment or subscription issues", "technical": "Bugs or integration problems", "sales": "Pricing or account questions"}},
    "frustration": {"type": "score", "instructions": "How frustrated the customer appears",
                    "criteria": ["Calm, just stating facts", "Frustrated but civil", "Very angry, strong language"]},
    "is_urgent": {"type": "noul", "instructions": "The message conveys urgency or time-sensitivity"}
  }
}
```
응답: `answers.department = {type, choice:"billing", probabilities:{billing:0.84, technical:0.159, sales:0.001}, confidence:0.596}`, `answers.frustration = {score:1.035, legend:{...}, confidence:0.842}`, `answers.is_urgent = {noul:0.999}`, `usage:{input_tokens:312, output_tokens:48}` ([quickstart](https://docs.typesafe.ai/introduction/quickstart)).

### 6.2 공식 SDK [공식]

- Python `pip install typesafe-sdk` → `TypeSafeClient().system_one(state=..., questions={"x": Choice(instructions=..., criteria={...}), "y": Score(..., criteria=[...]), "z": Noul(...)})`; 0.7.0(09-18)에서 msgspec→Pydantic, `response_model` 추가 ([typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python)).
- JS `npm install @typesafe-ai/sdk` → `new TypeSafeClient().systemOne({state, questions:{team: choice(q, {...}), refund: noul(q)}})`, `answers.team.choice`, `answers.team.probabilities[team]`, `answers.refund.noul` ([typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js)).
- [system-one-adapter-python](https://github.com/typesafe-ai/system-one-adapter-python): 같은 인터페이스를 OpenAI/Anthropic LLM 위에서 (비교·개발용). [typesafe-ai/skills](https://github.com/typesafe-ai/skills): Claude Code/Codex용 공식 에이전트 스킬.

### 6.3 Vercel AI SDK / AI Gateway [독립]

```ts
import { experimental_evaluate } from 'ai';
import { typeSafeAi } from '@ai-sdk/typesafe-ai';   // 또는 Gateway 문자열 'typesafe-ai/jev'

const result = await experimental_evaluate({
  model: typeSafeAi.evaluationModel('jev-latest'),
  state: { message: 'user input' },
  questions: {
    department:     { type: 'choice',  instructions: 'Which team should handle this?', criteria: { billing: '...', support: '...' } },
    severity:       { type: 'score',   instructions: 'How severe is the issue?', criteria: ['Cosmetic', 'Workaround exists', 'Blocking'] },
    requestsRefund: { type: 'boolean', instructions: 'Is refund requested?' },
  },
});
// result.answers.department.choice / .probabilities
// result.answers.severity.score / .probabilities
// result.answers.requestsRefund.probability      (Boolean == TypeSafe Noul)
// result.providerMetadata?.typesafe?.confidence  (TypeSafe 전용)
```
출처: [vercel/ai docs 32-evaluation.mdx](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/32-evaluation.mdx). 스트리밍·멀티라벨·무관한 state 배치는 미지원. Gateway 모델 ID `typesafe-ai/jev`, AI SDK 7.0.105+, 2026-09-16 출시, **09-25까지 무료**, `providerOptions.gateway`로 Zero Data Retention / No Training 요청별 설정, jev-pong은 `maxRetries: 0`으로 지연 측정 ([Vercel changelog](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway), [KB 가이드](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk) — 검색요약; jev-pong `lib/decide/jev.ts`). Vercel Eve 프레임워크의 `auto` 라우터 기본값이 Jev.

### 6.4 Cloudflare Workers AI [독립]

```ts
const response = await env.AI.run('typesafe/jev', {
  state: 'Help! My payouts have been failing for 3 days.',
  questions: {
    is_urgent: { type: 'noul', instructions: 'Does this convey urgency?',
                 criteria: { true: 'Explicitly time-sensitive', false: 'No urgency expressed' } },
  },
});
```
카탈로그: 모델 ID `typesafe/jev`, 컨텍스트 32,000 토큰, 입력 $0.042/1M·출력 $0, 질문 스키마는 TypeSafe API와 동일하므로 그대로 재사용, 결제는 Cloudflare로 ([cloudflare-docs typesafe-jev.json](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/catalog-models/typesafe-jev.json), [developers.cloudflare.com](https://developers.cloudflare.com/ai/models/typesafe/jev/)). REST: `POST /accounts/{id}/ai/run` with `{model:"typesafe/jev", input:{state, questions}}` (검색요약).

### 6.5 Pydantic AI [독립]

```python
pip install "pydantic-ai-slim[typesafe]"

class Verdict(str, Enum): run='run'; reject='reject'; ask='ask'
class Handling(BaseModel):
    """Decide how a shell command should be handled."""
    verdict: Verdict
    irreversible: bool = Field(description='Would running this destroy data or leak secrets?')

agent = Agent('typesafe:jev-latest', output_type=Handling)
result = agent.run_sync('rm -rf ./build')
```
필드→질문 매핑: `bool`→Noul(임계값 `typesafe_boolean_threshold`, 예 0.9), `Literal/Enum`→Choice, 0–1 `float`→확률 원값, docstring 있는 `IntEnum`→Score, 옵션 `list`→옵션별 Noul, 중첩 모델→계층 질문. `str` 필드·파일·스트리밍 불가, 옵션 최대 255. `FallbackModel('typesafe:jev-latest', 'openai:gpt-4')`로 미지원 인자를 LLM에 위임 ([pydantic-ai docs](https://raw.githubusercontent.com/pydantic/pydantic-ai/main/docs/models/typesafe.md)).

### 6.6 LangChain [독립]

```python
uv add langchain-typesafe
from langchain_typesafe import Choice, Noul, Score, TypeSafeClassifier
result = TypeSafeClassifier().invoke({"state": "...", "questions": {
    "department": Choice(instructions="Which team should handle this?", criteria={"billing": "...", "technical": "..."}),
    "urgent": Noul(instructions="Does this message express urgency?"),
    "frustration": Score(instructions="How frustrated does the customer appear?", criteria=["calm", "frustrated", "angry"]),
}})
# experimental.middleware: ModelRouterMiddleware(choices={"fast": ModelChoice(model="openai:gpt-5-mini", criteria="Simple, well-scoped tasks."), "powerful": ...})
#                          AutoModeMiddleware(tools=[delete_file], criteria=NoulCriteria(true="The call writes, deletes, publishes, or changes access.", false="The call only reads ..."))
```
출처: [langchain libs/partners/typesafe](https://github.com/langchain-ai/langchain/tree/master/libs/partners/typesafe), LangChain.js 동등 구현. 웨비나 "Building a Harness with Jev"(Sydney Runkle, Hunter Lovell, Allie Laabs).

### 6.7 그 외 [독립]

- **OpenRouter**: `typesafe/jev-1.13` / `jev-latest`, Decisions 엔드포인트(`/api/alpha/decisions`), 쿡북 "Gate Agent Tool Calls with Jev", "Verified Cascade"(저렴한 모델 초안을 Jev로 검증 후 승격) ([openrouter.ai](https://openrouter.ai/typesafe/jev-1.13)).
- **Netlify AI Gateway**: Functions에서 `@typesafe-ai/sdk` 제로 설정 ([changelog](https://www.netlify.com/changelog/typesafe-jev-ai-gateway/)).
- **프레임워크**: LiteLLM(복잡도 라우터 + 관련성 가드레일), Pydantic AI, Rig(Rust), Composio, Effect `@effect/ai-typesafe`, BAML(nightly), Ax, TanStack AI `decide()`, LlamaIndex(비공식), Spring AI 블로그, NeuroLink, .NET `TypeSafeAI.Net`(Microsoft.Extensions.AI 어댑터) — cobanov 09-20 리서치 노트에 커밋 고정 근거 ([research/2026-09-20.md](https://github.com/cobanov/awesome-jev/blob/main/research/2026-09-20.md)).
- **관측성**: Langfuse 연동 페이지, LangSmith 평가기.
- **데이터**: DuckDB/MotherDuck/Postgres/n8n/Google Sheets(`JEV_IF`, `JEV_CHOICE`…)/Home Assistant.
- **커뮤니티 SDK**: Go, Java(+Spring Boot starter), Kotlin, Swift, Rust, Ruby(RubyLLM, Rails), PHP(Laravel), Elixir, OCaml, Scala 3, Haskell DSL, R.

---

## 7. 안티패턴 / 맞지 않는 유즈케이스

| 맞지 않는 것 | 이유 · 근거 | 대안 |
|---|---|---|
| 자유 텍스트·코드·요약·대화 생성 | 텍스트 디코더가 없다. "chatbot, copywriter, code generator, explanation engine이 아님" (Anil-matcha; 공식 System One 페이지 "replies, code, explanations of reasoning을 만들지 않음") | LLM이 쓰고 Jev가 검증/라우팅 |
| 근거(rationale)가 필요한 결정 | 숫자만 반환. 규제 산업 감사·디버깅에 불리. Reticle: "Jev는 기권/설명을 못 하고 least-wrong 답을 고른다" | 확률 분포·질문 정의·버전을 로깅해 감사 흔적 확보; 설명은 LLM |
| 열린 추론·다단계 계획 | 공식: "Analyze this message and determine the best course of action"은 나쁜 질문 — 느린 추론이 필요하면 쪼개라 | 작은 질문으로 분해 + 코드 합성, 또는 LLM 플래너(Minecraft 사례처럼 Astra 계획 + Jev 선택) |
| 미지의 문자열 추출 | 값 생성 불가 | 정규식/LLM으로 후보 열거 → Jev Choice로 선택(pre-parsed extraction 쿡북, SDE cascade) |
| 산술·카운팅·날짜 비교 | jaggedness 문서: 계산기가 아니며 날짜를 텍스트로 읽음 | 코드가 계산해 결과를 state에 사실로 넣는다 |
| 32K(또는 64K) 초과 컨텍스트, 긴 이력 전체 투입 | 토큰 예산 + distractor로 정확도 하락 | 코드에서 검색·필터 후 필요한 필드만 |
| 하나의 질문에 여러 판단 합치기 | 62.6%→95%, 단일 "위험한가?" 39% 오차단 사례 | 요인별 질문 + 코드 가중 |
| 기권 옵션 없는 분류 | KoBBQ: 옵션 없으면 79% 스테레오타입을 conf 0.79로 | `other`/`unknown`/`review` 옵션 필수 |
| 확률을 그대로 정렬 키로 쓰기 | orderby-bench: ESCI 4/6 게이트 실패, 0.99 동점 53건, 40행 배치 시 실패 | 쌍별 순서·동점·요청 형태를 자기 라벨로 검증, 행 단위 요청 |
| 임계값을 다른 데이터셋에서 이전 | Janus: 최적 임계값 0.67→0.37, 이득 방향 반전; jev-certify: OOD 비율 변화 시 5% 목표 3.6배 초과 | 배포 트래픽 대표 샘플로 캘리브레이션, 모니터링 |
| 적대적 텍스트가 들어간 state를 무방비로 판정 | jaggedness: state는 데이터로 취급되어 인젠션이 답을 움직임; pi-verdict도 "적대적 트랜스크립트에 흔들림" 명시 | 결정적 규칙 우선, 민감 툴 패밀리는 정책으로 강제 에스컬레이션 |
| 하드 실시간 제어(자율주행, 500 Hz 제어 루프) | 네트워크 왕복 100~500 ms; jev-drone도 제어·안전은 코드, Jev는 2.5 Hz advisory | 코드/고전 제어가 안전을 소유, Jev는 저주파 전술 |
| 이미지·오디오·비디오 직접 입력 | 텍스트 전용(공식 State 페이지) | 별도 인식 모델로 구조화한 뒤 투입 |
| 규제 결정 경로의 shadow-eval 없는 즉시 자동화 | beri.net: shadow eval은 비규제 경로에 적절, 규제 경로는 아직 | shadow 모드(pi-jev, jev-skill-router 기본)로 시작 |
| 영어 외 언어에서 영어 임계값 그대로 | 한국어 −6.5pt(캘리브레이션은 유지) | 언어별 재캘리브레이션 |

---

## 출처

### TypeSafe 공식 (미러 및 검색요약으로 확인)
- https://typesafe.ai/blog/introducing-system-one-models-and-jev
- https://docs.typesafe.ai/introduction
- https://docs.typesafe.ai/introduction/quickstart
- https://docs.typesafe.ai/concepts/system-one
- https://docs.typesafe.ai/concepts/state
- https://docs.typesafe.ai/primitives · /primitives/choice · /primitives/score · /primitives/noul
- https://docs.typesafe.ai/confidence
- https://docs.typesafe.ai/concepts/how-to-build-with-system-one
- https://docs.typesafe.ai/concepts/use-case-map
- https://docs.typesafe.ai/patterns · /patterns/fan-out · /patterns/confidence-routing · /patterns/composite-scoring · /patterns/intent-routing
- https://docs.typesafe.ai/demos/smart-home
- https://docs.typesafe.ai/models
- https://docs.typesafe.ai/model-jaggedness/jev-1.13
- https://docs.typesafe.ai/cookbooks/rerank_typesafe · /parallel_questions · /skill_suggestion · /classifying_rag_passages · /citation_check · /llm_guardrails · /function_calling · /hierarchical_classification · /classification_using_confidence · /consistency_choice_cookbook · /consistency_noul_cookbook
- https://evals.typesafe.ai/
- https://github.com/thiagoadril/typesafe-docs (docs.typesafe.ai 마크다운 미러, 2026-09-16~18 추출)
- https://github.com/typesafe-ai/typesafe-sdk-python · https://github.com/typesafe-ai/typesafe-sdk-js · https://github.com/typesafe-ai/system-one-adapter-python · https://github.com/typesafe-ai/skills

### 큐레이션 목록
- https://github.com/AbdelStark/awesome-typesafe-jev
- https://github.com/cobanov/awesome-jev (및 research/2026-09-20.md)
- https://github.com/Anil-matcha/awesome-jev-by-typesafe (docs/jev-use-case-playbook.md, docs/coding-agent-use-cases.md)

### 커뮤니티 리포지토리 (코드/README 직접 확인)
- https://github.com/kenhuangus/jev-usecases
- https://github.com/y0usaf/pi-jev
- https://github.com/ably-labs/jev-pong
- https://github.com/amoghcreator/doom-jev
- https://github.com/tirukovelamanoj/jev-plays-doom
- https://github.com/featherless-ai/simple-jev
- https://github.com/RomanSlack/jev-drone
- https://github.com/fhshaik/typesafe-mario
- https://github.com/rmalde/minecraft-agent
- https://github.com/404priyanshu/wikirace
- https://github.com/browser-use/jev-ultrafast
- https://github.com/hotchpotch/jev-reranker
- https://github.com/AnshChoudhary/typesafe-ai-firewall (report.md)
- https://github.com/jujumilk3/jev-calibration-audit (FINDINGS.md)
- https://github.com/fstandhartinger/jevbench (RESULTS-v1.2.md)
- https://github.com/FirasSX914/Janus (RESEARCH.md)
- https://github.com/baibizhe/jev-decision-benchmarks
- https://github.com/langchain-ai/langchain/tree/master/libs/partners/typesafe
- https://github.com/pydantic/pydantic-ai/blob/main/docs/models/typesafe.md
- https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/32-evaluation.mdx
- https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/catalog-models/typesafe-jev.json
- https://github.com/BerriAI/litellm/blob/main/litellm/router_strategy/complexity_router/jev_classifier.py

### 큐레이션 목록·검색요약으로만 확인한 프로젝트
- https://github.com/yodablocks/jev-orderby-bench · https://github.com/nikkoxgonzales/jev-certify · https://github.com/ghubnab99/jev-enterprise-decision-fabric · https://github.com/eugeniughelbur/jev-engineering · https://github.com/anessbelbati/jev-rerank-bench · https://github.com/kitfunso/hippo-memory
- https://github.com/fazlerocks/jevmail · https://github.com/elie222/inbox-zero · https://github.com/emreozyoruk/hush · https://github.com/GiesN/typesafe-jev-workflow
- https://github.com/xinyao27/jevonian · https://github.com/BillionsBobby/JevRouter · https://github.com/shimo4228/jev-skill-router · https://github.com/ComposioHQ/composio · https://github.com/vercel/eve
- https://github.com/ohernandezdev/jevmod · https://github.com/Zafer-Liu/jev-demo-moderator · https://github.com/bitnovus/jev-spam-eval · https://github.com/gaborishka/jevtown
- https://github.com/shinpr/jev-reranker · https://github.com/WiktorB2004/llama-index-jev
- https://github.com/allebee/pytest-jev · https://github.com/lukstei/slop-grader · https://github.com/mblode/taste-lint · https://github.com/danielgshea/jev-as-a-judge
- https://github.com/jyatesdotdev/jev-logtriage · https://github.com/reachjalil/jevlogs · https://github.com/koala73/worldmonitor · https://github.com/kyotofin/tax-doc-classifier
- https://github.com/thelau/jev-tetris · https://github.com/valentynkit/jev-plays-pokemon-red · https://jevchess.com · https://github.com/ellistev/typesafe-minecraft-demo
- https://github.com/FBddcz/embodied-jev · https://github.com/rokbenko/quackd · https://github.com/robokrunch/jev-physical-ai
- https://github.com/chy4pro/jev-for-chrome · https://github.com/droidrun/mobile-jev · https://github.com/jkudish/jev-browser
- https://github.com/Nutlope/1kpapers · https://github.com/prasanthj/duckdb-jev · https://github.com/Query-farm/vgi-typesafe · https://github.com/realZachi/pg-jev · https://github.com/giuliosmall/pg_typesafe · https://github.com/kylemclaren/jevql · https://github.com/ktaletsk/jevframe · https://github.com/AkashPriyadarshii/jev-curate · https://github.com/sutro-sh/jev-align
- https://github.com/valentynkit/jev-skip · https://huggingface.co/AlexWortega/openjev

### 제3자 글·벤더 문서 (검색요약으로만 확인 — 도메인 차단)
- https://www.ayautomate.com/blog/jev-vs-llm-benchmark
- https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval
- https://xenospectrum.com/en/jev-typesafe-bert-classifier-decomposition/
- https://www.langchain.com/blog/building-a-harness-with-jev · https://www.langchain.com/blog/jev-agent-evals-langsmith · https://events.langchain.com/webinar/building-a-harness-with-jev/
- https://langfuse.com/blog/2026-09-18-using-typesafes-jev-for-evals · https://www.reticle.sh/blog/jev-vs-llm-as-judge · https://arize.com/blog/typesafe-jev-llm-judge/
- https://docs.litellm.ai/blog/jev-auto-router-benchmark
- https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway · https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk · https://vercel.com/ai-gateway/models/jev
- https://developers.cloudflare.com/ai/models/typesafe/jev/
- https://pydantic.dev/docs/ai/models/typesafe/
- https://openrouter.ai/docs/cookbook/building-agents/gate-tool-calls-with-jev · https://openrouter.ai/typesafe/jev-1.13
- https://www.netlify.com/changelog/typesafe-jev-ai-gateway/
- https://dev.to/alexmercedcoder/fast-classification-models-llms-and-the-apache-iceberg-lakehouse-387d · https://datalakehousehub.com/blog/jev-classification-models-iceberg-lakehouse/
- https://motherduck.com/blog/motherduck-supports-jev/
- https://www.theregister.com/ai-and-ml/2026/09/16/typesafe-ai-debuts-model-for-machines-that-plays-doom/5296711
- https://www.datacamp.com/blog/system-one-models-jev
- https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/
- https://medium.com/@creativeaininja/typesafes-jev-makes-ai-decisions-fast-enough-to-play-doom-68fdcce1159a
- https://www.cloudraft.io/blog/top-use-cases-of-jev-typesafe-ai-model
- https://explainx.ai/blog/jev-self-driving-latency-argument-2026
- https://flowtivity.ai/blog/jev-use-cases-vs-text-output-llms/
- https://dev.to/webofmike/i-benchmarked-jev-on-agent-tool-call-risk-calibration-held-49i3
- https://www.tomshardware.com/tech-industry/artificial-intelligence/typesafe-ais-jev-offers-an-alternative-to-llms-that-claims-to-be-193x-faster-and-445x-cheaper-system-one-type-model-is-bespoke-for-probabilistic-decision-making

---

## 확인 못한 것

1. **docs.typesafe.ai 원문 직접 확인 불가.** 미러(thiagoadril/typesafe-docs)에는 models, jaggedness, API reference, 대부분의 쿡북 페이지 **본문이 빠져 있고 frontmatter(description)만** 남아 있다. 쿡북 수치(rerank 5→18%, parallel 12.2x/10.0x, skill suggestion 182개 등)는 그 description 문장에서 가져왔고, jaggedness 항목은 검색요약과 kenhuangus README의 요약에 의존했다.
2. **TypeSafe 런치 블로그 원문 미확인.** DOOM "~10 결정/초, ~$7/시간", "스크립트 봇이 더 잘 함", 193.6x/444.6x, Wikiracing 데모 설명은 The Register·DataCamp·kenhuangus README·검색요약의 재서술이다.
3. **컨텍스트 한도 불일치.** primitives 페이지 "약 32,000 토큰", Models 페이지(Anil-matcha 인용) "요청당 64k / state+최장 질문 32k", Cloudflare 카탈로그 "32,000", llmreference.com "66k". 어느 것이 현재 정확한지 원문으로 확인하지 못했다.
4. **beri.net / XenoSpectrum 피싱 실험**의 5개 질문 문구, 라벨 출처, 89.4%(단순 결합) vs 95.0%(회귀) 관계는 검색요약만으로 확인. 두 매체가 같은 실험을 인용하는지 독립 실험인지 불명.
5. **ayautomate 벤치마크**의 태스크 정의·데이터셋·모델 버전 세부는 미확인(수치만 검색요약).
6. **Good Start Labs 6,003건 / 91.5% / $160 vs $33,000**은 Langfuse·Reticle이 재인용한 것으로, 원 보고서를 찾지 못했다.
7. **LangChain "68% @ $0.0004 @ 0.4 s vs Terra 68% / Opus 5 73%"** 수치의 출처(LangChain 자체 재측정인지 evals.typesafe.ai 재인용인지) 미확인.
8. **Vercel "5–18x faster than GPT-5.6 Luna"** 내부 분류기 결과는 Vercel이 벤치마크를 공개하지 않았다(검색요약도 그렇게 명시).
9. **browser-use jev-ultrafast "100% 과제 해결, 112x 저렴"**은 README에 없고 Flowtivity 검색요약에만 있음. README에서 확인된 것은 "Zürich→London 7.1초"까지.
10. **1,700통/18센트, 스팸 96.0→98.3%, MotherDuck 10만 행 40 s $0.50, ~$20/백만 코멘트, 1,943 rows/s**는 각각 검색요약 또는 큐레이션 목록 인용이며 원 페이지·측정 조건을 보지 못했다.
11. **Minecraft 8:43 결과**는 저자가 "영상·이벤트 로그는 로컬에만 있어 리포지토리로 재현 불가"라고 명시.
12. **jev-drone 77.5 m 완주**는 단일 런이며 저자 스스로 "더 단순한 아레나 3시드 비교에서는 이점 없음"이라고 밝힘.
13. **evals.typesafe.ai 67.8% 평균 일치**의 워크플로별 세부와 방법론 페이지 원문은 미확인.
14. **OpenRouter 쿡북의 실제 질문 문구와 임계값 수치**, **Cloudflare REST 요청 예시**, **Vercel KB 가이드 코드**는 검색요약 수준에서만 확인(단, Vercel AI SDK 문서와 Cloudflare 카탈로그 JSON은 GitHub raw로 원문 확인).
15. 이 문서의 기존 파일 `JEV_RESEARCH.md`(같은 리포지토리)가 인용한 Wikipedia·TechCrunch·requesty·firecrawl·substack 페이지는 이번 조사에서 접근하지 않았다.
