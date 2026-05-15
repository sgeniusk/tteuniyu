// 키워드 입력 검증 — 변호사 권고 hard-block 40+ 단어 (TS port)
//
// Python apps/worker/src/tteuniyu_worker/llm_validator.py의 TS port.
// 클라이언트에서 입력 즉시 검증 + 서버에서 재검증 (defense in depth).

// 변호사 권고 — Hard block 40+ 단어 (CLAUDE.md Naming Ban v1.7.2)
export const INVESTMENT_BANNED_KO = new Set<string>([
  // 투자행동성
  '매수', '매도', '보유', '진입', '청산',
  '비중확대', '비중축소', '손절', '익절', '물타기', '관망',
  // 가격·수익성
  '목표가', '수익률', '상승 여력', '하락 위험',
  '급등', '급락', '반등', '조정', '상방', '하방',
  // 가치판단성
  '호재', '악재', '저평가', '고평가', '유망',
  '모멘텀', '리레이팅', '촉매',
  // 기타 가치판단
  '예측', '추천', '전망',
])

export const INVESTMENT_BANNED_EN = new Set<string>([
  'buy', 'sell', 'hold', 'overweight', 'underweight',
  'outperform', 'underperform', 'target price',
  'upside', 'downside', 'alpha',
])

// 분류 키워드 (ADR-009 Amendment 1)
export const CLASSIFICATION_BANNED = new Set<string>([
  'stance', 'ideology', 'ideological', 'leaning',
  'left-leaning', 'right-leaning', 'left-wing', 'right-wing',
  '보수 매체', '진보 매체', '중도 매체', '공영 매체',
  '이념 분류', '이념 분포', '성향 분류', '진영 라벨',
  '좌파 매체', '우파 매체',
])

export const VALIDATOR_VERSION = 'v1.7.2-lawyer-hardblock-2026-05-12'

export type KeywordValidationResult = {
  accepted: boolean
  reason?: string
  blockedTerms: string[]
}

/** 키워드 입력 검증 — ADR-018 §2.2 + 변호사 §1.3. */
export function validateKeyword(rawKeyword: string): KeywordValidationResult {
  const keyword = rawKeyword.trim()

  if (!keyword) {
    return { accepted: false, reason: '빈 키워드', blockedTerms: [] }
  }
  if (keyword.length > 40) {
    return { accepted: false, reason: '40자 초과', blockedTerms: [] }
  }

  const blocked: string[] = []
  const lower = keyword.toLowerCase()

  // 한글 — substring
  for (const word of INVESTMENT_BANNED_KO) {
    if (keyword.includes(word)) blocked.push(word)
  }

  // 영문 — word boundary
  for (const word of INVESTMENT_BANNED_EN) {
    const pattern = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (pattern.test(lower)) blocked.push(word)
  }

  // 분류 키워드
  for (const word of CLASSIFICATION_BANNED) {
    if (keyword.includes(word) || lower.includes(word.toLowerCase())) blocked.push(word)
  }

  if (blocked.length > 0) {
    return {
      accepted: false,
      reason:
        '투자 판단성 또는 분류 단어가 포함되어 있습니다. 사실 추적 키워드로 변경해 주세요.',
      blockedTerms: Array.from(new Set(blocked)).sort(),
    }
  }

  return { accepted: true, blockedTerms: [] }
}
