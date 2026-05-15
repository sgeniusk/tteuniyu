// /recent — Supabase articles 테이블 실데이터 진단 페이지 (P0a)
//
// 목적 — RSS 워커가 실제로 데이터를 적재하고 있는지 운영자가 브라우저로
// 즉시 확인. mock data 일절 X — 실 DB 연결 안 되면 503 표시.
//
// 후속 — cluster + summarize 파이프라인 가동 후엔 /widget이 cluster 단위로
// 실데이터 surface하므로 본 페이지는 진단/QA 용도로 유지.

import Link from 'next/link'

import type { RecentArticle } from '@/app/api/v1/articles/recent/route'

export const metadata = {
  title: '최근 ingest 기사 — 진단 · 뜬이유',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RecentResponse {
  count: number
  articles: RecentArticle[]
}

interface ErrorResponse {
  error: string
  hint?: string
  message?: string
}

async function fetchRecent(): Promise<RecentResponse | ErrorResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
  const res = await fetch(`${url}/api/v1/articles/recent?limit=50`, {
    cache: 'no-store',
  })
  return res.json() as Promise<RecentResponse | ErrorResponse>
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}일 전`
}

function isError(payload: RecentResponse | ErrorResponse): payload is ErrorResponse {
  return 'error' in payload
}

export default async function RecentPage() {
  const payload = await fetchRecent()

  if (isError(payload)) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <h1 className="text-display-md font-pretendard mb-4">⚠ Supabase 미연결</h1>
          <pre className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-body-sm text-rose-200 overflow-auto">
{JSON.stringify(payload, null, 2)}
          </pre>
          <p className="mt-6 text-body-sm text-slate-400">
            <code className="text-teal-300">apps/web/.env.local</code>에{' '}
            <code className="text-teal-300">SUPABASE_URL</code>과{' '}
            <code className="text-teal-300">SUPABASE_SERVICE_ROLE_KEY</code> 설정 후{' '}
            <code className="text-teal-300">pnpm dev</code> 재시작.
          </p>
        </div>
      </main>
    )
  }

  // 매체별 색상 hash (slug 길이 기반 deterministic)
  const sourceColor = (slug: string): string => {
    const palette = [
      'bg-rose-500/15 text-rose-200 border-rose-500/30',
      'bg-amber-500/15 text-amber-200 border-amber-500/30',
      'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
      'bg-sky-500/15 text-sky-200 border-sky-500/30',
      'bg-violet-500/15 text-violet-200 border-violet-500/30',
      'bg-teal-500/15 text-teal-200 border-teal-500/30',
      'bg-pink-500/15 text-pink-200 border-pink-500/30',
    ]
    let h = 0
    for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 1000
    // noUncheckedIndexedAccess 대응 — modulo 보장으로 항상 valid index, fallback도 보강
    return palette[h % palette.length] ?? palette[0]!
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-8">
          <div className="flex items-baseline gap-2 mb-2">
            <span aria-hidden="true">📥</span>
            <h1 className="text-display-md font-pretendard">최근 ingest 기사</h1>
          </div>
          <p className="text-body-sm text-slate-400">
            Supabase <code className="text-teal-300">articles</code> 테이블 실데이터.
            매시 정각마다 GHA cron이 RSS 13개 매체에서 자동 적재 중. 새로고침하면
            최신 반영.
          </p>
          <p className="mt-1 text-body-sm text-slate-500">
            전체 {payload.count}건 · <Link href="/widget" className="text-teal-300 underline">/widget</Link>{' '}
            · <Link href="/" className="text-teal-300 underline">홈</Link>
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {payload.articles.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-body-xs font-medium ${sourceColor(
                    a.source_slug,
                  )}`}
                >
                  {a.source_name}
                </span>
                <span className="text-body-xs text-slate-500 shrink-0">
                  {formatRelative(a.ingested_at)}
                </span>
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-body-md text-slate-100 hover:text-teal-300 transition-colors"
              >
                {a.headline}
              </a>
              <p className="mt-1 text-body-xs text-slate-600 truncate">{a.url}</p>
            </li>
          ))}
        </ul>

        {payload.articles.length === 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-center">
            <p className="text-body-md text-amber-200">⚠ 아직 적재된 기사 없음.</p>
            <p className="mt-2 text-body-sm text-amber-300/80">
              GHA <code>p0a-worker.yml</code> ingest를 한 번 수동 실행하거나, 매시
              정각 cron 대기.
            </p>
          </div>
        )}

        <footer className="mt-12 border-t border-slate-800 pt-8 text-body-sm text-slate-500">
          <p>
            본 페이지는 진단·QA용. cluster + summarize 파이프라인 가동 후엔{' '}
            <Link href="/widget" className="text-teal-300 underline">
              /widget
            </Link>
            이 의미 단위(cluster)로 실데이터를 보여줌. 본 페이지는 raw articles
            한 건당 한 줄.
          </p>
        </footer>
      </div>
    </main>
  )
}
