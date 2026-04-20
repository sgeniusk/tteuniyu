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
      <body>{children}</body>
    </html>
  )
}
