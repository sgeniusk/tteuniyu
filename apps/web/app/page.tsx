export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-display-md font-pretendard mb-4">뜬이유</h1>
        <p className="text-body-lg text-slate-400 mb-6">
          한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.
        </p>
        <p className="text-body-sm text-slate-400">
          P0w 개발 중 · 2026-04-21 ~
        </p>
        <p className="mt-8 text-body-sm">
          <a href="/widget" className="text-teal-500 hover:underline">
            /widget (T-W01 구현 예정) →
          </a>
        </p>
      </div>
    </main>
  )
}
