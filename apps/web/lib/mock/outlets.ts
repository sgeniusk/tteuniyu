/**
 * Mock 매체 풀 — v1.6.3 patch.
 *
 * 30 outlets across 4 stances (progressive / mixed / conservative / foreign).
 * Mock version of P0a's `config/sources_whitelist.yaml` (T-003 ADR-001).
 *
 * Stance assignment is illustrative only. Real ingestion uses
 * AllSides + Ad Fontes mapping (P0a, T-003) and is INTERNAL ONLY —
 * never exposed via public API as a per-outlet score (CLAUDE.md rule 4).
 * The aggregate Coverage Distribution is the only public surface.
 */

import type { z } from 'zod'

export type OutletStance = 'progressive' | 'mixed' | 'conservative' | 'foreign'

export interface Outlet {
  slug: string
  name: string
  stance: OutletStance
  base_url: string
}

export const OUTLETS: readonly Outlet[] = [
  // Progressive
  { slug: 'hani', name: '한겨레', stance: 'progressive', base_url: 'https://www.hani.co.kr' },
  { slug: 'kyunghyang', name: '경향신문', stance: 'progressive', base_url: 'https://www.khan.co.kr' },
  { slug: 'ohmynews', name: '오마이뉴스', stance: 'progressive', base_url: 'https://www.ohmynews.com' },
  { slug: 'pressian', name: '프레시안', stance: 'progressive', base_url: 'https://www.pressian.com' },
  { slug: 'mediatoday', name: '미디어오늘', stance: 'progressive', base_url: 'https://www.mediatoday.co.kr' },

  // Mixed (broadcast / wire / centrist)
  { slug: 'kbs', name: 'KBS', stance: 'mixed', base_url: 'https://news.kbs.co.kr' },
  { slug: 'mbc', name: 'MBC', stance: 'mixed', base_url: 'https://imnews.imbc.com' },
  { slug: 'sbs', name: 'SBS', stance: 'mixed', base_url: 'https://news.sbs.co.kr' },
  { slug: 'yonhap', name: '연합뉴스', stance: 'mixed', base_url: 'https://www.yna.co.kr' },
  { slug: 'newsis', name: '뉴시스', stance: 'mixed', base_url: 'https://www.newsis.com' },
  { slug: 'hankook', name: '한국일보', stance: 'mixed', base_url: 'https://www.hankookilbo.com' },
  { slug: 'seoul', name: '서울신문', stance: 'mixed', base_url: 'https://www.seoul.co.kr' },
  { slug: 'segye', name: '세계일보', stance: 'mixed', base_url: 'https://www.segye.com' },
  { slug: 'munhwa', name: '문화일보', stance: 'mixed', base_url: 'https://www.munhwa.com' },

  // Conservative
  { slug: 'chosun', name: '조선일보', stance: 'conservative', base_url: 'https://www.chosun.com' },
  { slug: 'joongang', name: '중앙일보', stance: 'conservative', base_url: 'https://www.joongang.co.kr' },
  { slug: 'donga', name: '동아일보', stance: 'conservative', base_url: 'https://www.donga.com' },
  { slug: 'jtbc', name: 'JTBC', stance: 'conservative', base_url: 'https://news.jtbc.co.kr' },
  { slug: 'channel-a', name: '채널A', stance: 'conservative', base_url: 'https://www.ichannela.com' },
  { slug: 'tvchosun', name: 'TV조선', stance: 'conservative', base_url: 'https://news.tvchosun.com' },
  { slug: 'mbn', name: 'MBN', stance: 'conservative', base_url: 'https://www.mbn.co.kr' },
  { slug: 'maeil', name: '매일경제', stance: 'conservative', base_url: 'https://www.mk.co.kr' },
  { slug: 'hankyung', name: '한국경제', stance: 'conservative', base_url: 'https://www.hankyung.com' },
  { slug: 'mt', name: '머니투데이', stance: 'conservative', base_url: 'https://www.mt.co.kr' },

  // Foreign
  { slug: 'reuters', name: 'Reuters', stance: 'foreign', base_url: 'https://www.reuters.com' },
  { slug: 'ap', name: 'Associated Press', stance: 'foreign', base_url: 'https://apnews.com' },
  { slug: 'bbc', name: 'BBC', stance: 'foreign', base_url: 'https://www.bbc.com/news' },
  { slug: 'nyt', name: 'The New York Times', stance: 'foreign', base_url: 'https://www.nytimes.com' },
  { slug: 'bloomberg', name: 'Bloomberg', stance: 'foreign', base_url: 'https://www.bloomberg.com' },
  { slug: 'nikkei', name: '日経新聞', stance: 'foreign', base_url: 'https://www.nikkei.com' },
] as const

const BY_SLUG = new Map(OUTLETS.map((o) => [o.slug, o]))

export function findOutlet(slug: string): Outlet | undefined {
  return BY_SLUG.get(slug)
}
