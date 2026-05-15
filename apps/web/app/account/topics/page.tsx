'use client'

// 내 토픽 페이지 — Custom Topic 추가·관리 (ADR-018 + Pro+ 차별화)
//
// 비협상.
//   - 클라이언트 입력 즉시 validateKeyword() + 서버 POST 시 재검증
//   - Tier 한도 — Pro 5 / Creator 20 / Leader 50 (현재 mock = creator)

import { useEffect, useState } from 'react'

import { validateKeyword } from '@/lib/keyword-validator'
import type { Topic } from '@/lib/topics/store'

interface TopicsResponse {
  topics: Topic[]
  tier: string
  limit: number
  used: number
}

export default function TopicsPage() {
  const [data, setData] = useState<TopicsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [validation, setValidation] = useState<{ accepted: boolean; reason?: string }>({
    accepted: true,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/topics', { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function onKeywordChange(value: string) {
    setKeyword(value)
    setSubmitError(null)
    setValidation(value.trim() ? validateKeyword(value) : { accepted: true })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validation.accepted) return
    setLoading(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/v1/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, matching_mode: 'similar' }),
      })
      if (res.status === 422) {
        const j = await res.json()
        setSubmitError(j.reason || '키워드가 거부되었습니다')
      } else if (res.status === 403) {
        const j = await res.json()
        setSubmitError(`Tier 한도 초과 — ${j.tier} ${j.used}/${j.limit}`)
      } else if (res.ok) {
        setKeyword('')
        await refresh()
      } else {
        setSubmitError(`서버 오류 (${res.status})`)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(topicId: string) {
    setLoading(true)
    try {
      await fetch(`/api/v1/topics?id=${encodeURIComponent(topicId)}`, {
        method: 'DELETE',
      })
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        <header className="flex items-baseline gap-2 mb-2">
          <span aria-hidden="true">🔍</span>
          <h1 className="text-display-md font-pretendard">내 토픽</h1>
        </header>
        <p className="mt-1 text-body-sm text-slate-400 mb-8">
          관심 키워드를 등록하면 매일 매칭 클러스터를 우선 노출합니다.
          {data && (
            <>
              {' · '}
              <span className="text-teal-300">
                {data.tier} 사용중 · {data.used}/{data.limit}
              </span>
            </>
          )}
        </p>

        {/* Add form */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-5 mb-6"
        >
          <label htmlFor="keyword" className="text-body-sm text-slate-300 font-medium">
            새 키워드
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="예 — 삼성전자 반도체 / AI 규제 / 대선"
            maxLength={40}
            className="rounded-md border border-slate-800 bg-slate-950 px-4 py-2 text-body-md text-slate-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
          />
          {!validation.accepted && (
            <p className="text-body-sm text-amber-300">⚠ {validation.reason}</p>
          )}
          {submitError && (
            <p className="text-body-sm text-rose-300">⚠ {submitError}</p>
          )}
          <p className="text-body-sm text-slate-500">
            투자 판단·이념 분류 단어는 차단됩니다. 사실 추적 키워드만 등록 가능.
          </p>
          <button
            type="submit"
            disabled={loading || !validation.accepted || !keyword.trim()}
            className="rounded-md bg-teal-500 px-4 py-2 text-body-md font-medium text-slate-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {loading ? '처리 중…' : '추가'}
          </button>
        </form>

        {/* List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-heading-md font-pretendard text-slate-50">
            추적 중인 키워드 ({data?.topics.length ?? 0})
          </h2>
          {data && data.topics.length === 0 && (
            <p className="text-body-sm text-slate-500">아직 등록된 키워드가 없습니다.</p>
          )}
          {data?.topics.map((t) => (
            <article
              key={t.topic_id}
              className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="text-body-md text-slate-100">🔍 {t.keyword}</span>
                <span className="text-body-sm text-slate-500">
                  매칭 mode — {t.matching_mode}
                  {t.match_count > 0 && ` · 매칭 ${t.match_count}회`}
                </span>
              </div>
              <button
                onClick={() => onDelete(t.topic_id)}
                disabled={loading}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-body-sm text-slate-400 hover:border-rose-500 hover:text-rose-300"
              >
                삭제
              </button>
            </article>
          ))}
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-8 text-body-sm text-slate-500">
          <p>
            본 화면은 P0a UX skeleton입니다. Supabase + 실 사용자 인증은 후속 PR에서 합류.
            매칭 결과는 Daily Digest 상단에 우선 노출됩니다 (ADR-017/018).
          </p>
        </footer>
      </div>
    </main>
  )
}
