'use client'

// Daily Digest 설정 (ADR-017 + Pro+ 차별화)
//
// 비협상 (변호사 §5.3 + 정통망법 §50의2).
//   digest_consent + marketing_consent 분리 토글.
//   매일 09:00 KST 자동 발송 (안전 시간대) 안내.

import { useEffect, useState } from 'react'

import type { DigestPrefs } from '@/lib/digest-prefs/store'

const CATEGORY_LABELS: Record<string, string> = {
  politics: '🏛 정치',
  society: '👥 사회',
  economy: '💹 경제',
  international: '🌐 국제',
  tech_science: '🔬 IT·과학',
  culture_sports: '🎭 문화·스포츠',
  lifestyle: '☀ 라이프',
}

export default function DigestPrefsPage() {
  const [prefs, setPrefs] = useState<DigestPrefs | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  async function refresh() {
    const res = await fetch('/api/v1/digest-prefs', { cache: 'no-store' })
    if (res.ok) setPrefs(await res.json())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function update(patch: Partial<DigestPrefs>) {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/digest-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        setPrefs(await res.json())
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(cat: string) {
    if (!prefs) return
    const has = prefs.preferred_categories.includes(cat as DigestPrefs['preferred_categories'][0])
    const next = has
      ? prefs.preferred_categories.filter((c) => c !== cat)
      : [...prefs.preferred_categories, cat as DigestPrefs['preferred_categories'][0]]
    update({ preferred_categories: next })
  }

  if (!prefs) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-body-md text-slate-400">로딩 중…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        <header className="flex items-baseline gap-2 mb-2">
          <span aria-hidden="true">📬</span>
          <h1 className="text-display-md font-pretendard">Daily Digest</h1>
        </header>
        <p className="mt-1 text-body-sm text-slate-400 mb-8">
          매일 09:00 KST 어제 24시간 한국 이슈를 메일로 받아보세요. Pro 사용자 차별화.
        </p>

        {savedFlash && (
          <p className="mb-4 rounded-md border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-body-sm text-teal-300">
            ✅ 저장됨
          </p>
        )}

        {/* 동의 — 분리 (변호사 §5.3) */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 mb-6">
          <h2 className="text-heading-md font-pretendard text-slate-50 mb-4">동의</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.digest_consent}
                onChange={(e) => update({ digest_consent: e.target.checked })}
                disabled={saving}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                <span className="text-body-md text-slate-100 font-medium">
                  Daily Digest 수신 동의 (정보 제공)
                </span>
                <span className="block text-body-sm text-slate-500 mt-0.5">
                  매일 09:00 KST 어제의 한국 이슈 다이제스트를 이메일로 받습니다. 언제든
                  1-click 수신거부 가능.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.marketing_consent}
                onChange={(e) => update({ marketing_consent: e.target.checked })}
                disabled={saving}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                <span className="text-body-md text-slate-100 font-medium">
                  마케팅·이벤트 수신 동의 (선택)
                </span>
                <span className="block text-body-sm text-slate-500 mt-0.5">
                  신규 기능, 베타 초대, 이벤트 안내. 위 다이제스트와 별도.
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* 카테고리 우선 */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 mb-6">
          <h2 className="text-heading-md font-pretendard text-slate-50 mb-2">관심 카테고리</h2>
          <p className="text-body-sm text-slate-500 mb-4">
            선택한 카테고리만 우선 표시됩니다. 미선택 시 전체 표시.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const active = prefs.preferred_categories.includes(
                cat as DigestPrefs['preferred_categories'][0],
              )
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  disabled={saving}
                  className={`rounded-md px-3 py-1.5 text-body-sm transition-colors ${
                    active
                      ? 'border border-teal-500 bg-teal-500/10 text-teal-200'
                      : 'border border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* 추가 옵션 — Tier 기반 */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 mb-6">
          <h2 className="text-heading-md font-pretendard text-slate-50 mb-4">옵션</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.include_custom_topics}
                onChange={(e) => update({ include_custom_topics: e.target.checked })}
                disabled={saving}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                <span className="text-body-md text-slate-100 font-medium">
                  내 토픽 매칭 우선 노출
                </span>
                <span className="block text-body-sm text-slate-500 mt-0.5">
                  /account/topics에 등록한 키워드 매칭을 다이제스트 상단에 노출.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.include_frame_clash}
                onChange={(e) => update({ include_frame_clash: e.target.checked })}
                disabled={saving}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                <span className="text-body-md text-slate-100 font-medium">
                  Frame Clash 미니 (Creator+)
                </span>
                <span className="block text-body-sm text-slate-500 mt-0.5">
                  매체간 단어 차이 1건 추가 표시.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.include_intl_translation}
                onChange={(e) => update({ include_intl_translation: e.target.checked })}
                disabled={saving}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                <span className="text-body-md text-slate-100 font-medium">
                  외신 자동 번역 요약 (Leader)
                </span>
                <span className="block text-body-sm text-slate-500 mt-0.5">
                  Reuters/AP/BBC/NYT 한국어 요약 (ADR-019, T-006 합류 후 활성화).
                </span>
              </span>
            </label>
          </div>
        </section>

        <p className="text-body-sm text-slate-500">
          1-click 수신거부 — 발송된 이메일 footer 또는{' '}
          <a
            href={`/api/v1/digest-prefs/unsubscribe?token=${prefs.unsubscribe_token ?? ''}`}
            className="text-teal-300"
          >
            여기
          </a>
          .
        </p>

        <footer className="mt-12 border-t border-slate-800 pt-8 text-body-sm text-slate-500">
          <p>
            본 화면은 P0a UX skeleton입니다. Supabase + 실 사용자 인증은 후속 PR.
            발송 운영은 GHA cron + Resend (`p0a-digest.yml`) 가동.
          </p>
        </footer>
      </div>
    </main>
  )
}
