// 외신 소스 판별 — 외신 단독 클러스터를 메인 실시간 이슈 순위에서 제외하기 위함
//
// PRD §6 Data Source Strategy — 외신은 한국 이슈의 "외신 비교" 축이지
// 1차 순위 요소가 아니다. 외신 매체만으로 구성된 클러스터(예: 영어권 단독
// 이슈)는 widget 순위에 노출하지 않는다.
//
// FOREIGN_SOURCE_SLUGS는 config/sources_whitelist.yaml의 '외신 6개 (Tier-1)'
// 블록과 반드시 동기화한다. 외신 소스 추가 시 이 set도 갱신.

export const FOREIGN_SOURCE_SLUGS: ReadonlySet<string> = new Set([
  'reuters',
  'ap',
  'bbc',
  'nyt',
  'bloomberg',
  'nikkei',
])

/** 주어진 source slug가 외신이면 true. */
export function isForeignSource(slug: string): boolean {
  return FOREIGN_SOURCE_SLUGS.has(slug)
}

/**
 * 클러스터가 국내 매체 기사를 1건이라도 포함하면 true.
 * 외신 매체만으로 구성된 클러스터(외신 단독)면 false → 메인 순위에서 제외.
 */
export function hasDomesticCoverage(sourceSlugs: readonly string[]): boolean {
  return sourceSlugs.some((slug) => !FOREIGN_SOURCE_SLUGS.has(slug))
}
