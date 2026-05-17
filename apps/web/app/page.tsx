// 랜딩 — 뜬이유 첫인상. hero + 실시간 이슈 Top 5 미리보기 + /widget 유도.
//
// 실데이터 — /api/v1/widget/top?size=large 에서 상위 5개 cluster.
// 디자인 톤은 /widget·/recent와 동일 (slate-950 + teal 액센트).

import Link from 'next/link'

export const metadata = {
  title: '뜬이유 — 한국 이슈 리스크 OS',
  description:
    '한국 언론의 실시간 이슈와 매체별 보도 흐름을 5초에 파악하세요. AI 정밀 분석 + 보도 분포.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LandingCluster {
  cluster_id: string
  title: string
  outlets_count: number
}

async function fetchTopIssues(): Promise<LandingCluster[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
  try {
    const res = await fetch(`${url}/api/v1/widget/top?size=large`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as { clusters?: LandingCluster[] }
    return (data.clusters ?? []).slice(0, 5)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const issues = await fetchTopIssues()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        {/* hero */}
        <header className="mb-12 text-center">
          <h1 className="text-display-lg font-pretendard mb-3">뜬이유</h1>
          <p className="text-body-lg text-slate-300">
            한국 언론의 실시간 이슈를 5초에 파악하는 이슈 리스크 OS
          </p>
          <p className="mt-2 text-body-sm text-slate-500">
            지금 여러 매체가 동시에 다루는 이슈 + AI 정밀 분석 + 매체별 보도 흐름
          </p>
        </header>

        {/* 실시간 이슈 미리보기 */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-heading-md font-pretendard">지금 뜨는 이슈</h2>
            <Link href="/widget" className="text-body-sm text-teal-400 hover:underline">
              전체 보기 →
            </Link>
          </div>

          {issues.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {issues.map((c, i) => (
                <li key={c.cluster_id}>
                  <Link
                    href={`/cluster/${c.cluster_id}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                  >
                    <span className="shrink-0 text-heading-md font-pretendard text-teal-500 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block text-body-md text-slate-100">
                        {c.title}
                      </span>
                      {c.outlets_count >= 2 && (
                        <span className="mt-0.5 block text-body-xs text-slate-500">
                          {c.outlets_count}개 매체 보도
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-body-sm text-slate-500">
              지금은 표시할 이슈가 없습니다. 잠시 후 다시 확인해주세요.
            </p>
          )}
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/widget"
            className="inline-block rounded-md bg-teal-600 px-6 py-3 text-body-md font-medium text-white hover:bg-teal-500 transition-colors"
          >
            실시간 이슈 대시보드 열기
          </Link>
        </div>

        {/* footer */}
        <footer className="mt-20 border-t border-slate-800 pt-8 text-center text-body-sm text-slate-500">
          <p>
            뜬이유 — 한국 이슈 리스크 OS. 매체별 보도를 비교해 이슈의 맥락을 본다.
          </p>
          <p className="mt-2">
            <Link href="/widget" className="text-teal-400 hover:underline">
              실시간 이슈
            </Link>
            {' · '}
            <Link href="/recent" className="text-teal-400 hover:underline">
              최근 기사
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}
