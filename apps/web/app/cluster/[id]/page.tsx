/**
 * /cluster/[id] — Coverage Distribution detail (v1.6.3 patch).
 *
 * P0w: mock-rich page joining the widget seed + cluster details + outlets.
 * Real T-007 (P0a) swaps mock joins for Supabase reads.
 *
 * Layer 3 in PRD v1.6 §1.3 — the Coverage Distribution surface.
 *
 * Constraints (CLAUDE.md / PRD v1.6):
 * - rule 12 (P12) Revenue Zone Isolation: NO `<AdZone>`, `<AffiliateCard>`,
 *   `<SponsoredCard>` here. harness:ad-zone-boundary verifies.
 * - rule 5 wording: "보도 분포" / "Coverage Distribution" only.
 * - v1.6.2 §C-3: Coverage Bar visualizes only politics/society categories;
 *   other categories show a placeholder note pending V0.5 visualization.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import {
  ClusterDetailResponseSchema,
  type ClusterDetailResponse,
  type OutletReport,
} from '@/lib/api/cluster-schemas'
import { isCoverageRelevant, type Category } from '@/lib/api/widget-schemas'
import { CoverageBar } from '@/components/CoverageBar'
import { relativeTime, totalCoverage } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ClusterPageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<Category, string> = {
  politics: '정치',
  society: '사회',
  economy: '경제',
  international: '국제',
  tech_science: 'IT·과학',
  culture_sports: '문화·스포츠',
  lifestyle: '라이프',
}

const STANCE_LABEL = {
  progressive: '진보 성향',
  mixed: '중도·혼합',
  conservative: '보수 성향',
  foreign: '외신',
} as const

const STANCE_DOT_CLASS = {
  progressive: 'bg-coverage-progressive',
  mixed: 'bg-coverage-mixed',
  conservative: 'bg-coverage-conservative',
  foreign: 'bg-coverage-foreign',
} as const

const STANCE_TEXT_CLASS = {
  progressive: 'text-coverage-progressive',
  mixed: 'text-coverage-mixed',
  conservative: 'text-coverage-conservative',
  foreign: 'text-coverage-foreign',
} as const

export async function generateMetadata({ params }: ClusterPageProps): Promise<Metadata> {
  return {
    title: `이슈 상세 · 뜬이유`,
    description: `cluster ${params.id} — Coverage Distribution`,
    robots: { index: false, follow: true }, // mock data shouldn't be indexed
  }
}

async function fetchDetail(id: string): Promise<
  | { kind: 'ok'; data: ClusterDetailResponse }
  | { kind: 'invalid' }
  | { kind: 'not-found' }
  | { kind: 'error'; status: number }
> {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const protocol = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const url = `${protocol}://${host}/api/v1/clusters/${encodeURIComponent(id)}`

  const res = await fetch(url, { cache: 'no-store' })
  if (res.status === 400) return { kind: 'invalid' }
  if (res.status === 404) return { kind: 'not-found' }
  if (!res.ok) return { kind: 'error', status: res.status }
  const json: unknown = await res.json()
  return { kind: 'ok', data: ClusterDetailResponseSchema.parse(json) }
}

export default async function ClusterPage({ params }: ClusterPageProps) {
  const result = await fetchDetail(params.id)

  if (result.kind !== 'ok') {
    return <NotFoundState id={params.id} kind={result.kind} />
  }

  const cluster = result.data
  const total = totalCoverage(cluster.coverage)
  const insufficient = cluster.sample_quality === 'insufficient_sample'
  const showBar = isCoverageRelevant(cluster.category) && !insufficient

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
        <BackLink />

        <header className="flex flex-col gap-3">
          <p className="text-body-sm uppercase tracking-wide text-slate-400">
            {CATEGORY_LABEL[cluster.category]} · 뜬이유
          </p>
          <h1 className="text-display-md font-pretendard">{cluster.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-body-sm text-slate-400">
            <span>표본 N={total}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={cluster.updated_at}>
              {relativeTime(cluster.updated_at)} 갱신
            </time>
            <span aria-hidden="true">·</span>
            <code className="font-mono">{cluster.methodology_version}</code>
          </div>
        </header>

        <section
          aria-label="AI 요약"
          className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="text-heading-md font-pretendard text-slate-50">
            AI 요약
          </h2>
          <p className="text-body-md leading-relaxed text-slate-200">
            {cluster.ai_summary}
          </p>
          <p className="text-body-sm text-slate-500">
            P0w mock 요약입니다. P0a (T-005)에서 Claude Haiku 출력 + copy ratio ≤ 15% 검증으로
            교체됩니다.
          </p>
        </section>

        {showBar && (
          <CoverageDistributionPanel
            coverage={cluster.coverage}
            insufficient={insufficient}
          />
        )}

        {!showBar && !insufficient && (
          <section
            aria-label="보도 분포"
            className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-5 text-body-sm text-slate-400"
          >
            <h2 className="text-heading-md font-pretendard text-slate-50">보도 분포</h2>
            <p>
              <strong className="text-slate-200">{CATEGORY_LABEL[cluster.category]}</strong>{' '}
              카테고리는 진보·중도·보수 분류가 의미 있는 영역이 아닙니다. V0.5에서 카테고리
              특화 시각화 (외신 비중 / 매체 다양도 지수 등)가 추가됩니다.
            </p>
            <p className="text-slate-500">
              아래 매체별 보도 리스트로 다원적 원본에 직접 접근하세요.
            </p>
          </section>
        )}

        {insufficient && <InsufficientNotice total={total} />}

        <section aria-label="매체별 보도" className="flex flex-col gap-3">
          <h2 className="text-heading-md font-pretendard text-slate-50">
            매체별 보도 ({cluster.outlets.length})
          </h2>
          <p className="text-body-sm text-slate-500">
            뜬이유는 어떤 매체가 우월하다고 판단하지 않습니다. 원문을 직접 비교하세요.
          </p>
          <ol className="flex flex-col gap-2">
            {cluster.outlets.map((report) => (
              <li key={`${report.outlet_slug}-${report.published_at}`}>
                <OutletRow report={report} />
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-8 text-body-sm text-slate-500">
          <p>
            이 영역에는 광고·제휴·스폰서 카드가 절대 렌더되지 않습니다 (P12 수익 영역 분리,
            ADR-005). 이의제기·외신 비교·OG 공유 카드는 P0a (T-007)에서 추가됩니다.
          </p>
        </footer>
      </div>
    </main>
  )
}

function BackLink() {
  return (
    <Link
      href="/widget"
      className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-body-sm text-slate-400 hover:border-slate-700 hover:text-slate-50"
    >
      <span aria-hidden="true">←</span> 실시간 이슈로 돌아가기
    </Link>
  )
}

function CoverageDistributionPanel({
  coverage,
  insufficient,
}: {
  coverage: ClusterDetailResponse['coverage']
  insufficient: boolean
}) {
  return (
    <section
      aria-label="보도 분포 (Coverage Distribution)"
      className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-heading-md font-pretendard text-slate-50">보도 분포</h2>
        <p className="text-body-sm text-slate-400">
          이 이슈를 다룬 매체를 진영 4구간으로 나누어 표시합니다 — 판단이 아닌 분포입니다.
        </p>
      </header>

      <CoverageBar coverage={coverage} insufficient={insufficient} className="h-4" />

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CoverageStat
          label="진보 성향"
          value={coverage.progressive}
          colorClass="text-coverage-progressive"
        />
        <CoverageStat
          label="중도·혼합"
          value={coverage.mixed}
          colorClass="text-coverage-mixed"
        />
        <CoverageStat
          label="보수 성향"
          value={coverage.conservative}
          colorClass="text-coverage-conservative"
        />
        <CoverageStat label="외신" value={coverage.foreign} colorClass="text-coverage-foreign" />
      </dl>
    </section>
  )
}

function CoverageStat({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-slate-950/60 p-3">
      <dt className="text-body-sm text-slate-400">{label}</dt>
      <dd className={cn('font-mono text-mono-lg', colorClass)}>{value}</dd>
    </div>
  )
}

function InsufficientNotice({ total }: { total: number }) {
  return (
    <section
      aria-label="표본 부족"
      className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 text-body-sm text-amber-200"
    >
      <h2 className="text-heading-md font-pretendard text-amber-100">표본 부족</h2>
      <p>
        현재 보도 표본이 {total}건으로 부족합니다 (≥ 5건 필요). 분포는 형성 중이며, 표본이
        충족되면 자동 갱신됩니다.
      </p>
    </section>
  )
}

function OutletRow({ report }: { report: OutletReport }) {
  return (
    <a
      href={report.outlet_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-baseline gap-3 rounded-md border border-transparent px-3 py-3 transition-colors duration-fast hover:border-slate-800 hover:bg-slate-900/40"
    >
      <span
        aria-hidden="true"
        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', STANCE_DOT_CLASS[report.stance])}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={cn('text-body-sm font-medium', STANCE_TEXT_CLASS[report.stance])}>
            {report.outlet_name}
          </span>
          <span className="text-body-sm text-slate-500">{STANCE_LABEL[report.stance]}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <time dateTime={report.published_at} className="text-body-sm text-slate-500">
            {relativeTime(report.published_at)}
          </time>
        </div>
        <p className="mt-1 text-body-md text-slate-50">{report.headline}</p>
      </div>
      <span aria-hidden="true" className="shrink-0 text-slate-500">
        ↗
      </span>
    </a>
  )
}

function NotFoundState({
  id,
  kind,
}: {
  id: string
  kind: 'invalid' | 'not-found' | 'error'
}) {
  const message =
    kind === 'invalid'
      ? '잘못된 cluster id 형식입니다 (UUID 필요).'
      : kind === 'not-found'
        ? '이 cluster는 P0w mock 풀에 없습니다.'
        : '일시적인 오류로 cluster를 불러올 수 없습니다.'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:px-6 md:py-14">
        <BackLink />
        <h1 className="text-display-md font-pretendard">이슈를 찾을 수 없음</h1>
        <p className="text-body-md text-slate-400">{message}</p>
        <p className="text-body-sm text-slate-500">
          cluster_id: <code className="font-mono break-all">{id}</code>
        </p>
      </div>
    </main>
  )
}
