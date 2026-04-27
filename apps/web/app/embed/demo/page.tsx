/**
 * /embed/demo — Public install instructions for Creator Embed.
 *
 * Shows the copy-paste snippet, lists supported sizes, and includes a
 * recursive self-test (live iframe rendered from the same /embed/widget.js
 * we ship). If this page renders three iframes, the embed pipeline works.
 *
 * NOT part of the embed surface itself — this is a marketing/dev page.
 */

import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: '뜬이유 위젯 임베드 데모',
  description: '한 줄 <script>로 블로그·뉴스레터·사내 대시보드에 실시간 이슈 위젯을 삽입하세요.',
}

const SNIPPET = `<script async
  src="https://tteuniyu.com/embed/widget.js"
  data-tteuniyu-widget
  data-size="medium"></script>`

export default function EmbedDemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
        <header className="flex flex-col gap-3">
          <p className="text-body-sm uppercase tracking-wide text-slate-400">
            Creator Embed · 뜬이유
          </p>
          <h1 className="text-display-md font-pretendard">
            한 줄 임베드로 독자에게 실시간 이슈 맥락 제공
          </h1>
          <p className="text-body-md text-slate-400">
            블로그·뉴스레터·사내 대시보드 어디에든 아래 <code className="font-mono">&lt;script&gt;</code>
            한 줄을 붙이면 됩니다. 외부 사이트는 뜬이유 디자인에 영향을 주지 않습니다 (iframe 격리).
            P0w는 무료 무제한, V0.5에서 Creator Pro tier로 차등화 예정.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-heading-lg font-pretendard">설치 방법</h2>
          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 font-mono text-body-sm text-slate-200">
            <code>{SNIPPET}</code>
          </pre>
          <ul className="flex flex-col gap-1 text-body-sm text-slate-400">
            <li>
              <code className="font-mono">data-size</code>: <code>small</code> (300×180) /
              <code> medium</code> (400×320) / <code>large</code> (500×480) — 기본 medium
            </li>
            <li>
              <code className="font-mono">data-host</code>: 분석용 도메인 식별 (생략 시 자동
              감지)
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-heading-lg font-pretendard">실시간 데모</h2>
          <p className="text-body-sm text-slate-400">
            아래 세 영역은 위 스니펫이 만든 실제 iframe입니다. 카드를 클릭하면 새 탭에서
            상세 페이지가 열립니다.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <DemoSlot label="small (300×180)" size="small" />
            <DemoSlot label="medium (400×320)" size="medium" />
            <DemoSlot label="large (500×480)" size="large" />
          </div>
        </section>

        <footer className="border-t border-slate-800 pt-8 text-body-sm text-slate-400">
          <p>
            P0w 단계 · iframe 격리, 호스트 사이트 스타일 비간섭, 쿠키 미사용. 호스트 도메인 +
            크기만 익명 카운트 (PII 없음).
          </p>
          <p className="mt-2 text-slate-500">
            Creator Pro 유료 tier 출시 시{' '}
            <a className="text-teal-500 hover:underline" href="/widget#creator">
              얼리 액세스 신청자
            </a>
            에게 우선 안내됩니다.
          </p>
        </footer>
      </div>

      {/*
        Recursive self-test: load the very script we publish. If the page
        below renders three iframes, the install pipeline is healthy.
        next/script with strategy=afterInteractive ensures it runs after
        DemoSlot script tags exist in the DOM.
      */}
      <Script src="/embed/widget.js" strategy="afterInteractive" />
    </main>
  )
}

function DemoSlot({ label, size }: { label: string; size: 'small' | 'medium' | 'large' }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm text-slate-400">{label}</span>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          // eslint-disable-next-line react/no-unknown-property
          {...{ 'data-tteuniyu-widget': '', 'data-size': size }}
        />
      </div>
    </div>
  )
}
