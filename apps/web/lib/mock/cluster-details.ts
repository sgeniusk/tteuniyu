/**
 * Mock cluster detail content — v1.6.4 patch (structured AI analysis).
 *
 * For each of the 15 mock clusters in `lib/mock/clusters.ts`, supplies:
 *  - `ai_analysis`: 3-section structure (subject? + why_trending + coverage_summary)
 *  - `outlet_reports`: 4~7 fabricated headlines from outlets in the pool
 *    (`lib/mock/outlets.ts`), with stance roughly matching the coverage.
 *
 * P0w: synthetic data. P0a (T-005 + T-006) replaces with:
 *  - `articles` table rows from real RSS ingestion
 *  - `summaries` row from Claude Haiku constrained to the same JSON shape
 *    (subject? + why_trending + coverage_summary) — see PRD v1.6.4 §A-5.
 *  - copy-rate ≤ 15% enforced by `harness:summary-copy-rate` (applies to
 *    `coverage_summary` only — `subject` is a definitional sentence).
 */

import type { OutletStance } from '@/lib/mock/outlets'

export interface OutletReport {
  outlet_slug: string
  outlet_name: string
  stance: OutletStance
  headline: string
  /** Minutes ago (relative to "now"), for dynamic relative-time rendering. */
  minutes_ago: number
  /** Path appended to outlet base_url; demo only — never fetched. */
  path: string
}

export interface AiAnalysis {
  /** Optional 1-line definition of the subject (person / org / event). */
  subject?: string
  /** Why this issue is trending right now — trigger event. */
  why_trending: string
  /** What outlets reported, with stance differences highlighted. */
  coverage_summary: string
}

export interface ClusterDetail {
  ai_analysis: AiAnalysis
  outlet_reports: readonly OutletReport[]
}

