/**
 * YouTubeEmbed — Lite YouTube Embed pattern (v1.6.5).
 *
 * Initial render: thumbnail only (one image fetch). On click, replace
 * with iframe + autoplay using youtube-nocookie.com (no cookies set
 * until activated → first paint stays under PIPA-friendly defaults).
 *
 * Bundle impact: 0KB additional deps. Saves ~80KB+ of YouTube SDK on
 * detail pages where the user never plays the video.
 *
 * Fallback: if the YouTube CDN thumbnail fails (placeholder video_id
 * in P0w mock), the component renders a slate panel with channel name
 * + ▶ overlay so visual checks still verify the layout.
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface YouTubeEmbedProps {
  videoId: string
  title: string
  channel: string
  className?: string
}

export function YouTubeEmbed({ videoId, title, channel, className }: YouTubeEmbedProps) {
  const [activated, setActivated] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  const iframeUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-lg border border-slate-800 bg-slate-900',
        className,
      )}
    >
      <div className="aspect-video w-full">
        {activated ? (
          <iframe
            src={iframeUrl}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="origin"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`${title} — ${channel} 영상 재생`}
            className="group relative block h-full w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {thumbFailed ? (
              <FallbackThumb channel={channel} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                onError={() => setThumbFailed(true)}
              />
            )}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 shadow-lg transition-transform group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 h-6 w-6 text-white"
                  aria-hidden="true"
                  role="presentation"
                >
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-body-sm">
        <span className="line-clamp-1 flex-1 text-slate-200">{title}</span>
        <span className="shrink-0 text-slate-500">{channel}</span>
      </figcaption>
    </figure>
  )
}

function FallbackThumb({ channel }: { channel: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900">
      <span aria-hidden="true" className="text-mono-lg text-slate-600">
        ▶
      </span>
      <span className="text-body-sm text-slate-500">{channel}</span>
      <span className="text-body-sm text-slate-600">P0w mock 영상 자리</span>
    </div>
  )
}
