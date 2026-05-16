/**
 * Cluster detail API contract — v1.6.5 patch (PRD §8 extension).
 *
 * Single source of truth for `/api/v1/clusters/[id]`. Validated at the
 * route boundary BEFORE return (CLAUDE.md rule 11).
 *
 * Constraints (CLAUDE.md):
 * - rule 4: NEVER include bias_score / factuality_score / embedding /
 *   per-outlet score raw fields — only aggregate `coverage` counts.
 * - rule 12 (P12): this endpoint represents Coverage Distribution data;
 *   it MUST NOT carry `affiliate_slot` / `ad_allowed` (those live on
 *   the widget endpoint only). harness:ad-zone-boundary will verify.
 *
 * Versioning:
 *   v1.6.3 — initial detail schema with single `ai_summary`
 *   v1.6.4 — split into `ai_analysis` { subject?, why_trending, coverage_summary }
 *   v1.6.5 — `ai_analysis.deep` { entity_card, trend } + `youtube_news`
 *            and card reorder (📺 → 🚀 → 📰 → 🧠).
 */

import { z } from 'zod'
import {
  CategorySchema,
  CoverageCountsSchema,
  SampleQualitySchema,
} from '@/lib/api/widget-schemas'

export const OutletStanceSchema = z.enum([
  'progressive',
  'mixed',
  'conservative',
  'foreign',
])
export type OutletStance = z.infer<typeof OutletStanceSchema>

export const OutletReportSchema = z.object({
  outlet_slug: z.string().min(1).max(40),
  outlet_name: z.string().min(1).max(40),
  stance: OutletStanceSchema,
  headline: z.string().min(1).max(120),
  published_at: z.string(),
  outlet_url: z.string().url(),
})
export type OutletReport = z.infer<typeof OutletReportSchema>

// --- v1.6.5: entity_card (도메인-특화 fact) ---

export const DomainFactSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(120),
  /** Public source attribution (e.g., "Bloomberg 2024-10", "공시"). */
  source: z.string().min(1).max(80).optional(),
})
export type DomainFact = z.infer<typeof DomainFactSchema>

export const EntityCardSchema = z.object({
  definition: z.string().min(1).max(300),
  domain_facts: z.array(DomainFactSchema).max(8),
})
export type EntityCard = z.infer<typeof EntityCardSchema>

// --- v1.6.5: trend (4-window time series) ---

export const TrendBucketSchema = z.object({
  /** ISO timestamp marking bucket start. */
  t: z.string(),
  /** Normalized 0..100 (per ADR-008 — never raw query counts). */
  v: z.number().min(0).max(100),
})
export type TrendBucket = z.infer<typeof TrendBucketSchema>

export const TrendWindowSchema = z.object({
  window: z.enum(['7d', '30d', '6m', '1y']),
  buckets: z.array(TrendBucketSchema).min(2).max(200),
  source: z.string().min(1).max(40),
  computed_at: z.string(),
})
export type TrendWindow = z.infer<typeof TrendWindowSchema>

export const TrendAnalysisSchema = z.object({
  windows: z.array(TrendWindowSchema).min(1).max(4),
  /** True when served from keyword_trends DB (P0a+); false for live mock. */
  cached: z.boolean(),
})
export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>

// --- v1.6.5: YouTube news embed (Lite pattern) ---

export const YouTubeNewsSchema = z.object({
  /** YouTube 11-character video id (placeholder accepted in P0w). */
  video_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string().min(1).max(120),
  channel: z.string().min(1).max(40),
  /** Optional stance signal — kept off the page until ADR-009 lands. */
  channel_stance: OutletStanceSchema.optional(),
})
export type YouTubeNews = z.infer<typeof YouTubeNewsSchema>

// --- v1.6.5: ai_analysis with `deep` extension ---

/**
 * Structured AI analysis (v1.6.5 expansion).
 *
 *   1) "🚀 왜 지금 떴는가" — trigger event (top, teal accent)
 *   2) "📰 매체는 어떻게 다뤘나" — coverage facts + stance differences
 *   3) "🧠 AI 정밀 분석" — { entity_card, trend } (bottom, expanded)
 *
 * v1.6.4 had a top-level `subject` string; v1.6.5 moves identity content
 * into `deep.entity_card` so the page can colocate definition + facts +
 * trend within a single deep-analysis card.
 *
 * P0a (T-005) Claude Haiku prompt enforces the same JSON shape.
 * `harness:summary-copy-rate` applies to `coverage_summary` only.
 */
export const AiAnalysisSchema = z.object({
  why_trending: z.string().min(1).max(500),
  coverage_summary: z.string().min(1).max(800),
  deep: z
    .object({
      entity_card: EntityCardSchema.optional(),
      trend: TrendAnalysisSchema.optional(),
    })
    .optional(),
})
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>

export const ClusterDetailResponseSchema = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  // category는 optional — cluster-pending 워커가 만든 cluster는 LLM 카테고리
  // 분류 전이라 NULL. widget의 WidgetClusterSchema도 category.optional()이라
  // 두 schema 일관성 유지. UI는 category 미존재 시 Coverage Bar 등 숨김.
  category: CategorySchema.optional(),
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  ai_analysis: AiAnalysisSchema,
  /** v1.6.5: optional YouTube news anchor above the analysis cards. */
  youtube_news: YouTubeNewsSchema.optional(),
  outlets: z.array(OutletReportSchema).min(1).max(20),
  methodology_version: z.string(),
  updated_at: z.string(),
})
export type ClusterDetailResponse = z.infer<typeof ClusterDetailResponseSchema>
