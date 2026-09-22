# Jev (세일즈 레벨) Resources

이 워크스페이스의 상위 조사 문서: [`../../JEV_RESEARCH.md`](../../JEV_RESEARCH.md) (모델 개요), [`../../research/jev-use-cases.md`](../../research/jev-use-cases.md) (유즈케이스·수치·안티패턴). 두 문서가 1차 출처 요약이므로 레슨은 여기서 시작한다.

## Knowledge

### TypeSafe 공식 (포지셔닝·주장의 원본)
- [Blog: "Introducing System One Models & Jev" (TypeSafe AI)](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
  런치 포스트. "System One", 193.6x/444.6x, 환각 0%의 출처. Use for: 벤더가 무엇을 주장하는지 정확히 인용할 때. 이 환경에서는 원문 직접 접근 불가 → 검색 요약과 미러로 확인.
- [Docs: use-case map (docs.typesafe.ai/concepts/use-case-map)](https://docs.typesafe.ai/concepts/use-case-map)
  5대 카테고리(AI 자동화·실시간·빅데이터 map-reduce·범용 검증·하네스 엔지니어링)와 산업별 모듈. Use for: 고객 업무를 매핑할 때의 기준 좌표.
- [Docs 미러: thiagoadril/typesafe-docs (GitHub)](https://github.com/thiagoadril/typesafe-docs)
  docs.typesafe.ai 마크다운 미러. 이 환경에서 읽을 수 있는 유일한 공식 문서 사본. Use for: 공식 문구 확인. 단, 일부 페이지는 frontmatter만 남아 있음.
- [evals.typesafe.ai](https://evals.typesafe.ai/)
  TypeSafe 자체 워크플로 평가 페이지. Use for: 벤더 수치의 방법론 한계를 설명할 때(정답 라벨이 GPT-6 Astra·Fable 5.1 평균).

### 독립 검증·비판 (반론 대응의 원본)
- [ayautomate: "Jev vs GPT and Claude: Independent Benchmark (2026)"](https://www.ayautomate.com/blog/jev-vs-llm-benchmark)
  소형 모델 대비 중위 2.0~3.6배 빠름, 4.7~7.5배 저렴, 정확도 비슷. Use for: "광고 수치는 재현되지 않았다"를 말할 때.
- [beri.net: "Jev Scores 62.6% Asked Once and 95% Split Five Ways"](https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval)
  질문 분해에 따른 정확도 편차. Use for: "정확도는 질문 설계에 달렸다"는 솔직한 한계 설명.
- [XenoSpectrum: "Cheaper and Faster Than Claude, But Accuracy Swings With How You Ask"](https://xenospectrum.com/en/jev-typesafe-bert-classifier-decomposition/)
  "BERT 분류기 아니냐" 논쟁 정리. Use for: "그냥 분류기" 반론 대응.
- [dev.to (miruky): "Jev Does Not Replace the LLM. It Changes Who Owns the Decision"](https://dev.to/miruky/jev-does-not-replace-the-llm-it-changes-who-owns-the-decision-3n6)
  LLM 대체가 아닌 보완이라는 프레임. Use for: 피치의 핵심 프레이밍.
- [GitHub gist (pjburnhill): Comprehensive project reference for TypeSafe Jev](https://gist.github.com/pjburnhill/adf8d28efcad9df037bfdece178ef965)
  강점·한계·패턴 정리. Use for: 한계 목록(근거 없음, 32K, 자유 텍스트 불가) 확인.

### 시장·자금·인물 (신뢰성 근거)
- [DCVC: "TypeSafe emerges from stealth with a new way of doing AI"](https://www.dcvc.com/news-insights/typesafe-emerges-from-stealth-with-a-new-way-of-doing-ai/)
  리드 투자자 공식 발표. Use for: $40M 시드, 창업자 배경(Diogo Almeida, 전 OpenAI).
- [TechCrunch (2026-09-18): "A new kind of AI model from a ChatGPT inventor is thrilling developers"](https://techcrunch.com/2026/09/18/a-new-kind-of-ai-model-from-a-chatgpt-inventor-is-thrilling-developers/)
  개발자 반응·창업자 인터뷰. Use for: 시장 반응 인용. 원문 접근 불가 → 검색 요약.
- [The Register (2026-09-16): TypeSafe debuts model for machines that plays DOOM](https://www.theregister.com/ai-and-ml/2026/09/16/typesafe-ai-debuts-model-for-machines-that-plays-doom/5296711)
  DOOM 데모(~10 결정/초, ~$7/시간). Use for: 실시간성을 직관적으로 보여주는 데모 인용.

### 통합 생태계 (도입 장벽이 낮다는 근거)
- [Vercel changelog: Jev now available on AI Gateway](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway) · [Cloudflare Workers AI 카탈로그](https://developers.cloudflare.com/ai/models/typesafe/jev/) · [Pydantic AI](https://pydantic.dev/docs/ai/models/typesafe/) · [LangChain 파트너 패키지](https://github.com/langchain-ai/langchain/tree/master/libs/partners/typesafe)
  Use for: "이미 주요 플랫폼에 올라가 있어 도입 비용이 낮다"는 논거.

### 큐레이션 목록 (사례 인용용)
- [AbdelStark/awesome-typesafe-jev](https://github.com/AbdelStark/awesome-typesafe-jev) · [cobanov/awesome-jev](https://github.com/cobanov/awesome-jev)
  출처 표기된 프로젝트 목록. Use for: 고객 산업에 맞는 실제 사례 하나를 꺼낼 때.

## Wisdom (Communities)

- [Hacker News: Jev 관련 스레드](https://news.ycombinator.com/item?id=49736660)
  실무자 비판·기술 반론이 집중되는 곳. Use for: 실제로 어떤 반론이 나오는지 수집.
- [GitHub Discussions/Issues: kenhuangus/jev-usecases](https://github.com/kenhuangus/jev-usecases)
  프로덕션 하네스 사례와 임계값 논의. Use for: "실제로 어떻게 쓰나" 질문에 답할 때.
- 사용자 커뮤니티 참여 선호: 아직 확인 안 함. 다음 세션에서 물어볼 것.

## Gaps
- 한국어 세일즈 관점 자료 부족 (eigent.ai 한국어 글, digitaltoday 기사 정도).
- 고객 산업별 ROI 계산 템플릿 없음. 레슨에서 직접 만들어 `reference/`에 넣어야 함.
- 실제 도입 기업의 공개 사례(케이스 스터디)가 없음. Early Access 단계라 당분간 없을 가능성 높음.
- 컨텍스트 한도(32K vs 64K vs 66K) 원문 확인 불가. 피치에서는 "약 32K, 확인 중"으로 말할 것.
