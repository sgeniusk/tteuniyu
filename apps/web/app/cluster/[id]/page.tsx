/**
 * Placeholder cluster detail page.
 *
 * Real implementation lands in T-007 (P0a) — Coverage Distribution
 * full view, methodology breakdown, dispute panel.
 *
 * IMPORTANT (P12 Revenue Zone Isolation, ADR-005): this route MUST
 * NEVER render <AdZone>, <AffiliateCard>, or <SponsoredCard>.
 * Enforced by harness:ad-zone-boundary in T-W04.
 */

interface ClusterPageProps {
  params: { id: string }
}

export default function ClusterPage({ params }: ClusterPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:px-6 md:py-14">
        <a href="/widget" className="text-body-sm text-slate-400 hover:text-slate-50">
          ← 실시간 이슈로 돌아가기
        </a>
        <h1 className="text-display-md font-pretendard">이슈 상세</h1>
        <p className="text-body-md text-slate-400">
          cluster_id: <code className="font-mono">{params.id}</code>
        </p>
        <p className="text-body-sm text-slate-500">
          이 페이지는 P0a 단계 (T-007)에서 보도 분포 전체 뷰로 구체화됩니다. 광고·제휴 요소는 본
          영역에 절대 렌더되지 않습니다 (P12 수익 영역 분리 원칙, ADR-005).
        </p>
      </div>
    </main>
  )
}
