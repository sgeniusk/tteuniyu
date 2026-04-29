/**
 * /embed/iframe — Creator Embed iframe surface.
 *
 * PRD v1.6 §7.1 F-P0w-3.
 * Loaded by /embed/widget.js inside an iframe on installer's site.
 *
 * Constraints:
 * - Server Component, no client polling (host page owns refresh cadence
 *   via the script tag itself; iframe is a paint surface)
 * - Cards open in NEW TAB (target=_blank rel=noopener)
 * - NO AdZone, NO Pro/Creator/B2B CTAs (read-only embed)
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
import { CoverageBar } from '@/components/CoverageBar'
import { totalCoverage, relativeTime } from '@/lib/format'
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

async function fetchClusters(origin: string, count: number): Promise<{
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

        <ol aria-label="실시간 이슈" className="flex flex-col gap-2">
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
              뜬이유
            </a>
          </span>
          <span className="font-mono">{data.methodology_version}</span>
        </footer>
      </div>
    </main>
  )
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
  const insufficient = cluster.sample_quality === 'insufficient_sample'
  const total = totalCoverage(cluster.coverage)
  return (
    <a
      href={`${origin}/cluster/${cluster.cluster_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md border border-slate-800 bg-slate-900 px-3 py-2 transition-colors duration-fast hover:border-slate-700"
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-body-sm tabular-nums text-slate-500">
          {String(rank).padStart(2, '0')}
        </span>
        <span className="line-clamp-1 text-body-md font-medium text-slate-50">
          {cluster.title}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <CoverageBar
          coverage={cluster.coverage}
          insufficient={insufficient}
          className="flex-1"
        />
        <span className="font-mono text-body-sm text-slate-500">
          {insufficient ? '표본 부족' : `N=${total}`}
        </span>
      </div>
    </a>
  )
}
