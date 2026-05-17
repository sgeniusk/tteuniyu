// cluster 소속 기사 발행 시각 → 자체 집계 추이 (ADR-008 self source)
//
// ADR-008은 외부 소스(DataLab/GTrends/BIGKinds) + 사전 적재 워커를 명세하나,
// M1 단계는 self source만 — articles.published_at을 런타임 버킷팅. 비용 0, 외부
// API 의존 0. 외부 소스 blending은 keyword_trends 테이블 + 워커로 후속 확장.

import type { TrendAnalysis, TrendWindow } from '@/lib/api/cluster-schemas'

const DAY_MS = 86_400_000

/**
 * cluster에 묶인 기사들의 published_at → 최근 7일 일별 추이.
 *
 * 값은 ADR-008 원칙대로 raw count가 아닌 0~100 normalized.
 * 데이터가 7일 미만이면 빈 버킷은 0 — 시간이 지나며 자연히 채워짐.
 */
export function buildSelfTrend(
  publishedAts: string[],
  now: Date = new Date(),
): TrendAnalysis {
  // 오늘 자정 포함 최근 7일 일 버킷 (과거 → 현재 순)
  const buckets: { t: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    buckets.push({ t: dayStart.toISOString(), count: 0 })
  }

  const firstBucket = buckets[0]
  if (!firstBucket) {
    // 도달 불가 (buckets는 항상 7개) — 타입 안전용.
    return { windows: [], cached: false }
  }
  const firstMs = new Date(firstBucket.t).getTime()

  for (const iso of publishedAts) {
    const ts = new Date(iso).getTime()
    if (Number.isNaN(ts)) continue
    const dayIdx = Math.floor((ts - firstMs) / DAY_MS)
    if (dayIdx >= 0 && dayIdx < buckets.length) {
      const b = buckets[dayIdx]
      if (b) b.count += 1
    }
  }

  const maxCount = Math.max(1, ...buckets.map((b) => b.count))
  const window: TrendWindow = {
    window: '7d',
    buckets: buckets.map((b) => ({
      t: b.t,
      v: Math.round((b.count / maxCount) * 100),
    })),
    source: 'self',
    computed_at: now.toISOString(),
  }

  // cached=true — keyword_trends 테이블은 아니나 DB articles 기반 실데이터.
  // (mock generateTrend과 구분하는 신호.)
  return { windows: [window], cached: true }
}
