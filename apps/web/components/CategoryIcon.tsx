/**
 * CategoryIcon — 7-enum 카테고리 SVG 아이콘 (Concept C 디자인, 2026-05-10).
 *
 * Claude Design (claude.ai/design) widget-concepts.html에서 가져온 inline SVG.
 * 카드의 rank column에 12px 사이즈로 들어가 카테고리를 시각화.
 *
 * Hover 시 색상이 teal로 전환 (parent가 color prop으로 제어).
 *
 * 7-enum 매핑.
 *  - economy        → bar chart
 *  - tech_science   → chip with leads
 *  - society        → people
 *  - international  → globe (위선·자오선)
 *  - politics       → building (기둥 + 지붕)
 *  - lifestyle      → sun (8방향 방사)
 *  - culture_sports → star
 *
 * Schema와 정합 — `apps/web/lib/api/widget-schemas.ts` CategorySchema.
 */

import type { Category } from '@/lib/api/widget-schemas'

interface CategoryIconProps {
  category: Category
  size?: number
  color?: string
  /** Optional className for additional styling (e.g. transition). */
  className?: string
}

export function CategoryIcon({
  category,
  size = 12,
  color = 'currentColor',
  className,
}: CategoryIconProps) {
  const s = size
  const c = color
  const sharedProps = { width: s, height: s, viewBox: '0 0 12 12', fill: 'none' as const }

  switch (category) {
    case 'economy':
      return (
        <svg {...sharedProps} className={className} aria-label="경제">
          <rect x="0.5" y="7" width="2.8" height="4.5" rx="0.4" fill={c} />
          <rect x="4.6" y="4.5" width="2.8" height="7" rx="0.4" fill={c} />
          <rect x="8.7" y="1.5" width="2.8" height="10" rx="0.4" fill={c} />
        </svg>
      )

    case 'tech_science':
      return (
        <svg {...sharedProps} className={className} aria-label="IT·과학">
          <rect x="2" y="2" width="8" height="8" rx="1" stroke={c} strokeWidth="1.2" />
          <rect x="4.5" y="4.5" width="3" height="3" fill={c} rx="0.4" />
          <line x1="6" y1="0" x2="6" y2="2" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="6" y1="10" x2="6" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="0" y1="6" x2="2" y2="6" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="6" x2="12" y2="6" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )

    case 'society':
      return (
        <svg {...sharedProps} className={className} aria-label="사회">
          <circle cx="4" cy="3.5" r="2.2" stroke={c} strokeWidth="1.2" />
          <path
            d="M0.5 11c0-2 1.5-3.8 3.5-3.8S7.5 9 7.5 11"
            stroke={c}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="9.5" cy="4" r="1.6" stroke={c} strokeWidth="1.1" />
          <path
            d="M7.5 11c.3-1.6 1.2-2.8 2.5-2.8"
            stroke={c}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'international':
      return (
        <svg {...sharedProps} className={className} aria-label="국제">
          <circle cx="6" cy="6" r="5" stroke={c} strokeWidth="1.2" />
          <ellipse cx="6" cy="6" rx="2.2" ry="5" stroke={c} strokeWidth="1.1" />
          <line x1="1" y1="6" x2="11" y2="6" stroke={c} strokeWidth="1.1" />
          <line x1="1.8" y1="3.5" x2="10.2" y2="3.5" stroke={c} strokeWidth="0.8" />
          <line x1="1.8" y1="8.5" x2="10.2" y2="8.5" stroke={c} strokeWidth="0.8" />
        </svg>
      )

    case 'politics':
      return (
        <svg {...sharedProps} className={className} aria-label="정치">
          <rect x="0.5" y="10.5" width="11" height="1.5" rx="0.3" fill={c} />
          <rect x="2.5" y="5" width="1.5" height="5.5" rx="0.3" fill={c} />
          <rect x="5.25" y="5" width="1.5" height="5.5" rx="0.3" fill={c} />
          <rect x="8" y="5" width="1.5" height="5.5" rx="0.3" fill={c} />
          <path d="M1 5.5h10L6 1Z" fill={c} />
        </svg>
      )

    case 'lifestyle':
      return (
        <svg {...sharedProps} className={className} aria-label="라이프">
          <circle cx="6" cy="6" r="1.8" fill={c} />
          {[
            [6, 0.5, 6, 3],
            [6, 9, 6, 11.5],
            [0.5, 6, 3, 6],
            [9, 6, 11.5, 6],
            [2.2, 2.2, 3.8, 3.8],
            [8.2, 8.2, 9.8, 9.8],
            [9.8, 2.2, 8.2, 3.8],
            [3.8, 8.2, 2.2, 9.8],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={c}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          ))}
        </svg>
      )

    case 'culture_sports':
      return (
        <svg {...sharedProps} className={className} aria-label="문화·스포츠">
          <polygon
            points="6,0.5 7.4,4.2 11.5,4.2 8.2,6.8 9.4,10.8 6,8.2 2.6,10.8 3.8,6.8 0.5,4.2 4.6,4.2"
            stroke={c}
            strokeWidth="1.1"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
      )

    default: {
      // Exhaustive check — if Category gets a new enum, TS will complain.
      const _exhaustive: never = category
      return <span style={{ width: s, height: s, display: 'inline-block' }} aria-hidden="true" />
    }
  }
}
