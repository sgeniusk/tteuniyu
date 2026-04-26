import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '뜬이유 — 실시간 이슈',
  description: '한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.',
  openGraph: {
    title: '뜬이유 — 실시간 이슈',
    description: '한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.',
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
