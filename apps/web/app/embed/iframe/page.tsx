/**
 * /embed/iframe — Creator Embed iframe surface.
 *
 * PRD v1.6 §7.1 F-P0w-3 + v1.6.2 patch.
 * Loaded by /embed/widget.js inside an iframe on installer's site.
 *
 * Constraints:
 * - Server Component, no client polling (host page owns refresh cadence
 *   via the script tag itself; iframe is a paint surface)
 * - Cards open in NEW TAB (target=_blank rel=noopener)
 * - NO AdZone, NO Pro/Creator/B2B CTAs (read-only embed)
 * - **v1.6.2: NO Coverage Bar** (hidden on widget surfaces; only shown on
 *   /cluster/[id] detail when category is politics/society)
 * - Dark mode default, design tokens shared with /widget
 * - CSP frame-ancestors * (P0w; V1 will whitelist)
 */

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import {
  WidgetLargeResponseSchema,
  type WidgetLargeResponse,
  type WidgetCluster,
} from '@/lib/api/widget-schemas'
import { relativeTime } from '@/lib/format'
import { EmbedSizeSchema, type EmbedSize } from '@/lib/embed/schemas'

export const metadata: Metadata = {
  title: '뜬이유 실시간 이슈 위젯',
  // Embeds are not standalone pages — keep them out of search index.
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

const COUNT_BY_SIZE: Record<EmbedSize, number> = {
  small: 1,
  medium: 3,
  large: 5,
}

function getOrigin(hdrs: Headers): string {
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000'
  const protocol = hdrs.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

async function fetchClusters(
  origin: string,
  count: number,
): Promise<{
  data: WidgetLargeResponse
  slice: WidgetCluster[]
}> {
  const url = `${origin}/api/v1/widget/top?size=large`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Embed fetch failed ${res.status}`)
  const json: unknown = await res.json()
  const data = WidgetLargeResponseSchema.parse(json)
  return { data, slice: data.clusters.slice(0, count) }
}

interface EmbedPageProps {
  searchParams: Promise<{ size?: string; host?: string }> | { size?: string; host?: string }
}

async function resolveParams(
  raw: EmbedPageProps['searchParams'],
): Promise<{ size: EmbedSize; host: string }> {
  const sp = (await Promise.resolve(raw)) ?? {}
  const sizeResult = EmbedSizeSchema.safeParse(sp.size ?? 'medium')
  const size: EmbedSize = sizeResult.success ? sizeResult.data : 'medium'
  const host = (sp.host ?? '').slice(0, 253) || 'unknown'
  return { size, host }
}

export default async function EmbedIframePage({ searchParams }: EmbedPageProps) {
  const { size, host: _host } = await resolveParams(searchParams)
  const origin = getOrigin(headers())
  const { data, slice } = await fetchClusters(origin, COUNT_BY_SIZE[size])

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-3 text-slate-50 md:px-4 md:py-4">
      <div className="flex h-full flex-col gap-3">
        <header className="flex items-baseline justify-between text-body-sm text-slate-400">
          <span className="font-medium text-slate-50">실시간 이슈</span>
          <time className="text-body-sm" dateTime={data.updated_at}>
            {relativeTime(data.updated_at)}
          </time>
        </header>

        <ol aria-label="실시간 이슈" className="flex flex-col gap-1">
          {slice.map((cluster, idx) => (
            <li key={cluster.cluster_id}>
              <EmbedRow cluster={cluster} rank={idx + 1} origin={origin} />
            </li>
          ))}
        </ol>

        <footer className="mt-auto flex items-center justify-between text-body-sm text-slate-500">
          <span>
            Powered by{' '}
            <a
              href={`${origin}/widget`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:underline"
            >
              뜬이유 · Issue Risk OS
            </a>
          </span>
          <span className="font-mono">{data.methodology_version}</span>
        </footer>
      </div>
    </main>
  )
}

type Trend = 'up' | 'down' | 'same' | 'new' | null

function trendKind(rank: number, previous: number | null | undefined): Trend {
  if (previous === null) return 'new'
  if (previous === undefined) return null
  if (previous > rank) return 'up'
  if (previous < rank) return 'down'
  return 'same'
}

function EmbedRow({
  cluster,
  rank,
  origin,
}: {
  cluster: WidgetCluster
  rank: number
  origin: string
}) {
  const trend = trendKind(rank, cluster.previous_rank)
  return (
    <a
      href={`${origin}/cluster/${cluster.cluster_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-fast hover:bg-slate-900"
    >
      <span
        className={`w-6 shrink-0 text-center font-mono text-mono-md tabular-nums ${
          rank <= 3 ? 'text-teal-400' : 'text-slate-500'
        }`}
        aria-label={`순위 ${rank}위`}
      >
        {rank}
      </span>
      <span className="line-clamp-1 flex-1 text-body-md font-medium text-slate-50">
        {cluster.title}
      </span>
      {trend === 'up' && (
        <span aria-label="상승" className="shrink-0 text-teal-500" title="순위 상승">
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            role="presentation"
          >
            <path d="M6 2 L10 8 L7 8 L7 11 L5 11 L5 8 L2 8 Z" fill="currentColor" />
          </svg>
        </span>
      )}
      {trend === 'new' && (
        <span
          aria-label="신규 진입"
          className="shrink-0 rounded-sm bg-amber-500/15 px-1.5 font-mono text-body-sm text-amber-400"
          title="신규 진입"
        >
          NEW
        </span>
      )}
    </a>
  )
}
