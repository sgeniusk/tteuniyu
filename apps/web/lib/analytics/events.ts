/**
 * Analytics event registry — single source of truth for PostHog event names.
 *
 * P0w: console.log stub (PostHog SDK not yet wired). T-W05 swaps the body
 * of `track()` for `posthog.capture()` without renaming any event.
 *
 * Adding a new event:
 *   1. Add constant here.
 *   2. Use `track(EVENTS.X, { ... })` from any client component.
 *   3. `assert-analytics-events` harness will grep for usage.
 */

export const EVENTS = {
  // Widget viewing
  WIDGET_VIEWED: 'widget_viewed',
  CLUSTER_CARD_CLICKED: 'cluster_card_clicked',

  // Revenue intent — T-W03 forms
  PRICING_CTA_CLICKED: 'pricing_cta_clicked',
  PRO_PREORDER_SUBMITTED: 'pro_preorder_submitted',
  CREATOR_WAITLIST_SUBMITTED: 'creator_waitlist_submitted',
  B2B_INQUIRY_SUBMITTED: 'b2b_inquiry_submitted',
  API_KEY_REQUESTED: 'api_key_requested',

  // Embed (T-W02)
  EMBED_SCRIPT_LOADED: 'embed_script_loaded',
  EMBED_IFRAME_MOUNTED: 'embed_iframe_mounted',
  EMBED_CARD_CLICKED: 'embed_card_clicked',
  EMBED_INSTALLED: 'embed_installed',

  // Monetization (T-W04)
  AFFILIATE_LINK_CLICKED: 'affiliate_link_clicked',
  AD_CLICKED: 'ad_clicked',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Fire-and-forget client-side tracker.
 *
 * Safe during SSR (no-op if window undefined). Currently a console
 * stub — swap with `posthog.capture(event, properties)` in T-W05.
 */
export function track(event: EventName, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line no-console
  console.log(`[track] ${event}`, properties ?? {})
}

/**
 * Server-side counterpart for events fired during route handling
 * (e.g., `embed_installed`). T-W05 swaps for posthog-node.
 */
export function trackServer(
  distinctId: string,
  event: EventName,
  properties?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.log(`[track:server] distinct=${distinctId} event=${event}`, properties ?? {})
}
