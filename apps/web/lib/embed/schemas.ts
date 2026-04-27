/**
 * Embed install endpoint schemas.
 *
 * Validated at /api/v1/embed/install boundary (CLAUDE.md rule 11 — Zod).
 * Host strings are NOT PII; user_agent is opaque. No cookies, no IPs stored.
 */

import { z } from 'zod'

export const EmbedSizeSchema = z.enum(['small', 'medium', 'large'])
export type EmbedSize = z.infer<typeof EmbedSizeSchema>

export const EmbedInstallInputSchema = z.object({
  host: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-zA-Z0-9.\-:]+$/, 'host must be domain-shaped'),
  size: EmbedSizeSchema,
  user_agent: z.string().max(255).optional().default(''),
})

export type EmbedInstallInput = z.infer<typeof EmbedInstallInputSchema>
