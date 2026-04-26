/**
 * /widget — 실시간 이슈 dashboard.
 *
 * PRD v1.6 §7.1 F-P0w-1, §1.3 (Layer 2 진입 Feature).
 * v1.6.1 patch: Top 10 + 60s client polling for live feel.
 *
 * Server Component shell:
 * - SSR initial Top 10 fetch (instant first paint)
 * - <RisingIssuesList> client island handles polling + "마지막 업데이트"
 *
 * P0w scope:
 * - Top 10 issues + mini Coverage Bar
 * - Pro / Creator / B2B preorder callouts (forms wired in T-W03)
 * - NO AdZone in this ticket (T-W04)
 */

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import {
  WidgetLargeResponseSchema,
  type WidgetLargeResponse,
} from '@/lib/api/widget-schemas'
import { RisingIssuesList } from '@/components/RisingIssuesList'

export const metadata: Metadata = {
  title: '실시간 이슈 · 뜬이유',
  description: '한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.',
  openGraph: {
    title: '실시간 이슈 · 뜬이유',
    description: '한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.',
    type: 'website',
    locale: 'ko_KR',
  },
}

export const dynamic = 'force-dynamic'

async function fetchTopLarge(): Promise<WidgetLargeResponse> {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const protocol =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const url = `${protocol}://${host}/api/v1/widget/top?size=large`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Widget API responded ${res.status} for ${url}`)
  }
  const json: unknown = await res.json()
  return WidgetLargeResponseSchema.parse(json)
}

export default async function WidgetPage() {
  const initial = await fetchTopLarge()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:max-w-5xl md:px-6 md:py-14">
        <header className="flex flex-col gap-3">
          <p className="text-body-sm uppercase tracking-wide text-slate-400">
            실시간 이슈 · 뜬이유
          </p>
          <h1 className="text-display-md font-pretendard">지금 한국 언론에서 뜨는 이유</h1>
          <p className="text-body-md text-slate-400">
            보도 분포는 최대 60분 지연될 수 있습니다 · 60초마다 자동 갱신
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <RisingIssuesList initial={initial} />
        </section>

        <footer className="mt-12 flex flex-col gap-6 border-t border-slate-800 pt-8 text-body-sm text-slate-400">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PreorderCallout
              title="개인용 Pro"
              description="키워드 알림 · 개인 미디어 다이어트 · Blindspot Report"
              cta="Pro 출시 알림 받기"
              href="#pro"
            />
            <PreorderCallout
              title="크리에이터 Embed"
              description="블로그·뉴스레터에 한 줄 임베드로 실시간 이슈 공유"
              cta="얼리 액세스 신청"
              href="#creator"
            />
            <PreorderCallout
              title="기업·기관"
              description="실시간 모니터링 대시보드 · API · 주간 리포트"
              cta="문의하기"
              href="#b2b"
            />
          </div>
          <p>
            뜬이유는 판단하지 않고 분포를 보여줍니다. 자세한 방법론과 이의제기는{' '}
            <span className="font-medium text-slate-200">P0a 단계에서 공개됩니다</span>.
          </p>
          <p className="text-slate-500">
            P0w D0~D7 · 2026-04-21 ~ 2026-04-28 · 출시 예정 기능은 모두 “알림 받기”로 표기
          </p>
        </footer>
      </div>
    </main>
  )
}

function PreorderCallout({
  title,
  description,
  cta,
  href,
}: {
  title: string
  description: string
  cta: string
  href: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-body-lg font-medium text-slate-50">{title}</h3>
      <p>{description}</p>
      <p>
        <a href={href} className="text-teal-500 hover:underline">
          {cta} <span aria-hidden="true">→</span>
        </a>
      </p>
      <p className="text-slate-500">출시 예정 · T-W03에서 폼 연결</p>
    </div>
  )
}
