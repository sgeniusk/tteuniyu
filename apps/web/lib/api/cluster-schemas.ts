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

export const ClusterDetailResponseSchema = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  category: CategorySchema,
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  ai_summary: z.string().min(1).max(800),
  outlets: z.array(OutletReportSchema).min(1).max(20),
  methodology_version: z.string(),
  updated_at: z.string(),
})
export type ClusterDetailResponse = z.infer<typeof ClusterDetailResponseSchema>
