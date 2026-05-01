/**
 * 크리에이터 Embed 얼리 액세스 폼 (T-W03 / F-P0w-5).
 *
 * site_url + monthly_visitors + topic_interest + optional WTP.
 * Email goes to dedicated route /api/v1/waitlist/creator.
 */

'use client'

import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import {
  CreatorEmbedInputSchema,
  WaitlistResponseSchema,
} from '@/lib/api/waitlist-schemas'
import { track, EVENTS } from '@/lib/analytics/events'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const VISITORS = [
  { value: '<1k', label: '월 1,000 미만' },
  { value: '1k-10k', label: '월 1,000 ~ 1만' },
  { value: '10k-100k', label: '월 1만 ~ 10만' },
  { value: '>100k', label: '월 10만 이상' },
] as const

export function CreatorWaitlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const wtpRaw = String(fd.get('willingness_to_pay') ?? '').trim()
    const raw = {
      email: String(fd.get('email') ?? '').trim(),
      site_url: String(fd.get('site_url') ?? '').trim(),
      monthly_visitors: String(fd.get('monthly_visitors') ?? ''),
      topic_interest: String(fd.get('topic_interest') ?? '').trim(),
      willingness_to_pay: wtpRaw === '' ? undefined : Number(wtpRaw),
    }

    const parsed = CreatorEmbedInputSchema.safeParse(raw)
    if (!parsed.success) {
      setStatus('error')
      setErrorMsg(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/v1/waitlist/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const json: unknown = await res.json().catch(() => ({}))
        const errParsed = z.object({ error: z.string().optional() }).safeParse(json)
        throw new Error(
          errParsed.success ? errParsed.data.error ?? `HTTP ${res.status}` : `HTTP ${res.status}`,
        )
      }
      const json: unknown = await res.json()
      WaitlistResponseSchema.parse(json)
      track(EVENTS.CREATOR_WAITLIST_SUBMITTED, { monthly_visitors_bucket: parsed.data.monthly_visitors })
      setStatus('success')
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorMsg((err as Error).message || '제출에 실패했습니다.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-3 text-body-md">
        <p className="font-medium text-teal-400">얼리 액세스 신청이 접수되었습니다.</p>
        <p className="text-slate-400">
          현재 P0w 단계에서는 무료 무제한 Embed 사용이 가능합니다. Creator Pro tier 출시 시 우선
          안내드립니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-body-sm text-slate-400">
        블로그·뉴스레터·사내 대시보드에 한 줄 임베드로 실시간 이슈 위젯을 추가할 수 있습니다.
        Creator Pro tier는 출시 예정입니다.
      </p>

      <Field label="이메일" htmlFor="creator-email" required>
        <input
          id="creator-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          className="input-base"
        />
      </Field>

      <Field label="사이트 URL" htmlFor="creator-site" required>
        <input
          id="creator-site"
          name="site_url"
          type="url"
          required
          maxLength={500}
          placeholder="https://your-blog.com"
          className="input-base"
        />
      </Field>

      <Field label="월간 방문자 수" htmlFor="creator-visitors" required>
        <select
          id="creator-visitors"
          name="monthly_visitors"
          required
          defaultValue=""
          className="input-base"
        >
          <option value="" disabled>
            선택해주세요
          </option>
          {VISITORS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="관심 주제 (예: 경제·테크·국제)" htmlFor="creator-topic" required>
        <input
          id="creator-topic"
          name="topic_interest"
          type="text"
          required
          maxLength={200}
          placeholder="경제, 테크 트렌드"
          className="input-base"
        />
      </Field>

      <Field
        label="월 부담 가능 금액 (선택, 단위 ₩, 최대 100,000)"
        htmlFor="creator-wtp"
      >
        <input
          id="creator-wtp"
          name="willingness_to_pay"
          type="number"
          min={0}
          max={100000}
          step={1000}
          placeholder="15000"
          className="input-base"
        />
      </Field>

      {status === 'error' && (
        <p role="alert" className="text-body-sm text-rose-400">
          {errorMsg}
        </p>
      )}

      <button type="submit" disabled={status === 'submitting'} className="cta-primary">
        {status === 'submitting' ? '전송 중…' : '얼리 액세스 신청'}
      </button>

      <style>{`
        .input-base { width: 100%; background: rgb(15 23 42); border: 1px solid rgb(51 65 85); border-radius: 8px; padding: 8px 12px; color: rgb(248 250 252); font-size: 14px; }
        .input-base:focus { outline: none; border-color: rgb(20 184 166); }
        .cta-primary { background: rgb(20 184 166); color: rgb(10 14 26); font-weight: 600; padding: 10px 16px; border-radius: 8px; transition: background 150ms; }
        .cta-primary:hover:not(:disabled) { background: rgb(13 148 136); }
        .cta-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-body-sm font-medium text-slate-200">
        {label} {required && <span className="text-rose-400" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  )
}
