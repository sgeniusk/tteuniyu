/**
 * /cluster/[id] — Coverage Distribution detail (T-W04 / ADR-009 Amendment 1 + ADR-010 + ADR-015 applied).
 *
 * P0w: mock-rich page joining the widget seed + cluster details + outlets +
 * deterministic trend windows. Real T-005/T-006/T-007 (P0a) swap mock joins
 * for Supabase reads (articles + summaries + keyword_trends per ADR-008).
 *
 * Layer 3 in PRD v1.7 §1.3 — Coverage Distribution surface.
 *
 * Card order (v1.6.5 + ADR-009 Amendment 1):
 *   ← back / header
 *   📺 영상 뉴스 (optional, YouTube Lite Embed)
 *   🚀 왜 지금 떴는가 (teal accent)
 *   📰 매체는 어떻게 다뤘나 (prose only — Coverage Bar removed per ADR-009)
 *   🧠 AI 정밀 분석 (entity_card + trend — auxiliary stance panel removed per ADR-009 Amendment 1)
 *   매체별 보도 list (single neutral slate dot, no stance label per ADR-015 §2.3)
 *   P12 footer
 *
 * ADR-009 Amendment 1 / ADR-015 §2.3 (이념 색상 완전 중립화):
 * - <AuxiliaryStancePanel> 컴포넌트 삭제 (이전 보조 mini panel 단계도 폐기)
 * - 매체 dot 색상 → slate-400 단일 (4색 분류 폐기)
 * - 4분류 텍스트 라벨 (매체군 A/B/C/외신) 제거 — 매체명만 노출
 * - "stance" / "이념" / "진영" 단어 추방 (CLAUDE.md Naming Ban)
 *
 * Trust Tag 자리 (ADR-015 §2.1, PR #13에서 정식 합류):
 * - 헤더 + outlet row 위치에 <TrustTag> slot 예약 (이번 PR은 제거만, 추가는 PR #13)
 *
 * Constraints (CLAUDE.md / PRD v1.7.1):
 * - rule 12 (P12): NO AdZone / AffiliateCard / SponsoredCard rendered here.
 * - rule 15 (Trust Signal): stance 단어/색 0건, slate-400 단일 dot.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import {
  ClusterDetailResponseSchema,
  type ClusterDetailResponse,
  type EntityCard,
  type OutletReport,
  type TrendAnalysis,
  type TrendWindow,
} from '@/lib/api/cluster-schemas'
import { type Category } from '@/lib/api/widget-schemas'
import { TrendSparkline } from '@/components/TrendSparkline'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
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

/** ADR-015 §7.1 — 매체 dot 단일 회색. */
const OUTLET_DOT_COLOR = 'bg-slate-400'

const WINDOW_LABEL: Record<TrendWindow['window'], string> = {
  '7d': '지난 7일',
  '30d': '지난 30일',
  '6m': '지난 6개월',
  '1y': '지난 1년',
}

