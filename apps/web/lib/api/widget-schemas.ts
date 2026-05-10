/**
 * Widget API contract — PRD v1.6 §8.2
 *
 * Single source of truth for `/api/v1/widget/top` request/response shapes.
 * Validated at the API route boundary BEFORE return (CLAUDE.md rule 11).
 */

import { z } from 'zod'

export const SampleQualitySchema = z.enum([
  'insufficient_sample',
  'low_confidence',
  'sufficient',
])
export type SampleQuality = z.infer<typeof SampleQualitySchema>

/**
 * Cluster category (v1.6.2 patch).
 *
 * Politics / society are split — coverage distribution (진보/중도/보수) is
 * meaningful only for these two categories. Other categories ship the same
 * coverage data through the API but the UI suppresses the bar (different
 * visualization candidates land in V0.5).
 */
export const CategorySchema = z.enum([
  'politics',
  'society',
  'economy',
  'international',
  'tech_science',
  'culture_sports',
  'lifestyle',
])
export type Category = z.infer<typeof CategorySchema>

/** Categories where the 4-color Coverage Bar is rendered in /cluster/[id]. */
export const COVERAGE_RELEVANT_CATEGORIES: readonly Category[] = [
  'politics',
  'society',
] as const

export function isCoverageRelevant(category: Category | undefined): boolean {
  if (!category) return false
  return (COVERAGE_RELEVANT_CATEGORIES as readonly Category[]).includes(category)
}

export const CoverageCountsSchema = z.object({
  progressive: z.number().int().nonnegative(),
  mixed: z.number().int().nonnegative(),
  conservative: z.number().int().nonnegative(),
  foreign: z.number().int().nonnegative(),
})
export type CoverageCounts = z.infer<typeof CoverageCountsSchema>

/**
 * Affiliate slot is reserved by the v1.6 widget contract but only populated
 * starting in T-W04 (manual curation). T-W01 always returns `undefined`.
 */
export const AffiliateSlotSchema = z.object({
  enabled: z.boolean(),
  partner: z.enum(['coupang', '11st', 'amazon']).optional(),
  product_title: z.string().max(100).optional(),
  affiliate_url: z.string().url().optional(),
  valid_until: z.string().optional(),
  label: z.enum(['Sponsored', 'Related']).optional(),
})
export type AffiliateSlot = z.infer<typeof AffiliateSlotSchema>

/**
 * Trust Tag enum (v1.7.1 ADR-015 + v1.7.2 Amendment 2 변호사 권고).
 *
 * Internal field 4종 — 컴포넌트는 이 값으로 분기. UI 표시 라벨은
 * `apps/web/components/TrustTag.tsx`의 TRUST_TAG_CONFIG에 매핑.
 *
 *   hoax           → "검증 필요" (red-600)
 *   clickbait      → "제목-본문 괴리 가능성" (red-600)
 *   low_confidence → "표본 부족" (amber-500)
 *   investment     → "기업 관련 이슈" (🏢 amber-500)
 *
 * harness:trust-tag-presence가 schema 보존 여부 검증.
 */
export const TrustTagSchema = z.enum([
  'hoax',
  'clickbait',
  'low_confidence',
  'investment',
])
export type TrustTag = z.infer<typeof TrustTagSchema>

const ClusterCore = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  updated_at: z.string(),
  ad_allowed: z.boolean(),
  affiliate_slot: AffiliateSlotSchema.optional(),
  // v1.6.2 patch — optional 1차 (forward-compatible). Required by P0a.
  category: CategorySchema.optional(),
  /** Previous-minute rank for trend arrow. null = new entry to top N. */
  previous_rank: z.number().int().min(1).max(50).nullable().optional(),
  /**
   * v1.7.1+v1.7.2 — 클러스터 단위 Trust Tag (개별 매체 평가 X, ADR-015 Amendment 2).
   * 다중 부여 가능하나 UI는 우선순위 1개만 표시 (pickTrustTag 참조).
   * P0w mock — 일부 클러스터에 임의 부여. P0a — LLM 워커에서 실 평가.
   */
  trust_tags: z.array(TrustTagSchema).default([]),
  /**
   * 보도한 매체 수 (총합) — Concept C 카드에 "N개 매체" 텍스트로 표시 (Trust Tag 미부여 시).
   * Optional + default 0으로 backward-compat 유지.
   */
  outlets_count: z.number().int().nonnegative().default(0),
})

/** A single cluster card returned in any size. */
export const WidgetClusterSchema = ClusterCore
export type WidgetCluster = z.infer<typeof WidgetClusterSchema>

/** size=small → single cluster (Lock Screen / 2x2 widget shape). */
export const WidgetSmallResponseSchema = ClusterCore
export type WidgetSmallResponse = z.infer<typeof WidgetSmallResponseSchema>

/** size=medium → 3 clusters (4x2 widget shape). */
export const WidgetMediumResponseSchema = z.object({
  clusters: z.array(WidgetClusterSchema).length(3),
  updated_at: z.string(),
})
export type WidgetMediumResponse = z.infer<typeof WidgetMediumResponseSchema>

/**
 * size=large → 20 clusters (Top 1~20) + methodology version + diversity index.
 *
 * v1.6.1 patch — capacity 5 → 10.
 * v1.7.2 patch — capacity 10 → 20. Rationale (Claude Design Concept C, 2026-05-10) —
 *   디자인 협의에서 사용자가 "20위까지 + AdZone 6/7·12/13·16/17 사이에"를 요청.
 *   카드 높이 ~58~64px 압축 + 3 AdZone 합쳐도 한 화면 스크롤 적정 (≤ 1500px).
 *
 * Backward compat — `min(10).max(20)` 대신 `length(20)` 강제. P0a 워커에서
 * 정확히 20건 보장 가능 (RSS 30매체 → 클러스터링 결과 20건 cap).
 */
export const WidgetLargeResponseSchema = z.object({
  clusters: z.array(WidgetClusterSchema).length(20),
  methodology_version: z.string(),
  overall_diversity_index: z.number().min(0).max(1).nullable(),
  updated_at: z.string(),
})
export type WidgetLargeResponse = z.infer<typeof WidgetLargeResponseSchema>

export const WidgetSizeSchema = z.enum(['small', 'medium', 'large'])
export type WidgetSize = z.infer<typeof WidgetSizeSchema>

/**
 * Sensitive fields that MUST NOT appear in any public API payload
 * (CLAUDE.md rule 4 — see also harness:no-public-sensitive-fields and
 * harness:widget-contract).
 *
 * Exported as `as const` so the harness can reuse the same list.
 */
export const FORBIDDEN_PUBLIC_FIELDS = [
  'bias_score',
  'factuality_score',
  'embedding',
  'embedding_provider',
  'embedding_model',
  'source_score_evidence',
  'axis_b_chaebol',
  'axis_c_regime_critic',
  'axis_d_sensationalism',
] as const
