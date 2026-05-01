/**
 * B2B / 기업·기관 문의 폼 (T-W03 / F-P0w-6).
 *
 * Posts to /api/v1/waitlist/b2b. Server sends both an inquirer ack
 * and a founder notification.
 */

'use client'

import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import {
  B2BInquiryInputSchema,
  WaitlistResponseSchema,
} from '@/lib/api/waitlist-schemas'
import { track, EVENTS } from '@/lib/analytics/events'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const COMPANY_SIZES = [
  { value: '<10', label: '10명 미만' },
  { value: '10-50', label: '10 ~ 50명' },
  { value: '50-200', label: '50 ~ 200명' },
  { value: '200-1000', label: '200 ~ 1,000명' },
  { value: '>1000', label: '1,000명 이상' },
] as const

const USE_CASES = [
  { value: 'monitoring', label: '실시간 이슈 모니터링 대시보드' },
  { value: 'api_integration', label: 'API 연동 (자체 시스템에 통합)' },
  { value: 'research', label: '연구·리서치 목적 데이터' },
  { value: 'other', label: '기타 (메시지에 기재)' },
] as const

export function B2BInquiryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const raw = {
      email: String(fd.get('email') ?? '').trim(),
      company_name: String(fd.get('company_name') ?? '').trim(),
      contact_name: String(fd.get('contact_name') ?? '').trim(),
      company_size: String(fd.get('company_size') ?? ''),
      use_case: String(fd.get('use_case') ?? ''),
      message: String(fd.get('message') ?? '').trim(),
    }

    const parsed = B2BInquiryInputSchema.safeParse(raw)
    if (!parsed.success) {
      setStatus('error')
      setErrorMsg(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/v1/waitlist/b2b', {
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
      track(EVENTS.B2B_INQUIRY_SUBMITTED, {
        company_size: parsed.data.company_size,
        use_case: parsed.data.use_case,
      })
      if (parsed.data.use_case === 'api_integration') {
        track(EVENTS.API_KEY_REQUESTED, { company_size: parsed.data.company_size })
      }
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
        <p className="font-medium text-teal-400">문의가 접수되었습니다.</p>
        <p className="text-slate-400">
          24시간 안에 회신드리겠습니다. 긴급 문의는 founder@tteuniyu.com 으로 직접 연락 주세요.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-body-sm text-slate-400">
        실시간 이슈 모니터링·API 연동·주간 리포트 등 기업·기관용 활용에 대해 문의해주세요.
        Lite tier(월 ₩100,000~)는 출시 예정입니다.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="회사·기관명" htmlFor="b2b-company" required>
          <input
            id="b2b-company"
            name="company_name"
            type="text"
            required
            maxLength={100}
            className="input-base"
          />
        </Field>
        <Field label="담당자 성함" htmlFor="b2b-contact" required>
          <input
            id="b2b-contact"
            name="contact_name"
            type="text"
            required
            maxLength={50}
            className="input-base"
          />
        </Field>
      </div>

      <Field label="이메일" htmlFor="b2b-email" required>
        <input
          id="b2b-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          className="input-base"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="조직 규모" htmlFor="b2b-size" required>
          <select id="b2b-size" name="company_size" required defaultValue="" className="input-base">
            <option value="" disabled>
              선택해주세요
            </option>
            {COMPANY_SIZES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="활용 목적" htmlFor="b2b-use" required>
          <select id="b2b-use" name="use_case" required defaultValue="" className="input-base">
            <option value="" disabled>
              선택해주세요
            </option>
            {USE_CASES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="메시지 (관심 카테고리·필요 기능 등, 최대 1,000자)" htmlFor="b2b-message" required>
        <textarea
          id="b2b-message"
          name="message"
          rows={5}
          required
          maxLength={1000}
          placeholder="예: 경제·정책 카테고리 실시간 모니터링 + 키워드 알림 필요"
          className="input-base resize-y"
        />
      </Field>

      {status === 'error' && (
        <p role="alert" className="text-body-sm text-rose-400">
          {errorMsg}
        </p>
      )}

      <button type="submit" disabled={status === 'submitting'} className="cta-primary">
        {status === 'submitting' ? '전송 중…' : '문의하기'}
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