export async function generateMetadata({ params }: ClusterPageProps): Promise<Metadata> {
  return {
    title: `이슈 상세 · 뜬이유`,
    description: `cluster ${params.id} — Issue Risk OS detail`,
    robots: { index: false, follow: true },
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
  const entity = cluster.ai_analysis.deep?.entity_card
  const trend = cluster.ai_analysis.deep?.trend

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:px-6 md:py-14">
        <BackLink />

        <header className="flex flex-col gap-3">
          <p className="text-body-sm uppercase tracking-wide text-slate-400">
            {CATEGORY_LABEL[cluster.category]} · 뜬이유 · Issue Risk OS
          </p>
          <h1 className="text-display-md font-pretendard">{cluster.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-body-sm text-slate-400">
            <span>표본 N={total}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={cluster.updated_at}>{relativeTime(cluster.updated_at)} 갱신</time>
            <span aria-hidden="true">·</span>
            <code className="font-mono">{cluster.methodology_version}</code>
          </div>
        </header>

        {cluster.youtube_news && (
          <section aria-label="영상 뉴스">
            <YouTubeEmbed
              videoId={cluster.youtube_news.video_id}
              title={cluster.youtube_news.title}
              channel={cluster.youtube_news.channel}
            />
          </section>
        )}

        <article className="flex flex-col gap-2 rounded-lg border border-teal-500/30 bg-teal-500/5 p-5">
          <header className="flex items-baseline gap-2">
            <span aria-hidden="true">🚀</span>
            <h2 className="text-heading-md font-pretendard text-teal-100">왜 지금 떴는가</h2>
          </header>
          <p className="text-body-md leading-relaxed text-slate-100">
            {cluster.ai_analysis.why_trending}
          </p>
        </article>

        <article className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5">
          <header className="flex items-baseline gap-2">
            <span aria-hidden="true">📰</span>
            <h2 className="text-heading-md font-pretendard text-slate-50">
              매체는 어떻게 다뤘나
            </h2>
          </header>
          <p className="text-body-md leading-relaxed text-slate-200">
            {cluster.ai_analysis.coverage_summary}
          </p>
          {insufficient && <InsufficientNotice total={total} inline />}
        </article>

        <article className="flex flex-col gap-5 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
          <header className="flex items-baseline gap-2">
            <span aria-hidden="true">🧠</span>
            <h2 className="text-heading-md font-pretendard text-slate-50">AI 정밀 분석</h2>
          </header>

          {entity && <EntityPanel entity={entity} />}
          {!entity && (
            <p className="text-body-sm text-slate-500">
              이 이슈는 정책·이슈 형태라 별도의 정체 정의를 두지 않습니다.
            </p>
          )}

          {trend && <TrendPanel trend={trend} />}

          <p className="text-body-sm text-slate-500">
            P0w mock 분석입니다. P0a (T-005)에서 Claude Haiku + 출처 트래킹, T-006 워커
            (ADR-008)에서 keyword_trends 시계열로 교체됩니다.
          </p>
        </article>

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
          <p className="mt-2">
            뜬이유는 가치 판단 도구가 아닙니다. 매체별 보도와 시간 흐름을 한 화면에 정리해
            소재·리스크·연구에 활용 가능한 형태로 제공합니다 (ADR-010).
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

function InsufficientNotice({ total, inline = false }: { total: number; inline?: boolean }) {
  if (inline) {
    return (
      <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-body-sm text-amber-200">
        보도 표본 {total}건으로 부족 (≥ 5건 필요). 분포는 형성 중이며, 표본이 충족되면 자동
        갱신됩니다.
      </p>
    )
  }
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

function EntityPanel({ entity }: { entity: EntityCard }) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-slate-950/60 p-4">
      <div className="flex items-baseline gap-2">
        <span aria-hidden="true">🪪</span>
        <h3 className="text-heading-md font-pretendard text-slate-50">정체</h3>
      </div>
      <p className="text-body-md leading-relaxed text-slate-200">{entity.definition}</p>
      {entity.domain_facts.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entity.domain_facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-body-sm text-slate-500">{fact.label}</dt>
              <dd className="text-body-md text-slate-100">
                {fact.value}
                {fact.source && (
                  <span className="ml-2 font-mono text-body-sm text-slate-500">
                    ({fact.source})
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function TrendPanel({ trend }: { trend: TrendAnalysis }) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-slate-950/60 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span aria-hidden="true">📈</span>
          <h3 className="text-heading-md font-pretendard text-slate-50">AI 흐름 분석</h3>
        </div>
        <span className="text-body-sm text-slate-500">
          {trend.cached ? '캐시 데이터' : '런타임 mock'}
        </span>
      </div>
      <p className="text-body-sm text-slate-500">
        검색·보도 지표를 0~100으로 정규화한 시계열입니다 (ADR-008). 윈도우별 마지막 점이 현재
        값입니다.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {trend.windows.map((w) => (
          <TrendWindowRow key={w.window} window={w} />
        ))}
      </div>
    </div>
  )
}

function TrendWindowRow({ window }: { window: TrendWindow }) {
  const last = window.buckets[window.buckets.length - 1]?.v ?? 0
  const first = window.buckets[0]?.v ?? 0
  const delta = last - first
  const arrow = delta > 1 ? '↑' : delta < -1 ? '↓' : '→'
  const arrowColor =
    delta > 1 ? 'text-teal-500' : delta < -1 ? 'text-rose-500' : 'text-slate-500'
  const ariaLabel = `${WINDOW_LABEL[window.window]} 트렌드, 마지막 값 ${last}점 (시작 대비 ${delta > 0 ? '+' : ''}${delta.toFixed(1)})`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-body-sm text-slate-400">
        <span>{WINDOW_LABEL[window.window]}</span>
        <span className="flex items-baseline gap-1.5 font-mono text-slate-200">
          {last.toFixed(1)}
          <span className={cn('text-body-sm', arrowColor)} aria-hidden="true">
            {arrow}
          </span>
          <span className="text-body-sm text-slate-500">/ 100</span>
        </span>
      </div>
      <TrendSparkline
        data={window.buckets.map((b) => b.v)}
        width={320}
        height={48}
        ariaLabel={ariaLabel}
      />
      <div className="flex items-baseline justify-between gap-2 text-body-sm text-slate-500">
        <span>출처: {window.source}</span>
        <span className="font-mono">{window.buckets.length} buckets</span>
      </div>
    </div>
  )
}

/**
 * ADR-009 Amendment 1 / ADR-015 §2.3 — 매체 row는 매체명·시간·헤드라인만.
 * dot 색상은 slate-400 단일이며 4색 분류 라벨 일체 없음.
 * Trust Tag (PR #13)는 본 row 또는 카드 헤더에 별도 슬롯으로 합류.
 */
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
        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', OUTLET_DOT_COLOR)}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-body-sm font-medium text-slate-200">{report.outlet_name}</span>
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
