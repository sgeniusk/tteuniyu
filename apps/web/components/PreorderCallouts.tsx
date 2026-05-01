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

type Modal = 'pro' | 'creator' | 'b2b' | null

const CARDS = [
  {
    id: 'pro' as const,
    title: '개인용 Pro',
    description: '키워드 알림 · 개인 미디어 다이어트 · 광고 없음',
    cta: 'Pro 출시 알림 받기',
  },
  {
    id: 'creator' as const,
    title: '크리에이터 Embed',
    description: '블로그·뉴스레터에 한 줄 임베드로 실시간 이슈 공유',
    cta: '얼리 액세스 신청',
  },
  {
    id: 'b2b' as const,
    title: '기업·기관',
    description: '실시간 모니터링 대시보드 · API · 주간 리포트',
    cta: '문의하기',
  },
] as const

const MODAL_TITLES: Record<Exclude<Modal, null>, string> = {
  pro: 'Pro 출시 알림 받기',
  creator: '크리에이터 Embed 얼리 액세스',
  b2b: '기업·기관 문의',
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
            className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-body-sm text-slate-400"
          >
            <h3 className="text-body-lg font-medium text-slate-50">{card.title}</h3>
            <p>{card.description}</p>
            <button
              type="button"
              onClick={() => handleOpen(card.id)}
              className="self-start text-teal-500 hover:underline"
            >
              {card.cta} <span aria-hidden="true">→</span>
            </button>
            <p className="text-slate-500">출시 예정</p>
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
