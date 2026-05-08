/**
 * Three-up preorder callouts on /widget footer (T-W03).
 *
 * Each card opens a modal hosting the corresponding form.
 * Fires `pricing_cta_clicked` on open.
 *
 * Copy guard: every CTA mentions 출시 예정 / 알림 받기 / 얼리 액세스 /
 * 문의하기 — never claims "available now" (assert-monetization-claims).
 */

'use client'

import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { ProWaitlistForm } from '@/components/forms/ProWaitlistForm'
import { CreatorWaitlistForm } from '@/components/forms/CreatorWaitlistForm'
import { B2BInquiryForm } from '@/components/forms/B2BInquiryForm'
import { track, EVENTS } from '@/lib/analytics/events'
import { cn } from '@/lib/utils'

type Modal = 'pro' | 'creator' | 'b2b' | null

// ADR-010 (Issue Risk OS positioning) + ADR-011 (3-tier subscription) copy
// Creator is the conversion sweet spot — visually highlighted via `featured`.
const CARDS = [
  {
    id: 'pro' as const,
    title: 'Pro · $4.99/월',
    description: '광고 없음 · AI 분석 10건/일 · 키워드 알림 5개',
    cta: 'Pro 출시 알림 받기',
    featured: false,
  },
  {
    id: 'creator' as const,
    title: 'Creator · $9.99/월',
    description: '소재 100건/일 · Embed 무제한 · 워터마크 제거 — 콘텐츠 크리에이터에 최적',
    cta: '얼리 액세스 신청',
    featured: true,
  },
  {
    id: 'b2b' as const,
    title: 'Leader · $19.99/월',
    description: '무제한 분석 · API · Slack 자동 발송 · 기업·기관용',
    cta: '기업·기관 문의',
    featured: false,
  },
] as const

const MODAL_TITLES: Record<Exclude<Modal, null>, string> = {
  pro: 'Pro $4.99 — 출시 알림 받기',
  creator: 'Creator $9.99 — 얼리 액세스 신청',
  b2b: 'Leader $19.99 / Enterprise — 기업·기관 문의',
}

export function PreorderCallouts() {
  const [open, setOpen] = useState<Modal>(null)

  function handleOpen(id: Exclude<Modal, null>) {
    track(EVENTS.PRICING_CTA_CLICKED, { plan_type: id })
    setOpen(id)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className={cn(
              'relative flex flex-col gap-2 rounded-lg border p-4 text-body-sm',
              card.featured
                ? 'border-teal-500/40 bg-teal-500/5 text-slate-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400',
            )}
          >
            {card.featured && (
              <span className="absolute -top-2 right-3 rounded-sm bg-teal-500 px-2 py-0.5 font-mono text-body-sm text-slate-950">
                이번 달 가장 인기
              </span>
            )}
            <h3 className="text-body-lg font-medium text-slate-50">{card.title}</h3>
            <p>{card.description}</p>
            <button
              type="button"
              onClick={() => handleOpen(card.id)}
              className={cn(
                'self-start hover:underline',
                card.featured ? 'text-teal-300' : 'text-teal-500',
              )}
            >
              {card.cta} <span aria-hidden="true">→</span>
            </button>
            <p className="text-slate-500">출시 예정 — 알림 받기 / 얼리 액세스</p>
          </div>
        ))}
      </div>

      <Modal open={open === 'pro'} onClose={() => setOpen(null)} title={MODAL_TITLES.pro}>
        <ProWaitlistForm onSuccess={() => setTimeout(() => setOpen(null), 4000)} />
      </Modal>

      <Modal
        open={open === 'creator'}
        onClose={() => setOpen(null)}
        title={MODAL_TITLES.creator}
      >
        <CreatorWaitlistForm onSuccess={() => setTimeout(() => setOpen(null), 4000)} />
      </Modal>

      <Modal open={open === 'b2b'} onClose={() => setOpen(null)} title={MODAL_TITLES.b2b}>
        <B2BInquiryForm onSuccess={() => setTimeout(() => setOpen(null), 4000)} />
      </Modal>
    </>
  )
}
