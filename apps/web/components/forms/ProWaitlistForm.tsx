/**
 * Pro 출시 알림 신청 폼 — B2C Pro preorder intent (T-W03 / F-P0w-4).
 *
 * 5-point Likert + optional comment + optional price feedback.
 *
 * Copy guard: every visible string must communicate "Pro 기능은 아직
 * 출시 전" to satisfy assert-monetization-claims (T-W05 partial impl).
 */

'use client'

import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import {
  ProPreorderInputSchema,
  WaitlistResponseSchema,
} from '@/lib/api/waitlist-schemas'
import { track, EVENTS } from '@/lib/analytics/events'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const SCALE = [
  { value: 5, label: '매우 가능' },
  { value: 4, label: '가능' },
  { value: 3, label: '중립' },
  { value: 2, label: '약간 어려움' },
  { value: 1, label: '어려움' },
] as const

const PRICE_FEEDBACK = [
  { value: 'too_cheap', label: '저렴함' },
  { value: 'fair', label: '적정' },
  { value: 'too_expensive', label: '비쌈' },
] as const

export function ProWaitlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const raw = {
      email: String(fd.get('email') ?? '').trim(),
      intent_score: Number(fd.get('intent_score') ?? NaN),
      comment: (fd.get('comment') as string)?.trim() || undefined,
      price_feedback: (fd.get('price_feedback') as string) || undefined,
    }

    const parsed = ProPreorderInputSchema.safeParse(raw)
    if (!parsed.success) {
      setStatus('error')
      setErrorMsg(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/v1/waitlist/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const json: unknown = await res.json().catch(() => ({}))
        const errParsed = z
          .object({ error: z.string().optional() })
          .safeParse(json)
        throw new Error(errParsed.success ? errParsed.data.error ?? `HTTP ${res.status}` : `HTTP ${res.status}`)
      }
      const json: unknown = await res.json()
      WaitlistResponseSchema.parse(json) // throws if shape wrong
      track(EVENTS.PRO_PREORDER_SUBMITTED, { intent_score: parsed.data.intent_score })
      setStatus('success')
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorMsg((err as Error).message || '제출에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-3 text-body-md">
        <p className="font-medium text-teal-400">알림 신청이 접수되었습니다.</p>
        <p className="text-slate-400">
          출시 시점에 안내 메일을 보내드립니다. Pro 기능은 아직 출시 전입니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-body-sm text-slate-400">
        Pro 기능은 아직 출시 전입니다. 출시 알림을 받고 싶은 분만 남겨주세요.
      </p>

      <Field label="이메일" htmlFor="pro-email" required>
        <input
          id="pro-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          className="input-base"
        />
      </Field>

      <Field
        label="월 ₩6,900이면 가입 의향이 있습니까? (출시 예정 가격)"
        htmlFor="pro-intent"
        required
      >
        <div id="pro-intent" className="flex flex-wrap gap-2">
          {SCALE.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-body-sm hover:border-slate-500 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-500/10"
            >
              <input
                type="radio"
                name="intent_score"
                value={opt.value}
                required
                className="sr-only"
              />
              <span className="font-mono">{opt.value}</span>
              <span className="text-slate-400">{opt.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="가격 피드백 (선택)" htmlFor="pro-price">
        <select
          id="pro-price"
          name="price_feedback"
          defaultValue=""
          className="input-base"
        >
          <option value="">선택 안 함</option>
          {PRICE_FEEDBACK.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="한 줄 의견 (선택, 최대 500자)" htmlFor="pro-comment">
        <textarea
          id="pro-comment"
          name="comment"
          rows={3}
          maxLength={500}
          placeholder="원하는 기능, 가격에 대한 의견 등"
          className="input-base resize-y"
        />
      </Field>

      {status === 'error' && (
        <p role="alert" className="text-body-sm text-rose-400">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="cta-primary"
      >
        {status === 'submitting' ? '전송 중…' : '알림 받기'}
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