export const CLUSTER_DETAILS: Readonly<Record<string, ClusterDetail>> = {
  // 1. 미국 연준 5월 금리 동결 시사 — economy (subject 생략, 정책 이슈)
  '00000000-0000-4000-8000-000000000001': {
    ai_analysis: {
      why_trending:
        '연준 위원 다수가 5월 회의 직전 발언에서 “기준금리 동결을 선호한다”는 의사를 잇따라 밝히면서 시장의 인하 기대가 6월~7월로 미뤄졌다. 한국은행이 다음 주 금융통화위원회를 앞두고 있어 국내 영향이 곧바로 보도되는 상황.',
      coverage_summary:
        '외신은 “인플레이션 둔화 속도가 충분치 않다”는 연준 입장을 중립적으로 전달했다. 보수 경제지는 환율·주식 시장의 안도와 외국인 매수세 회복에 무게를 뒀고, 진보 매체는 한국의 추가 인하 공간이 넓어진 점을 부각하며 가계부채 부담 완화를 기대한다고 봤다. 한국은행은 “미·한 금리차 좁혀질 여지”를 언급하면서도 자본 유출 위험을 지속 관찰한다고 발표했다.',
    },
    outlet_reports: [
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'Fed signals May pause; Asia FX firms', minutes_ago: 18, path: '/markets/fed-may-pause' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '연준 동결 신호, 환율·증시 안도 — 외국인 매수세 회복', minutes_ago: 24, path: '/article/2026050201' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '연준 동결, 한은 추가 인하 공간 넓혀 — 가계부채 부담 완화 기대', minutes_ago: 36, path: '/economy/article/202605020001' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '미 연준, 5월 동결 가능성 시사… 6월 인하 베팅 확대', minutes_ago: 42, path: '/view/AKR20260502001' },
      { outlet_slug: 'bloomberg', outlet_name: 'Bloomberg', stance: 'foreign', headline: 'Powell hints at patience; markets price July cut', minutes_ago: 51, path: '/news/articles/fed-pause' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '한국은행 “미 동결, 환율 안정에 도움… 인하 시점 신중”', minutes_ago: 64, path: '/article/202605020900001' },
    ],
  },

  // 2. 국민연금 개편안 — politics (subject 생략, 정책 이슈)
  '00000000-0000-4000-8000-000000000002': {
    ai_analysis: {
      why_trending:
        '정부가 어제 발표한 국민연금 개편안 세부 시행 자료가 공개되면서, 보험료율 인상 적용 대상이 4분의 1 가입자라는 점이 드러났다. 청년·자영업자 단체가 즉각 반발 성명을 내며 24시간 만에 정치권 쟁점으로 부상.',
      coverage_summary:
        '진보 매체는 “세대 간 책임 분담 첫걸음, 노후 빈곤 막을 마지노선”이라며 형평성·지속가능성 측면을 강조했다. 보수 매체는 청년·자영업자 부담 가중과 “원칙 후퇴” 비판을 부각했고, 야당의 재논의 요구도 비중 있게 다뤘다. 공영방송은 보건복지부의 “지속가능성 위한 불가피한 조정” 입장과 입법 일정을 중립적으로 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '연금 개편, 세대 간 책임 분담 첫걸음… "노후 빈곤 막을 마지노선"', minutes_ago: 22, path: '/society/article/202605020001' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '국민연금 보험료율 인상안, 형평성 논의 본격화', minutes_ago: 33, path: '/article/202605020900002' },
      { outlet_slug: 'chosun', outlet_name: '조선일보', stance: 'conservative', headline: '4분의 1 가입자 보험료 인상… 청년·자영업자 충격', minutes_ago: 41, path: '/politics/202605020001' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '연금 개편안 발표 하루 만에 시민단체·野 “재논의” 요구', minutes_ago: 55, path: '/news/Politics/article/all/202605020001' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '복지부 "연금 지속가능성 위해 불가피"… 입법 절차 착수', minutes_ago: 70, path: '/news/view.do?ncd=2026050201' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '국민연금 개편안 4분의 1 가입자 영향… 쟁점 정리', minutes_ago: 88, path: '/news/2026/05/02/A001' },
    ],
  },

  // 3. 서울시 청년 월세 지원 확대 — society (subject 생략, 정책 이슈)
  '00000000-0000-4000-8000-000000000003': {
    ai_analysis: {
      why_trending:
        '서울시가 청년 월세 지원 사업을 기존 1만 명에서 3만 명으로 확대하고, 월 지원금을 20만원에서 30만원으로 상향한다고 공식 발표했다. 신청 접수가 2주 뒤 시작돼 즉각적 관심을 모음.',
      coverage_summary:
        '진보 매체는 주거권 강화 측면을 환영하면서도 “단기 지원만으로는 부족, 공공임대 확대 병행이 필수”라고 짚었다. 보수 매체는 재정 지속가능성과 도덕적 해이를 우려했고, 동시에 청년 주거 부담의 심각성에 공감을 표시했다. 공영방송은 신청 자격·일정·필요 서류 등 실용 정보를 중심으로 보도.',
    },
    outlet_reports: [
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '서울시 청년 월세 지원 3배 확대… 주거권 첫걸음', minutes_ago: 15, path: '/article/202605020900003' },
      { outlet_slug: 'pressian', outlet_name: '프레시안', stance: 'progressive', headline: '“월세 지원 환영하지만, 공공임대 확대 없으면 미봉책”', minutes_ago: 27, path: '/pages/articles/2026050201' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '서울시 청년 월세 30만원으로 인상… 신청 5월 15일부터', minutes_ago: 38, path: '/news/view.do?ncd=2026050202' },
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: '월세 지원 대상자 3만 명, 어떻게 신청하나', minutes_ago: 49, path: '/news/endPage.do?news_id=N1007123456' },
      { outlet_slug: 'joongang', outlet_name: '중앙일보', stance: 'conservative', headline: '청년 월세 지원 확대, 재정 부담은 누가', minutes_ago: 60, path: '/article/2026050201' },
      { outlet_slug: 'hankook', outlet_name: '한국일보', stance: 'mixed', headline: '서울 청년 주거 지원 ‘선택적 보편’으로 설계', minutes_ago: 78, path: '/News/Read/A2026050201' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '월세 지원 확대 발표 — 자격 요건과 한계점', minutes_ago: 95, path: '/news/Society/article/all/202605020002' },
    ],
  },

  // 4. OpenAI 신규 한국어 모델 공개 — tech_science (subject: OpenAI)
  '00000000-0000-4000-8000-000000000004': {
    ai_analysis: {
      subject:
        'OpenAI는 Sam Altman이 운영하는 미국의 AI 연구·서비스 기업으로, ChatGPT·GPT-4 등 대형 언어 모델을 개발한다. 본사는 샌프란시스코.',
      why_trending:
        'OpenAI가 한국어 전용 토크나이저로 추론 비용을 30% 가량 절감한 신규 모델을 발표했다. 한자·한글 혼용 문장 정확도가 1.5배 향상됐다는 자사 벤치마크가 공개돼 국내 LLM 업계가 즉각 반응.',
      coverage_summary:
        '외신은 한국 시장에 대한 OpenAI의 본격 침투로 해석하며 가격 경쟁력에 주목했다. 국내 보수 경제지는 “토종 AI 경쟁력 위기, 데이터 주권 시급”을 강조했고, 진보 매체는 “기술 종속 가속” 우려를 함께 짚었다. 공영방송·통신사는 토크나이저 구조와 한국 매체사·교육 시장의 적용 가능성을 중립적으로 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'OpenAI rolls out Korean-tuned model, undercuts local rivals', minutes_ago: 12, path: '/technology/openai-korean' },
      { outlet_slug: 'bloomberg', outlet_name: 'Bloomberg', stance: 'foreign', headline: 'OpenAI’s Korean push pressures Naver, Kakao on cost', minutes_ago: 19, path: '/news/articles/openai-korean-push' },
      { outlet_slug: 'nyt', outlet_name: 'The New York Times', stance: 'foreign', headline: 'AI race localizes: OpenAI targets Korea with cheaper inference', minutes_ago: 28, path: '/2026/05/02/technology/openai-korea.html' },
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '국내 AI업계 “데이터 주권 시급” — 토종 모델 경쟁력 위기', minutes_ago: 35, path: '/article/2026050201' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '오픈AI 한국어 모델, ‘기술 종속’ 가속 우려도', minutes_ago: 47, path: '/economy/it/article/202605020001' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: 'OpenAI 한국어 모델 공개 — 토크나이저·가격 경쟁력 분석', minutes_ago: 62, path: '/view/AKR20260502002' },
      { outlet_slug: 'nikkei', outlet_name: '日経新聞', stance: 'foreign', headline: 'オープンAIが韓国語専用モデル投入、推論コスト30%削減', minutes_ago: 81, path: '/article/DGXZQO20260502' },
    ],
  },

  // 5. 제주 해녀 문화 유네스코 추가 등재 추진 — culture_sports (subject: 제주 해녀)
  '00000000-0000-4000-8000-000000000005': {
    ai_analysis: {
      subject:
        '제주 해녀는 별다른 산소 장비 없이 잠수해 어로 활동을 하는 제주 여성 집단으로, 2016년 인류무형문화유산에 등재된 한국 전통 직업.',
      why_trending:
        '제주도가 해녀 문화의 무형문화유산 “추가” 등재를 위해 유네스코에 새 신청서를 제출할 계획이라고 발표했다. 2016년 등재 후 8년 만의 후속 조치로, 어로 기술뿐 아니라 공동체 문화 전반을 포괄하는 형태가 될 전망.',
      coverage_summary:
        '통신사·공영방송은 신청서 제출 일정과 포함 범위를 중심으로 사실 보도했다. 진보 매체는 “기술을 넘어 공동체 문화로 확장 등재”라는 의미를 강조했고, 외신(BBC)은 한국 전통 문화 유산 보존 노력의 사례로 다뤘다. 표본이 작아 전체 분포는 형성 중.',
    },
    outlet_reports: [
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '제주 해녀 문화 유네스코 추가 등재 추진… 8년 만의 후속 조치', minutes_ago: 75, path: '/view/AKR20260502003' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '해녀 공동체 문화 포함, 유네스코 신청서 새로 작성', minutes_ago: 110, path: '/news/view.do?ncd=2026050203' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '제주 해녀 문화, 어로 기술 넘어 공동체로 확장 등재', minutes_ago: 142, path: '/culture/article/202605020001' },
      { outlet_slug: 'bbc', outlet_name: 'BBC', stance: 'foreign', headline: 'Jeju “Haenyeo” divers seek expanded UNESCO heritage status', minutes_ago: 200, path: '/news/world-asia-2026' },
    ],
  },

  // 6. 삼성전자 1분기 반도체 흑자 전환 — economy (subject: 삼성전자)
  '00000000-0000-4000-8000-000000000006': {
    ai_analysis: {
      subject:
        '삼성전자는 한국 최대 반도체·전자 기업으로, 메모리 반도체 시장 점유율 세계 1위(D램·낸드)이며 스마트폰·디스플레이도 함께 생산하는 종합 IT 그룹.',
      why_trending:
        '삼성전자가 1분기 반도체 부문 영업이익을 흑자로 전환했다고 잠정 실적을 통해 발표했다. AI 가속용 HBM(고대역폭메모리) 수요 회복이 주도한 것으로 분석되며, 분기 예측치를 상회.',
      coverage_summary:
        '보수 경제지는 “위기 탈출의 분기점”으로 평가하며 2분기 본격 회복과 SK하이닉스 동반 호조를 전망했다. 진보 매체는 “이익이 임금·하청 단가로 이어질지 지켜봐야”라며 노동 분배 측면을 짚었다. 공영방송은 반도체 흑자가 한국 수출 회복으로 이어질지 분석했고, 외신(Reuters)은 글로벌 메모리 사이클 회복 신호로 판독.',
    },
    outlet_reports: [
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '삼성전자 반도체, 1분기 흑자 전환… HBM이 끌었다', minutes_ago: 14, path: '/article/2026050202' },
      { outlet_slug: 'maeil', outlet_name: '매일경제', stance: 'conservative', headline: '삼성 반도체 흑자, 위기 탈출 분기점 — 2분기 본격 회복 전망', minutes_ago: 22, path: '/news/article/2026/05/02/A1' },
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '메모리 가격 반등, 삼성 흑자 견인 — SK하이닉스도 호조', minutes_ago: 31, path: '/article/2026050202' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '삼성 반도체 1분기 영업이익 흑자… 사상 최대 폭 회복', minutes_ago: 45, path: '/view/AKR20260502004' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '반도체 흑자 전환, 한국 수출 회복으로 이어질까', minutes_ago: 60, path: '/news/2026/05/02/A002' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '삼성 흑자, 임금·하청 단가로 이어질지 “지켜봐야”', minutes_ago: 78, path: '/economy/article/202605020002' },
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'Samsung’s Q1 chip swing-to-profit confirms memory cycle recovery', minutes_ago: 102, path: '/technology/samsung-q1' },
    ],
  },

  // 7. 의대 정원 증원 분쟁 6개월 합의안 — politics (subject 생략, 정책 분쟁)
  '00000000-0000-4000-8000-000000000007': {
    ai_analysis: {
      why_trending:
        '6개월 가까이 이어진 의대 정원 증원 분쟁이 정부와 의료계의 합의안 도출로 봉합 국면에 들어섰다. 단계적 증원·필수의료 보상 확대·전공의 처우 개선 등 5개 항목 합의가 알려지면서 24시간 만에 모든 매체가 다룸.',
      coverage_summary:
        '진보 매체는 “환자 공백 해소가 시급”이라며 합의를 환영했고, 필수의료 보상 확대로 지방 의료 회복이 관건이라는 분석을 제시했다. 보수 매체는 “원칙 후퇴”라는 비판과 “현실 인정”이라는 안도가 갈렸고, 합의 5개 항목을 상세히 전달했다. 공영방송은 전공의 복귀 절차에 초점을 맞췄으며, 외신은 윤석열 정부 정책의 첫 대형 협상 사례로 보도.',
    },
    outlet_reports: [
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '정부·의료계 6개월 만에 합의안 도출 — 단계적 증원에 합의', minutes_ago: 11, path: '/news/view.do?ncd=2026050204' },
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: '의대 정원 합의안 5개 항목 정리 — 전공의 복귀 절차는?', minutes_ago: 19, path: '/news/endPage.do?news_id=N1007234567' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '의정 갈등 봉합 — “환자 공백 해소가 최우선”', minutes_ago: 29, path: '/society/article/202605020002' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '필수의료 보상 확대 합의 — 지방 의료 회복 관건', minutes_ago: 41, path: '/article/202605020900004' },
      { outlet_slug: 'chosun', outlet_name: '조선일보', stance: 'conservative', headline: '“원칙 후퇴” 비판도… 정부, 단계적 증원 수용', minutes_ago: 55, path: '/national/2026050201' },
      { outlet_slug: 'joongang', outlet_name: '중앙일보', stance: 'conservative', headline: '의·정 합의 5대 항목 전문 분석 — 무엇이 바뀌나', minutes_ago: 73, path: '/article/2026050202' },
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'South Korea ends doctors’ standoff with phased quota deal', minutes_ago: 95, path: '/world/asia-pacific/korea-doctors' },
    ],
  },

  // 8. 카카오 신규 AI 비서 베타 공개 — tech_science (subject: 카카오)
  '00000000-0000-4000-8000-000000000008': {
    ai_analysis: {
      subject:
        '카카오는 한국의 메신저·핀테크·모빌리티 플랫폼 기업으로, 카카오톡 월간 사용자 4,800만+를 기반으로 한 종합 IT 그룹.',
      why_trending:
        '카카오가 자체 LLM 기반 AI 비서를 베타 신청 5만 명 한정으로 공개했다. 카카오톡 메신저 안에서 음성·텍스트로 호출 가능하고, 일정·결제·지도 등 카카오 서비스 내 작업을 자동 처리하는 형태.',
      coverage_summary:
        '보수 경제지는 사용기를 통해 “일정·송금·길찾기 모두 한 번에”라며 통합 자동화 가치를 강조했다. 공영방송은 베타 신청 폭주를 사실 보도했고, 진보 매체는 “개인정보 처리 범위는 어디까지” 묻는 우려를 함께 다뤘다. 외신(Bloomberg)은 “Kakao의 AI 비서가 한국 5천만 사용자 락인 시도”라고 평가.',
    },
    outlet_reports: [
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '카카오 AI 비서 베타 — 메신저·결제·지도 통합 자동화', minutes_ago: 16, path: '/article/2026050203' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '카카오 AI 비서 사용기 — 일정 잡기, 송금 모두 한 번에', minutes_ago: 25, path: '/article/2026050203' },
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: '카카오 AI 비서, 음성·텍스트 모두 — 베타 신청 5만 명 돌파', minutes_ago: 38, path: '/news/endPage.do?news_id=N1007345678' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '카카오 AI 비서, 개인정보 처리 범위는 어디까지', minutes_ago: 52, path: '/economy/it/article/202605020002' },
      { outlet_slug: 'bloomberg', outlet_name: 'Bloomberg', stance: 'foreign', headline: 'Kakao’s AI assistant aims to lock in Korea’s 50M users', minutes_ago: 72, path: '/news/articles/kakao-ai-assistant' },
    ],
  },

  // 9. 북한 단거리 미사일 동해 발사 — international (subject 생략, 사건)
  '00000000-0000-4000-8000-000000000009': {
    ai_analysis: {
      why_trending:
        '북한이 약 2시간 전 동해상으로 단거리 탄도미사일 2발을 발사했다. 합동참모본부 발표 직후 한미 공조 대응이 표명되면서 모든 외신·국내 매체가 즉시 보도.',
      coverage_summary:
        '통신사·외신은 발사 시각·궤적·요격 여부 등 사실 정보 위주로 보도했다. 보수 매체는 “국방 태세 점검 시급”과 추가 도발 가능성을 부각했고, 진보 매체는 “긴장 완화 채널 복원이 동시에 필요”함을 짚었다. BBC는 한국 정부의 새 외교 노선과의 충돌 가능성을 분석.',
    },
    outlet_reports: [
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '북한, 동해상으로 단거리 미사일 2발… 합참 “세부 분석 중”', minutes_ago: 8, path: '/view/AKR20260502005' },
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'North Korea fires short-range ballistic missiles into East Sea', minutes_ago: 13, path: '/world/asia-pacific/nk-missile-2026' },
      { outlet_slug: 'ap', outlet_name: 'Associated Press', stance: 'foreign', headline: 'NK missile launch tests calm under new South Korean policy', minutes_ago: 19, path: '/article/nk-missile-test' },
      { outlet_slug: 'chosun', outlet_name: '조선일보', stance: 'conservative', headline: '북 미사일 도발 — “국방 태세 점검 시급”', minutes_ago: 28, path: '/politics/2026050202' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '한미 공조 즉각 대응 — 추가 도발 가능성에 무게', minutes_ago: 38, path: '/news/Politics/article/all/202605020002' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '미사일 발사에 우려 — “긴장 완화 채널 복원 동시 필요”', minutes_ago: 55, path: '/politics/article/202605020001' },
      { outlet_slug: 'bbc', outlet_name: 'BBC', stance: 'foreign', headline: 'North Korea launches short-range missiles, Seoul condemns', minutes_ago: 70, path: '/news/world-asia-2026-2' },
    ],
  },

  // 10. 현대차 신형 전기차 사전예약 첫날 흥행 — economy (subject: 현대자동차)
  '00000000-0000-4000-8000-000000000010': {
    ai_analysis: {
      subject:
        '현대자동차는 한국 최대 자동차 제조사로, 글로벌 판매량 3위 그룹(현대차+기아+제네시스). 본사는 서울, 주요 EV 전용 라인업을 빠르게 확장 중.',
      why_trending:
        '현대차가 어제 공개한 신형 전기차의 사전예약이 첫날 4만 대를 돌파해 사상 최단 기록을 경신했다. 보조금 적용 시 4천만원 초반대 가격과 600km 주행거리가 핵심 흡인 요인으로 분석.',
      coverage_summary:
        '보수 경제지는 “가격·성능 모두 잡았다”며 사상 최대 흥행을 부각했고, 외신(Reuters·Nikkei)은 한국 전기차의 가격 경쟁력 회복 신호로 평가했다. 공영방송은 충전 인프라 점검과 중고 EV 가격 영향을 다뤘고, 진보 매체는 “국내 부품사 수혜 기대” 옆에 “노조의 고용 안정성 확인 필요” 입장을 함께 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '현대 신형 EV 사전예약 4만 돌파 — 첫날 신기록', minutes_ago: 17, path: '/article/2026050204' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '4천만원대 600km — 가격·성능 모두 잡았다', minutes_ago: 26, path: '/article/2026050204' },
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: '현대 EV 사전예약 흥행 — 충전 인프라 점검도 본격화', minutes_ago: 39, path: '/news/endPage.do?news_id=N1007456789' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '신형 전기차 흥행, 중고 EV 가격 영향은', minutes_ago: 51, path: '/news/view.do?ncd=2026050205' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '국내 부품사 수혜 기대 — 노조 “고용 안정성 확인 필요”', minutes_ago: 68, path: '/article/202605020900005' },
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'Hyundai’s sub-$30K EV draws 40K reservations day one', minutes_ago: 84, path: '/business/autos-transportation/hyundai-ev' },
      { outlet_slug: 'nikkei', outlet_name: '日経新聞', stance: 'foreign', headline: '現代の新型EVが初日4万台、価格戦略が奏功', minutes_ago: 100, path: '/article/DGXZQO20260502B' },
    ],
  },

  // 11. 봄철 미세먼지 농도 30% 증가 — society (subject 생략, 통계)
  '00000000-0000-4000-8000-000000000011': {
    ai_analysis: {
      why_trending:
        '환경부 발표에 따르면 4월 평균 PM2.5 농도가 평년 대비 30% 높았다. 중국발 황사·국내 산불·기상 정체 삼중고가 복합 작용한 결과로, 보건당국이 어린이·고령자 외출 자제를 권고하면서 즉각 보도가 확산.',
      coverage_summary:
        '진보 매체는 산불·황사·기상 정체 ‘삼중고’와 정책 대응 한계를 짚었고, 보수 매체는 학교 야외수업 취소·학부모 불안을 부각했다. 공영방송과 통신사는 미세먼지 마스크 가이드, 비상저감조치 자동차 운행 제한 등 실용 정보를 폭넓게 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '4월 PM2.5 30% ↑ — 산불·황사·기상 정체 삼중고', minutes_ago: 23, path: '/society/article/202605020003' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '봄철 미세먼지 평년 대비 30% 증가 — 외출 자제 권고', minutes_ago: 31, path: '/news/view.do?ncd=2026050206' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '미세먼지 마스크 어떻게 골라야 하나 — 실용 가이드', minutes_ago: 44, path: '/news/2026/05/02/A003' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '학교 야외수업 잇따라 취소 — 학부모 불안 가중', minutes_ago: 58, path: '/news/Society/article/all/202605020003' },
      { outlet_slug: 'hankook', outlet_name: '한국일보', stance: 'mixed', headline: '미세먼지 비상저감조치 — 자동차 운행 제한 시행', minutes_ago: 75, path: '/News/Read/A2026050202' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '대기질 악화 장기화 우려 — 정책 대응 어디까지 왔나', minutes_ago: 95, path: '/article/202605020900006' },
    ],
  },

  // 12. 쿠팡 새벽배송 권역 9개 도시 확대 — economy (subject: 쿠팡)
  '00000000-0000-4000-8000-000000000012': {
    ai_analysis: {
      subject:
        '쿠팡은 한국 최대 e-커머스 플랫폼으로, 자체 풀필먼트망(로켓배송·새벽배송) 운영. 2021년 NYSE 상장. 본사는 서울.',
      why_trending:
        '쿠팡이 새벽배송 권역을 전국 9개 도시로 확대한다고 발표했다. 신규 권역에 광주·대전·울산·청주 등 비수도권 거점 도시가 포함되면서 지방 풀필먼트 신축 계획도 함께 공개.',
      coverage_summary:
        '보수 경제지는 “물류 인프라 투자가 지방 소비를 견인할 것”으로 봤고, 풀필먼트 신축 일정을 상세 보도했다. 진보 매체는 “플랫폼 노동 환경 개선 병행이 필요”함을 짚었고, 미디어오늘은 야간 노동 실태가 9개 도시 확장 보도에 묻혀선 안 된다고 비판. 통신사는 적용 시점·요건을 중립적으로 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '쿠팡 새벽배송 9개 도시 확대 — 비수도권 본격 진출', minutes_ago: 21, path: '/article/2026050205' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '광주·대전·울산 등 — 쿠팡 풀필먼트 신축 잇따라', minutes_ago: 33, path: '/article/2026050205' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '새벽배송 확대 환영 — “플랫폼 노동 환경 개선 병행 필요”', minutes_ago: 47, path: '/article/202605020900007' },
      { outlet_slug: 'mediatoday', outlet_name: '미디어오늘', stance: 'progressive', headline: '쿠팡 야간 노동 실태, 9개 도시 확장에 묻혀선 안 된다', minutes_ago: 70, path: '/news/articleView.html?idxno=2026050201' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '쿠팡 새벽배송 권역 확대 발표 — 적용 시점·요건 정리', minutes_ago: 88, path: '/view/AKR20260502006' },
    ],
  },

  // 13. 한국 영화 칸 영화제 진출 — culture_sports (subject: 칸 영화제)
  '00000000-0000-4000-8000-000000000013': {
    ai_analysis: {
      subject:
        '칸 영화제(Festival de Cannes)는 1946년 시작된 프랑스의 권위 있는 국제 영화 시상식으로, 매년 5월 칸에서 개최되며 황금종려상이 최고상.',
      why_trending:
        '한국 영화 두 편이 올해 칸 영화제 경쟁 부문에 진출했다고 영화진흥위원회가 공식 발표했다. 한 편은 신예 감독의 실험적 드라마, 다른 한 편은 베테랑 감독의 사회 비판 작품으로 알려지면서 외신·국내 매체 모두 다룸.',
      coverage_summary:
        '외신(NYT·Reuters·BBC)은 “한국 영화 칸 모멘텀 회복”이라는 의미를 부각했다. 진보 매체는 “신예·베테랑 동반 진출의 다양성 신호”를 강조했고, 보수 매체는 “산업 위기 속 거둔 성과”와 정부·민간 지원 점검 필요성을 짚었다. 공영방송은 작품 정보·감독 인터뷰를 정리해 전달.',
    },
    outlet_reports: [
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '한국 영화 2편 칸 영화제 경쟁 부문 진출 — 공식 발표', minutes_ago: 25, path: '/view/AKR20260502007' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '신예·베테랑 동반 진출 — 한국 영화 다양성의 신호', minutes_ago: 36, path: '/culture/article/202605020002' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '칸 영화제 경쟁 부문 한국 영화 — 작품 정보 정리', minutes_ago: 48, path: '/news/view.do?ncd=2026050207' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '산업 위기 속 거둔 성과 — 정부·민간 지원 점검 필요', minutes_ago: 62, path: '/news/Culture/article/all/202605020001' },
      { outlet_slug: 'nyt', outlet_name: 'The New York Times', stance: 'foreign', headline: 'Korean cinema regains momentum at Cannes 2026', minutes_ago: 80, path: '/2026/05/02/movies/cannes-korea.html' },
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'Two Korean films join Cannes competition lineup', minutes_ago: 100, path: '/lifestyle/cannes-korean-films' },
      { outlet_slug: 'bbc', outlet_name: 'BBC', stance: 'foreign', headline: 'South Korean directors return to Cannes Palme d’Or race', minutes_ago: 130, path: '/news/entertainment-arts-2026' },
    ],
  },

  // 14. KBO 흥행 5년 만에 최다 관중 경신 — culture_sports (subject: KBO)
  '00000000-0000-4000-8000-000000000014': {
    ai_analysis: {
      subject:
        'KBO 리그(Korea Baseball Organization)는 한국 프로야구 최상위 리그로, 1982년 출범. 10개 구단 페넌트레이스+포스트시즌 운영.',
      why_trending:
        'KBO 리그 누적 관중이 시즌 개막 한 달 만에 5년 만의 시즌 최다를 경신했다. 신생 강호의 등장과 트레이드 시즌의 변동성, 새 구장 효과가 복합적으로 작용했다는 분석이 일제히 나옴.',
      coverage_summary:
        '공영방송은 신축 구장 효과를 부각하고 흥행 요인을 분석했다. 보수 경제지(머니투데이)는 입장권 매출 사상 최대를 강조하며 KBO의 마케팅 전략 성공으로 평가했다. 진보 매체는 지방 구단 흥행이 지역 경제 균형에 도움 된다는 측면을 다룸.',
    },
    outlet_reports: [
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: 'KBO 누적 관중 5년 만에 최다 — 신축 구장 효과', minutes_ago: 19, path: '/news/endPage.do?news_id=N1007567890' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '올해 KBO, 무엇이 다른가 — 흥행 요인 분석', minutes_ago: 30, path: '/news/2026/05/02/A004' },
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: 'KBO 마케팅 전략 통했다 — 입장권 매출도 사상 최대', minutes_ago: 44, path: '/article/2026050206' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '지방 구단 흥행 — 지역 경제 균형에도 보탬', minutes_ago: 60, path: '/article/202605020900008' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: 'KBO 시즌 누적 관중 통계 — 5년 만에 신기록', minutes_ago: 78, path: '/view/AKR20260502008' },
    ],
  },

  // 15. 동해 심해 가스전 시추 결과 — economy (subject: 한국석유공사) — insufficient_sample
  '00000000-0000-4000-8000-000000000015': {
    ai_analysis: {
      subject:
        '한국석유공사(KNOC)는 1979년 설립된 한국의 국영 석유·가스 공기업으로, 산업통상자원부 산하. 본사는 울산.',
      why_trending:
        '한국석유공사가 동해 심해 가스전 시추 결과를 공식 발표했다. 초기 결과는 “상업화 가능성을 가늠하기에는 표본이 작아 추가 분석 필요”라고 명시되면서, 일부 매체만 다루는 단계.',
      coverage_summary:
        '통신사는 발표 사실과 “추가 분석 필요” 입장을 그대로 전달했다. 보수 경제지(머니투데이)는 상업화 가능성을 분석한 반면, 진보 매체(한겨레)는 환경 영향 평가 병행 필요성을 짚었다. 표본이 적어 분포는 형성 중.',
    },
    outlet_reports: [
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '동해 심해 가스전 시추 결과 — “추가 분석 필요”', minutes_ago: 65, path: '/view/AKR20260502009' },
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '동해 가스전 1차 결과 발표 — 상업화 가능성은', minutes_ago: 110, path: '/article/2026050207' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '시추 결과 공개 — 환경 영향 평가도 병행돼야', minutes_ago: 180, path: '/economy/article/202605020003' },
    ],
  },
} as const

export function getClusterDetail(clusterId: string): ClusterDetail | undefined {
  return CLUSTER_DETAILS[clusterId]
}
