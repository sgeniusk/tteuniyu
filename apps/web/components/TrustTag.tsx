/**
 * TrustTag — 변호사 권고 라벨 (ADR-015 Amendment 2 + PRD v1.7.2)
 *
 * 내부 field (hoax/clickbait/low_confidence/investment) 4종은 schema에 그대로 유지.
 * 사용자 노출 라벨은 변호사 의견서 (2026-05-10 §2.1, line 226-230) 권고에 따라
 * 다음과 같이 매핑.
 *
 *   hoax           → "검증 필요"              (red-600)
 *   clickbait      → "제목-본문 괴리 가능성"  (red-600)
 *   low_confidence → "표본 부족"              (amber-500)
 *   investment     → "기업 관련 이슈" (🏢)    (amber-500)
 *
 * 우선순위: hoax > clickbait > low_confidence > investment (한 카드에 1개만).
 *
 * Tooltip 표준 — "이 표시는 개별 매체 평가가 아니라 수집된 보도 묶음에 대한
 *                자동 분석 신호입니다."
 *
 * 절대 금지 (CLAUDE.md 비협상 15조).
 *  - <AdZone> 안에 렌더 X (P12 격리, ADR-005)
 *  - 변호사 권고 외 라벨 사용 X (예 "검증되지 않은 정보" 등 v1.7.1 표현 폐기)
 */

import type { TrustTag as TrustTagKind } from '@/lib/api/widget-schemas'

interface TrustTagProps {
  tag: TrustTagKind
  /** Compact mode for mobile widget (V0.5+) — only badge, no tooltip text. */
  compact?: boolean
}

interface TrustTagConfig {
  /** UI label shown to user — 변호사 권고 매핑 (ADR-015 Amendment 2). */
  label: string
  /** Optional emoji prefix. */
  prefix: string
  /** Tailwind background class. */
  bgClass: string
  /** Tailwind border class. */
  borderClass: string
  /** Tailwind text class. */
  textClass: string
  /** Whether headline color should follow this tag (red-600 for hoax/clickbait). */
  affectsHeadline: boolean
}

export const TRUST_TAG_CONFIG: Record<TrustTagKind, TrustTagConfig> = {
  hoax: {
    label: '검증 필요',
    prefix: '⚠',
    bgClass: 'bg-red-600/10',
    borderClass: 'border-red-600/40',
    textClass: 'text-red-300',
    affectsHeadline: true,
  },
  clickbait: {
    label: '제목-본문 괴리 가능성',
    prefix: '⚠',
    bgClass: 'bg-red-600/10',
    borderClass: 'border-red-600/40',
    textClass: 'text-red-300',
    affectsHeadline: true,
  },
  low_confidence: {
    label: '표본 부족',
    prefix: '⚠',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-200',
    affectsHeadline: false,
  },
  investment: {
    label: '기업 관련 이슈',
    prefix: '🏢',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-200',
    affectsHeadline: false,
  },
}

const TOOLTIP =
  '이 표시는 개별 매체 평가가 아니라 수집된 보도 묶음에 대한 자동 분석 신호입니다.'

export function TrustTag({ tag, compact = false }: TrustTagProps) {
  const c = TRUST_TAG_CONFIG[tag]
  if (!c) return null

  return (
    <span
      title={TOOLTIP}
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-[10px] font-semibold leading-tight whitespace-nowrap ${c.bgClass} ${c.borderClass} ${c.textClass}`}
    >
      <span aria-hidden="true">{c.prefix}</span>
      {!compact && <span>{c.label}</span>}
    </span>
  )
}

/**
 * 우선순위 — 한 카드에 여러 trust_tag가 있어도 하나만 표시.
 * hoax > clickbait > low_confidence > investment.
 */
export function pickTrustTag(tags: readonly TrustTagKind[]): TrustTagKind | null {
  if (tags.includes('hoax')) return 'hoax'
  if (tags.includes('clickbait')) return 'clickbait'
  if (tags.includes('low_confidence')) return 'low_confidence'
  if (tags.includes('investment')) return 'investment'
  return null
}

/**
 * 헤드라인 텍스트 색상 클래스 — Trust Tag에 따라 결정.
 * hoax/clickbait → red-300 (다크 배경 위 가독성), 그 외 → 기본 (slate-50).
 */
export function headlineColorClass(tag: TrustTagKind | null): string {
  if (!tag) return 'text-slate-50'
  return TRUST_TAG_CONFIG[tag].affectsHeadline ? 'text-red-300' : 'text-slate-50'
}
