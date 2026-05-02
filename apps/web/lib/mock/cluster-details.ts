/**
 * Mock cluster detail content — v1.6.3 patch.
 *
 * For each of the 15 mock clusters in `lib/mock/clusters.ts`, supplies:
 *  - `ai_summary`: one paragraph in Korean (200~400 chars).
 *  - `outlet_reports`: 5~7 fabricated headlines from outlets in the
 *    pool (`lib/mock/outlets.ts`), with stance roughly matching the
 *    coverage distribution.
 *
 * P0w: synthetic data. P0a (T-005 + T-006) replaces with:
 *  - `articles` table rows from real RSS ingestion
 *  - `summaries` row from Claude Haiku w/ `prompt_version` log
 *  - copy-rate ≤ 15% enforced by `harness:summary-copy-rate`
 */

import type { OutletStance } from '@/lib/mock/outlets'

export interface OutletReport {
  outlet_slug: string
  outlet_name: string
  stance: OutletStance
  headline: string
  /** Minutes ago (relative to "now"), so the page can render dynamic times. */
  minutes_ago: number
  /** Path appended to outlet base_url; demo only — never fetched. */
  path: string
}

export interface ClusterDetail {
  ai_summary: string
  outlet_reports: readonly OutletReport[]
}

export const CLUSTER_DETAILS: Readonly<Record<string, ClusterDetail>> = {
  // 1. 미국 연준 5월 금리 동결 시사 — economy
  '00000000-0000-4000-8000-000000000001': {
    ai_summary:
      '미국 연방준비제도가 5월 회의에서 기준금리를 동결할 가능성이 높다는 신호를 발신했다. 연준 위원 다수가 인플레이션 둔화 속도를 더 지켜본 뒤 행동하겠다는 입장을 밝히면서, 시장은 6월 인하 가능성에 무게를 두기 시작했다. 한국은행은 이번 결정이 환율 부담을 일부 덜어준다고 평가하면서도, 미국과의 금리차에 따른 자본 이탈 위험을 지속 관찰한다고 밝혔다.',
    outlet_reports: [
      { outlet_slug: 'reuters', outlet_name: 'Reuters', stance: 'foreign', headline: 'Fed signals May pause; Asia FX firms', minutes_ago: 18, path: '/markets/fed-may-pause' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '연준 동결 신호, 환율·증시 안도 — 외국인 매수세 회복', minutes_ago: 24, path: '/article/2026050201' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '연준 동결, 한은 추가 인하 공간 넓혀 — 가계부채 부담 완화 기대', minutes_ago: 36, path: '/economy/article/202605020001' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '미 연준, 5월 동결 가능성 시사… 6월 인하 베팅 확대', minutes_ago: 42, path: '/view/AKR20260502001' },
      { outlet_slug: 'bloomberg', outlet_name: 'Bloomberg', stance: 'foreign', headline: 'Powell hints at patience; markets price July cut', minutes_ago: 51, path: '/news/articles/fed-pause' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '한국은행 “미 동결, 환율 안정에 도움… 인하 시점 신중”', minutes_ago: 64, path: '/article/202605020900001' },
    ],
  },

  // 2. 국민연금 개편안 — politics
  '00000000-0000-4000-8000-000000000002': {
    ai_summary:
      '정부 국민연금 개편안이 발표 24시간 만에 4분의 1 가입자에게 보험료율 인상이 적용되는 구조로 확인되면서 논쟁이 격화됐다. 진보 진영은 세대 간 형평성과 노후 보장을 강조한 반면, 보수 진영은 청년층 부담 가중과 자영업자 충격을 부각했다. 보건복지부는 "지속가능성을 위한 불가피한 조정"이라며 입법 절차에 착수한다고 밝혔다.',
    outlet_reports: [
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '연금 개편, 세대 간 책임 분담 첫걸음… "노후 빈곤 막을 마지노선"', minutes_ago: 22, path: '/society/article/202605020001' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '국민연금 보험료율 인상안, 형평성 논의 본격화', minutes_ago: 33, path: '/article/202605020900002' },
      { outlet_slug: 'chosun', outlet_name: '조선일보', stance: 'conservative', headline: '4분의 1 가입자 보험료 인상… 청년·자영업자 충격', minutes_ago: 41, path: '/politics/202605020001' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '연금 개편안 발표 하루 만에 시민단체·野 “재논의” 요구', minutes_ago: 55, path: '/news/Politics/article/all/202605020001' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '복지부 "연금 지속가능성 위해 불가피"… 입법 절차 착수', minutes_ago: 70, path: '/news/view.do?ncd=2026050201' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '국민연금 개편안 4분의 1 가입자 영향… 쟁점 정리', minutes_ago: 88, path: '/news/2026/05/02/A001' },
    ],
  },

  // 3. 서울시 청년 월세 지원 확대 — society
  '00000000-0000-4000-8000-000000000003': {
    ai_summary:
      '서울시가 청년 월세 지원 사업을 기존 1만 명에서 3만 명 규모로 확대하고, 지원금도 월 20만원에서 30만원으로 상향한다고 발표했다. 진보 진영은 주거권 강화 측면에서 환영하면서도 “단기 지원만으로는 부족, 공공임대 확대 병행이 필수”라고 짚었다. 보수 진영은 재정 지속가능성과 도덕적 해이를 우려하면서도 청년 주거 부담의 심각성에 공감을 표시했다.',
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

  // 4. OpenAI 신규 한국어 모델 공개 — tech_science
  '00000000-0000-4000-8000-000000000004': {
    ai_summary:
      'OpenAI가 한국어 성능을 대폭 개선한 신규 모델을 공개했다. 한국어 전용 토크나이저로 추론 비용이 30% 가량 절감되며, 한자·한글 혼용 문장 정확도가 기존 대비 1.5배 향상됐다고 발표했다. 국내 LLM 업체들은 “기술 격차가 다시 벌어졌다”는 우려와 함께 “한국어 데이터 주권 확보가 시급하다”는 목소리를 냈다.',
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

  // 5. 제주 해녀 문화 유네스코 추가 등재 추진 — culture_sports
  '00000000-0000-4000-8000-000000000005': {
    ai_summary:
      '제주도가 해녀 문화의 무형문화유산 추가 등재를 위해 유네스코에 새 신청서를 제출할 계획이라고 밝혔다. 2016년 인류무형문화유산 등재 후 8년 만의 후속 조치로, 해녀 어로 기술뿐 아니라 공동체 문화 전반을 포괄하는 형태가 될 전망이다. 표본이 작아 보도 분포 지표는 아직 형성 중이다.',
    outlet_reports: [
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '제주 해녀 문화 유네스코 추가 등재 추진… 8년 만의 후속 조치', minutes_ago: 75, path: '/view/AKR20260502003' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '해녀 공동체 문화 포함, 유네스코 신청서 새로 작성', minutes_ago: 110, path: '/news/view.do?ncd=2026050203' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '제주 해녀 문화, 어로 기술 넘어 공동체로 확장 등재', minutes_ago: 142, path: '/culture/article/202605020001' },
      { outlet_slug: 'bbc', outlet_name: 'BBC', stance: 'foreign', headline: 'Jeju “Haenyeo” divers seek expanded UNESCO heritage status', minutes_ago: 200, path: '/news/world-asia-2026' },
    ],
  },

  // 6. 삼성전자 1분기 반도체 흑자 전환 — economy
  '00000000-0000-4000-8000-000000000006': {
    ai_summary:
      '삼성전자가 1분기 반도체 부문 흑자 전환에 성공했다. HBM(고대역폭메모리)을 비롯한 AI용 메모리 수요 회복이 주효했다는 분석이다. 보수 경제지는 “위기 탈출의 분기점”으로 해석한 반면, 진보 매체는 “이익이 임금·하청 단가로 이어질지 불투명”하다는 점을 짚었다. 외신은 글로벌 메모리 사이클 회복 신호로 판독했다.',
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

  // 7. 의대 정원 증원 분쟁 6개월 합의안 — politics
  '00000000-0000-4000-8000-000000000007': {
    ai_summary:
      '6개월 가까이 이어진 의대 정원 증원 분쟁이 합의안 도출로 봉합 국면에 들어섰다. 정부와 의료계는 단계적 증원·필수의료 보상 확대·전공의 처우 개선 등 5개 항목에 합의한 것으로 알려졌다. 진보 진영은 “환자 공백 해소가 시급”이라며 합의를 환영했고, 보수 진영은 “원칙 후퇴”라는 비판과 “현실 인정”이라는 안도가 갈렸다.',
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

  // 8. 카카오 신규 AI 비서 베타 공개 — tech_science
  '00000000-0000-4000-8000-000000000008': {
    ai_summary:
      '카카오가 자체 LLM 기반 AI 비서를 베타로 공개했다. 카카오톡 메신저 안에서 음성·텍스트 모두 호출 가능하고, 일정·결제·지도 등 카카오 서비스 내 작업을 자동 처리한다. 외신은 “라인업 차원에서는 후발이지만, 사용자 락인 효과는 강력할 것”이라고 평가했고, 국내 매체는 개인정보 처리·요금제·매크로 활용 가능성을 놓고 다양한 각도에서 다뤘다.',
    outlet_reports: [
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '카카오 AI 비서 베타 — 메신저·결제·지도 통합 자동화', minutes_ago: 16, path: '/article/2026050203' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '카카오 AI 비서 사용기 — 일정 잡기, 송금 모두 한 번에', minutes_ago: 25, path: '/article/2026050203' },
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: '카카오 AI 비서, 음성·텍스트 모두 — 베타 신청 5만 명 돌파', minutes_ago: 38, path: '/news/endPage.do?news_id=N1007345678' },
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '카카오 AI 비서, 개인정보 처리 범위는 어디까지', minutes_ago: 52, path: '/economy/it/article/202605020002' },
      { outlet_slug: 'bloomberg', outlet_name: 'Bloomberg', stance: 'foreign', headline: 'Kakao’s AI assistant aims to lock in Korea’s 50M users', minutes_ago: 72, path: '/news/articles/kakao-ai-assistant' },
    ],
  },

  // 9. 북한 단거리 미사일 동해 발사 — international
  '00000000-0000-4000-8000-000000000009': {
    ai_summary:
      '북한이 동해상으로 단거리 탄도미사일 2발을 발사했다. 합동참모본부는 발사 직후 분석에 착수했으며, 한미 공조 대응을 발표했다. 보수 매체는 “국방 태세 점검 시급”을 부각, 진보 매체는 “긴장 완화 채널 복원이 동시에 필요”함을 짚었다. 외신은 한반도 안보 환경 변화 신호로 보도하며 추가 도발 가능성을 분석했다.',
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

  // 10. 현대차 신형 전기차 사전예약 첫날 흥행 — economy
  '00000000-0000-4000-8000-000000000010': {
    ai_summary:
      '현대차가 공개한 신형 전기차의 사전예약이 첫날에만 4만 대를 돌파하며 흥행몰이를 했다. 보조금 적용 시 4천만원 초반대로 책정된 가격과 600km 주행거리가 핵심 요인으로 분석된다. 외신은 "한국 전기차의 가격 경쟁력 회복" 신호로 평가했고, 국내 매체는 충전 인프라·중고차 가격·국내 부품사 수혜 등을 다각도로 다뤘다.',
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

  // 11. 봄철 미세먼지 농도 30% 증가 — society
  '00000000-0000-4000-8000-000000000011': {
    ai_summary:
      '환경부 발표에 따르면 4월 평균 초미세먼지(PM2.5) 농도가 평년 대비 30% 높아졌다. 중국발 황사·국내 산불·기상 정체가 동시에 작용한 결과로 분석된다. 보건당국은 어린이·고령자 외출 자제를 권고했고, 매체별로 마스크 가이드, 학교 대응, 자동차 운행 제한 등 실용 정보가 폭넓게 다뤄졌다.',
    outlet_reports: [
      { outlet_slug: 'hani', outlet_name: '한겨레', stance: 'progressive', headline: '4월 PM2.5 30% ↑ — 산불·황사·기상 정체 삼중고', minutes_ago: 23, path: '/society/article/202605020003' },
      { outlet_slug: 'kbs', outlet_name: 'KBS', stance: 'mixed', headline: '봄철 미세먼지 평년 대비 30% 증가 — 외출 자제 권고', minutes_ago: 31, path: '/news/view.do?ncd=2026050206' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '미세먼지 마스크 어떻게 골라야 하나 — 실용 가이드', minutes_ago: 44, path: '/news/2026/05/02/A003' },
      { outlet_slug: 'donga', outlet_name: '동아일보', stance: 'conservative', headline: '학교 야외수업 잇따라 취소 — 학부모 불안 가중', minutes_ago: 58, path: '/news/Society/article/all/202605020003' },
      { outlet_slug: 'hankook', outlet_name: '한국일보', stance: 'mixed', headline: '미세먼지 비상저감조치 — 자동차 운행 제한 시행', minutes_ago: 75, path: '/News/Read/A2026050202' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '대기질 악화 장기화 우려 — 정책 대응 어디까지 왔나', minutes_ago: 95, path: '/article/202605020900006' },
    ],
  },

  // 12. 쿠팡 새벽배송 권역 9개 도시 확대 — economy
  '00000000-0000-4000-8000-000000000012': {
    ai_summary:
      '쿠팡이 새벽배송 권역을 전국 9개 도시로 확대한다고 발표했다. 신규 권역은 광주·대전·울산·청주 등 비수도권 거점 도시를 포함한다. 보수 경제지는 “물류 인프라 투자가 지방 소비를 견인할 것”으로 봤고, 진보 매체는 “플랫폼 노동 환경 개선이 병행되어야”함을 강조했다. 표본이 적어 분포 지표는 형성 중이다.',
    outlet_reports: [
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: '쿠팡 새벽배송 9개 도시 확대 — 비수도권 본격 진출', minutes_ago: 21, path: '/article/2026050205' },
      { outlet_slug: 'hankyung', outlet_name: '한국경제', stance: 'conservative', headline: '광주·대전·울산 등 — 쿠팡 풀필먼트 신축 잇따라', minutes_ago: 33, path: '/article/2026050205' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '새벽배송 확대 환영 — “플랫폼 노동 환경 개선 병행 필요”', minutes_ago: 47, path: '/article/202605020900007' },
      { outlet_slug: 'mediatoday', outlet_name: '미디어오늘', stance: 'progressive', headline: '쿠팡 야간 노동 실태, 9개 도시 확장에 묻혀선 안 된다', minutes_ago: 70, path: '/news/articleView.html?idxno=2026050201' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: '쿠팡 새벽배송 권역 확대 발표 — 적용 시점·요건 정리', minutes_ago: 88, path: '/view/AKR20260502006' },
    ],
  },

  // 13. 한국 영화 칸 영화제 진출 — culture_sports
  '00000000-0000-4000-8000-000000000013': {
    ai_summary:
      '한국 영화 두 편이 올해 칸 영화제 경쟁 부문에 진출했다고 영화진흥위원회가 공식 발표했다. 한 편은 신예 감독의 실험적 드라마, 다른 한 편은 베테랑 감독의 사회 비판 작품으로 알려졌다. 외신은 "한국 영화의 다양성이 다시 주목받는다"고 평가했고, 국내 매체는 산업 전반의 위기 속에서 나온 성과의 의미를 짚었다.',
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

  // 14. KBO 흥행 5년 만에 최다 관중 경신 — culture_sports
  '00000000-0000-4000-8000-000000000014': {
    ai_summary:
      'KBO 리그 누적 관중이 5년 만에 시즌 최다를 경신했다. 올해 신생 강호의 등장과 트레이드 시즌의 변동성, 신축 구장 효과가 복합적으로 작용했다는 분석이다. 보수 매체는 KBO의 마케팅 전략 성공을, 진보 매체는 지방 구단 균형 발전 측면을 부각했다.',
    outlet_reports: [
      { outlet_slug: 'sbs', outlet_name: 'SBS', stance: 'mixed', headline: 'KBO 누적 관중 5년 만에 최다 — 신축 구장 효과', minutes_ago: 19, path: '/news/endPage.do?news_id=N1007567890' },
      { outlet_slug: 'mbc', outlet_name: 'MBC', stance: 'mixed', headline: '올해 KBO, 무엇이 다른가 — 흥행 요인 분석', minutes_ago: 30, path: '/news/2026/05/02/A004' },
      { outlet_slug: 'mt', outlet_name: '머니투데이', stance: 'conservative', headline: 'KBO 마케팅 전략 통했다 — 입장권 매출도 사상 최대', minutes_ago: 44, path: '/article/2026050206' },
      { outlet_slug: 'kyunghyang', outlet_name: '경향신문', stance: 'progressive', headline: '지방 구단 흥행 — 지역 경제 균형에도 보탬', minutes_ago: 60, path: '/article/202605020900008' },
      { outlet_slug: 'yonhap', outlet_name: '연합뉴스', stance: 'mixed', headline: 'KBO 시즌 누적 관중 통계 — 5년 만에 신기록', minutes_ago: 78, path: '/view/AKR20260502008' },
    ],
  },

  // 15. 동해 심해 가스전 시추 결과 — economy (insufficient_sample)
  '00000000-0000-4000-8000-000000000015': {
    ai_summary:
      '한국석유공사가 동해 심해 가스전 시추 결과를 공식 발표했다. 초기 결과는 상업화 가능성을 가늠하기에는 표본이 작아 추가 분석이 필요하다고 밝혔다. 일부 매체가 다뤘으나 전체 보도 분포가 형성되기에는 시간이 더 필요하다.',
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
