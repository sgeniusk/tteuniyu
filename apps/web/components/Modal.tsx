/**
 * Generic modal wrapper using native <dialog>.
 *
 * - ESC closes (browser default)
 * - Click on backdrop closes (manual handler — <dialog>::backdrop click
 *   bubbles to dialog itself when content has its own click target)
 * - `onClose` fires for any close path (ESC, backdrop, programmatic)
 */

'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  describedBy?: string
}

export function Modal({ open, onClose, title, children, describedBy }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Click on the dialog element itself (the backdrop area) — close.
      // Clicks inside .modal-content stop propagation so they don't trigger this.
      if (e.target === ref.current) onClose()
    },
    [onClose],
  )

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
      aria-describedby={describedBy}
      className="m-auto rounded-xl border border-slate-800 bg-slate-900 p-0 text-slate-50 shadow-lg backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div
        className="modal-content flex w-[min(92vw,560px)] flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-baseline justify-between">
          <h2 id="modal-title" className="text-heading-lg font-pretendard text-slate-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-body-sm text-slate-400 hover:bg-slate-800 hover:text-slate-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
