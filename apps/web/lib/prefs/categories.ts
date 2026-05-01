/**
 * Category preference scaffold (v1.6.2 patch — C-5).
 *
 * Stores per-category weights (0..1.5) in localStorage so the user can
 * tilt the rising-issues ranking toward their interests.
 *
 * P0w scope: storage layer + React hook only. NO UI surface — settings
 * page lands in T-W04+ or V0.5 (PRD v1.6.2 §C-6).
 *
 * Weighting algorithm (V0.5):
 *   adjusted_score = base_score × prefs[category] (clamped 0.5..1.5)
 *
 * Storage is per-browser; no server sync until B2C Pro account system
 * (P0b T-B01 + P0a auth).
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { z } from 'zod'
import { CategorySchema, type Category } from '@/lib/api/widget-schemas'

export const STORAGE_KEY = 'tteuniyu:prefs:categories:v1'

export const CategoryWeightsSchema = z.record(CategorySchema, z.number().min(0).max(1.5))
export type CategoryWeights = z.infer<typeof CategoryWeightsSchema>

export const DEFAULT_WEIGHTS: CategoryWeights = {
  politics: 1,
  society: 1,
  economy: 1,
  international: 1,
  tech_science: 1,
  culture_sports: 1,
  lifestyle: 1,
}

function safeReadStorage(): CategoryWeights {
  if (typeof window === 'undefined') return DEFAULT_WEIGHTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WEIGHTS
    const parsed = CategoryWeightsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return DEFAULT_WEIGHTS
    // Merge — unknown user overrides win, missing keys fall back to defaults.
    return { ...DEFAULT_WEIGHTS, ...parsed.data }
  } catch {
    return DEFAULT_WEIGHTS
  }
}

function safeWriteStorage(weights: CategoryWeights): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weights))
  } catch {
    // Quota exceeded / private mode — silently no-op. Pref is convenience, not critical state.
  }
}

/**
 * SSR-safe read. Returns DEFAULT_WEIGHTS during server render and during
 * the first client paint (hydration), then upgrades to the stored weights
 * on the next tick to avoid mismatches.
 */
export function useCategoryPrefs(): {
  weights: CategoryWeights
  setWeight: (category: Category, value: number) => void
  reset: () => void
} {
  const [weights, setWeights] = useState<CategoryWeights>(DEFAULT_WEIGHTS)

  useEffect(() => {
    setWeights(safeReadStorage())
  }, [])

  const setWeight = useCallback((category: Category, value: number) => {
    const clamped = Math.max(0, Math.min(1.5, value))
    setWeights((prev) => {
      const next = { ...prev, [category]: clamped }
      safeWriteStorage(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS)
    safeWriteStorage(DEFAULT_WEIGHTS)
  }, [])

  return { weights, setWeight, reset }
}

/**
 * Pure helper exposed for V0.5 ranking — multiplies a base score by the
 * user's category weight, clamped to [0.5, 1.5] so a single preference
 * cannot make an issue invisible nor dominate the feed.
 *
 * @example
 *   const adjusted = applyCategoryWeight(score, 'economy', weights)
 */
export function applyCategoryWeight(
  baseScore: number,
  category: Category | undefined,
  weights: CategoryWeights,
): number {
  if (!category) return baseScore
  const w = weights[category] ?? 1
  const clamped = Math.max(0.5, Math.min(1.5, w))
  return baseScore * clamped
}
