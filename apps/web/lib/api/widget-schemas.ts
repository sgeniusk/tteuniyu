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

const ClusterCore = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  updated_at: z.string(),
  ad_allowed: z.boolean(),
  affiliate_slot: AffiliateSlotSchema.optional(),
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

/** size=large → 5 clusters + methodology version + diversity index. */
export const WidgetLargeResponseSchema = z.object({
  clusters: z.array(WidgetClusterSchema).length(5),
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
