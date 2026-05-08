import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '뜬이유 — 한국 이슈 리스크 OS',
  description:
    '오늘 뜬 이슈, AI 정밀 분석, 매체별 보도 흐름을 한 화면에 — 크리에이터·홍보·연구자를 위한 소재·리스크 인프라.',
  openGraph: {
    title: '뜬이유 — 한국 이슈 리스크 OS',
    description: '5초에 파악, 5분에 분석, 5초 안에 콘텐츠로.',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/*
          Pretendard Variable via jsDelivr.
          Fallback chain in globals.css (system-ui, sans-serif) covers
          poor-network first paint per Codex Task D.
        */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
