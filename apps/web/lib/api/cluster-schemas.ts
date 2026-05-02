/**
 * Cluster detail API contract — v1.6.3 patch (PRD §8 extension).
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

/**
 * Structured AI analysis (v1.6.4 patch).
 *
 * Replaces the v1.6.3 single `ai_summary` field. Three-section split
 * lets the detail page show:
 *   1) "🪪 정체"  — what/who is this (optional, only when subject is named)
 *   2) "🚀 왜 지금 떴는가" — trigger event
 *   3) "📰 매체는 어떻게 다뤘나" — coverage facts + stance differences
 *
 * P0a (T-005) Claude Haiku prompt enforces the same JSON shape.
 * Copy-ratio harness applies to `coverage_summary` only.
 */
export const AiAnalysisSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  why_trending: z.string().min(1).max(500),
  coverage_summary: z.string().min(1).max(800),
})
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>

export const ClusterDetailResponseSchema = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  category: CategorySchema,
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  ai_analysis: AiAnalysisSchema,
  outlets: z.array(OutletReportSchema).min(1).max(20),
  methodology_version: z.string(),
  updated_at: z.string(),
})
export type ClusterDetailResponse = z.infer<typeof ClusterDetailResponseSchema>
