/**
 * Waitlist / inquiry input schemas — T-W03 (PRD v1.6 §7.1 F-P0w-4/5/6).
 *
 * Validated at every /api/v1/waitlist/* route boundary BEFORE write
 * (CLAUDE.md rule 11). No PII beyond email + contact name.
 */

import { z } from 'zod'

export const WaitlistTypeSchema = z.enum(['pro_preorder', 'creator_embed', 'b2b_inquiry'])
export type WaitlistType = z.infer<typeof WaitlistTypeSchema>

// --- Pro Preorder (B2C, 5-point intent) ---
export const PriceFeedbackSchema = z.enum(['too_cheap', 'fair', 'too_expensive'])
export type PriceFeedback = z.infer<typeof PriceFeedbackSchema>

export const ProPreorderInputSchema = z.object({
  email: z.string().email().max(254),
  intent_score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  price_feedback: PriceFeedbackSchema.optional(),
})
export type ProPreorderInput = z.infer<typeof ProPreorderInputSchema>

// --- Creator Embed Waitlist ---
export const MonthlyVisitorsSchema = z.enum(['<1k', '1k-10k', '10k-100k', '>100k'])
export type MonthlyVisitors = z.infer<typeof MonthlyVisitorsSchema>

export const CreatorEmbedInputSchema = z.object({
  email: z.string().email().max(254),
  site_url: z.string().url().max(500),
  monthly_visitors: MonthlyVisitorsSchema,
  topic_interest: z.string().min(1).max(200),
  willingness_to_pay: z.number().int().min(0).max(100_000).optional(),
})
export type CreatorEmbedInput = z.infer<typeof CreatorEmbedInputSchema>

// --- B2B / API Inquiry ---
export const CompanySizeSchema = z.enum(['<10', '10-50', '50-200', '200-1000', '>1000'])
export type CompanySize = z.infer<typeof CompanySizeSchema>

export const UseCaseSchema = z.enum(['monitoring', 'api_integration', 'research', 'other'])
export type UseCase = z.infer<typeof UseCaseSchema>

export const B2BInquiryInputSchema = z.object({
  email: z.string().email().max(254),
  company_name: z.string().min(1).max(100),
  contact_name: z.string().min(1).max(50),
  company_size: CompanySizeSchema,
  use_case: UseCaseSchema,
  message: z.string().min(1).max(1000),
})
export type B2BInquiryInput = z.infer<typeof B2BInquiryInputSchema>

/**
 * Generic response — never leaks whether the email already existed
 * (privacy: enumeration-safe, see Codex Task B in T-W03).
 */
export const WaitlistResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
})
export type WaitlistResponse = z.infer<typeof WaitlistResponseSchema>
