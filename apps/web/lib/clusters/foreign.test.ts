// 외신 소스 판별 — 단위 테스트

import { describe, expect, it } from 'vitest'

import { FOREIGN_SOURCE_SLUGS, hasDomesticCoverage, isForeignSource } from './foreign'

describe('isForeignSource', () => {
  it('외신 6개 slug는 모두 외신으로 판별', () => {
    for (const slug of ['reuters', 'ap', 'bbc', 'nyt', 'bloomberg', 'nikkei']) {
      expect(isForeignSource(slug)).toBe(true)
    }
  })

  it('국내 매체 slug는 외신이 아님', () => {
    for (const slug of ['hani', 'chosun', 'kbs', 'yonhap', 'mk']) {
      expect(isForeignSource(slug)).toBe(false)
    }
  })

  it('미등록 slug는 외신이 아님 (국내로 간주)', () => {
    expect(isForeignSource('unknown-source')).toBe(false)
  })
})

describe('hasDomesticCoverage', () => {
  it('국내 매체가 1건이라도 있으면 true', () => {
    expect(hasDomesticCoverage(['bbc', 'hani'])).toBe(true)
    expect(hasDomesticCoverage(['kbs'])).toBe(true)
  })

  it('외신 매체만으로 구성되면 false (외신 단독 클러스터)', () => {
    expect(hasDomesticCoverage(['bbc', 'nyt', 'bloomberg'])).toBe(false)
    expect(hasDomesticCoverage(['reuters'])).toBe(false)
  })

  it('기사 source slug가 없으면 false (판별 불가 → 외신 단독으로 간주 안 함은 호출부 책임)', () => {
    expect(hasDomesticCoverage([])).toBe(false)
  })
})

describe('FOREIGN_SOURCE_SLUGS', () => {
  it('whitelist 외신 6개와 정확히 일치', () => {
    expect(FOREIGN_SOURCE_SLUGS.size).toBe(6)
  })
})
