# ADR-007: 제휴 커머스 데이터 경계 (Affiliate Commerce Data Boundary)

| 항목 | 내용 |
|---|---|
| 상태 | Accepted |
| 결정일 | 2026-04-21 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §6.4 4차 데이터 소스, §7.1 F-P0w-8, §9.6 Affiliate Commerce, §11.3.2 |
| 대체 | 해당 없음 (v1.6 신규) |

---

## Context

PRD v1.6은 제휴 커머스를 수익 라인에 추가했다 (쿠팡파트너스·11번가·Amazon Associates). 이 데이터가 어떻게 수집·저장·렌더되는가는 다음 제약과 긴장 관계에 있다.

1. **v1.3 ADR-001 데이터 라이선스 원칙**: 저장·가공이 명시적으로 허가된 1차 데이터(RSS)만 articles·clusters 테이블에 저장. Naver Search API 결과는 저장 금지.
2. **쿠팡파트너스 약관**: 상품 데이터의 장기 저장·재배포 제한, 가격·재고 실시간성 요구, 파트너 ID(lptag) 노출 필수.
3. **v1.6 P12 수익 영역 분리 원칙**: 제휴 링크는 실시간 이슈 카드의 `<AdZone>`에만 렌더. Coverage Distribution 진입 시 자동 비활성화.
4. **JTBD 경계**: 실시간 이슈 위젯의 JTBD-5 (Discovery)는 "이슈 파악 + 선택적 커머스 접근". 이슈 판단 자체에 상품이 섞이면 뜬이유 신뢰 훼손.

질문은 **"제휴 커머스 데이터를 어떤 경계에서 다룰 것인가"** 였다. 특히 저장 가능 여부, 1차 데이터와의 혼합 가능 여부, 자동 매칭 허용 여부가 쟁점.

## Decision

제휴 커머스 데이터를 **4차 런타임 전용 데이터 소스**로 정의하며, 다음 네 가지 경계를 설정한다.

### 경계 1: 저장 절대 금지 (Storage Prohibition)

- 쿠팡·11번가·Amazon API 응답의 상품명·이미지 URL·가격·재고·설명·리뷰 어떤 필드도 Supabase DB에 저장 금지
- `articles`·`clusters`·`trends`·`summaries`·`og_cards` 테이블에 제휴 상품 데이터 INSERT 금지
- 새 테이블 `affiliate_links` 또는 `products` 생성 금지
- 런타임 Next.js API 라우트에서 쿠팡 API 호출 → 응답 즉시 클라이언트 전달 → 서버 메모리에서 해제
- Vercel Edge Cache 등 캐시 레이어 사용 금지 (실시간성 + 저장 금지 동시 만족)

### 경계 2: 1차 데이터 혼합 금지 (Source Segregation)

- 쿠팡 상품명·키워드를 RSS 기사 요약·제목에 주입 금지
- 제휴 상품을 clusters 엔티티로 변환 시도 금지
- OG 카드·Coverage Distribution Bar·방법론 문서에 제휴 데이터 참조 금지
- 임베딩 벡터 계산 시 제휴 상품명을 입력 corpus에 포함 금지

### 경계 3: 수동 큐레이션 우선 (Manual Curation First)

- **P0w~P0b**: 태욱이 `config/affiliate_manual_curation.yaml`에 하루 1회 수동 엔트리 추가. 예: "전세 사기 이슈 → 가전 X" 같은 키워드 매칭 금지, "아이폰 출시 이슈 → 아이폰 케이스" 같은 명백한 매칭만 허용
- **V0.5**: LLM 기반 자동 매칭 검토 가능하되 "이슈 성격 감수성 검사" 필터 통과 시에만. 필터 예: 정치·사고·재해·선거·의료 카테고리는 자동 매칭 배제
- **V1+**: 자동 매칭 정식 채용 여부는 V0.5 결과 + 법무 자문 후 재결정

### 경계 4: 런타임 호출 경로 명확화 (Runtime Call Path)

```
Client /widget Page
  └─ <AffiliateCard partner="coupang" issue_keyword="아이폰 출시">
       └─ Server Action `fetchAffiliateProduct(partner, keyword)`
            └─ Next.js API /api/v1/affiliate/lookup?partner=coupang&keyword=...
                 └─ Coupang Open API (server-side, no storage)
                 └─ Response → serialize → return → hold in memory for ≤1s
       ← { title, image_placeholder, affiliate_url_with_lptag, label }
  → Render <AffiliateCard>
  ← User click → window.open(affiliate_url)
     → PostHog capture `affiliate_link_clicked`
```

### 허용 저장 데이터 (제휴 관련)

- `config/affiliate_manual_curation.yaml`: 운영자가 등록한 큐레이션 (키워드·파트너·URL·valid_until만)
- `analytics_events` (PostHog): `affiliate_link_clicked`, `ad_clicked` 이벤트 카운트 (개인 식별 정보 제외)
- `admin_audit_logs`: 큐레이션 등록/삭제 기록

### 금지 저장 데이터 (제휴 관련)

- 쿠팡 상품명·가격·이미지·재고·리뷰
- 쿠팡 검색 결과 배열
- 사용자별 제휴 링크 클릭 이력 (userID와 연결되지 않는 익명 카운트만)
- 쿠팡 API 응답의 raw JSON 로그 (debug 시에도 금지)

## Consequences

### Positive

- **라이선스 리스크 차단**: 쿠팡파트너스 약관 위반 소지 원천 차단 (저장 금지)
- **신뢰 포지셔닝 보호**: 제휴 데이터가 Coverage Distribution·방법론 영역과 섞일 경로 없음
- **법무 단순화**: "제휴 데이터 저장 없음"은 단 한 문장으로 공개 가능, 쿠팡·Amazon 약관 해석 분쟁 회피
- **이슈 성격 감수성 방어**: 수동 큐레이션 원칙이 "전세 사기 → 가전" 같은 부적절 매칭 방지
- **CI 자동화**: `assert-affiliate-link-provenance.ts`가 저장 시도 탐지

### Negative

- **런타임 레이턴시**: 제휴 API 호출이 매 요청 발생 → 클라이언트 응답 지연 (p95 +200ms 예상)
- **API 호출 비용**: 쿠팡 Open API 호출량 증가 (단, 현재 무료 쿼터 내 충분)
- **운영 부담**: 하루 1회 수동 큐레이션이 태욱의 지속 가능한 부담인가? (Q-42)
- **자동 매칭 지연**: V0.5까지 자동 매칭 금지로 제휴 수익 상한

### Neutral

- Creator Embed의 제휴 기능: Embed에서도 동일 경계 적용. Embed 위젯이 외부 사이트에서 렌더될 때도 저장·캐시 금지
- API Access의 제휴 포함 여부: API Access는 raw 데이터 제공이므로 제휴 링크는 포함하지 않음 (분리 원칙)

## Alternatives Considered

### Alt-A: 제휴 상품 정보를 DB 캐시 (성능 우선)
- **Pro**: 런타임 레이턴시 감소
- **Con**: 쿠팡 약관 위반 위험, 저장 범위 규정 모호 → 법무 분쟁 소지
- **Reject**: 라이선스 명확성이 성능보다 우선

### Alt-B: 모든 매칭을 자동화 (LLM 임베딩 기반)
- **Pro**: 운영자 개입 최소화, 확장성 우수
- **Con**: "전세 사기 → 자취 가전" 같은 부적절 매칭 위험, 신뢰 훼손 가능
- **Reject**: P0w~P0b 단계에서는 통제된 수동 큐레이션으로 시작

### Alt-C: 제휴 커머스 완전 제외 (수익 포기)
- **Pro**: 가장 안전한 포지셔닝
- **Con**: 사용자 수익화 의사 불충족, V0.5까지 Pro/B2B 외 수익 다각화 불가
- **Reject**: 수익 다각화 필요성 고려

### Alt-D: 제휴 링크를 별도 도메인·서브도메인에 분리 (`shop.tteuniyu.com`)
- **Pro**: 가장 엄격한 분리
- **Con**: 사용자 동선 왜곡, CTR 대폭 하락, 운영 복잡도 증가
- **Reject**: P12 수익 영역 분리 원칙이 이미 UI·API·CI 계층에서 강제하므로 도메인 분리는 과도

**결론**: **4차 런타임 전용 + 수동 큐레이션 + 저장 금지**가 수익성·법무 리스크·신뢰 포지셔닝 세 축 균형.

## Verification

- [ ] `harness/checks/assert-affiliate-link-provenance.ts` 작성 (Sprint 0)
- [ ] `config/affiliate_manual_curation.yaml` 스키마 정의 (Zod)
- [ ] `apps/web/app/api/v1/affiliate/lookup/route.ts` 구현 시 DB insert 경로 부재 확인
- [ ] 고의적 반례: 쿠팡 응답을 `articles` 테이블에 INSERT 시도 → Harness fail 확인
- [ ] 쿠팡파트너스 계정 가입 + lptag 발급 (P0w 착수 전)
- [ ] Legal 자문: 전자상거래법 표시 의무 문구 확정 (Q-45)
- [ ] 이슈 성격 감수성 카테고리 목록 정의 (V0.5 자동 매칭 착수 전)

## Open Questions

- **Q-42**: 수동 큐레이션 하루 1회 운영 지속성 — P0w 중 실측
- **Q-45**: 표시광고법·전자상거래법 공시 의무 정확한 문구 — D+7 법무 자문
- **쿠팡파트너스 월 정산 하한**: 월 최소 수익 하한 미달 시 정산 연기 정책 확인 필요
- **Amazon Associates 국내 사용 가능 여부**: V0.5 해외 이슈 대응 시 가입 필요

## References

- PRD v1.6 §6.4 4차 데이터 소스 (제휴 커머스 런타임 API)
- PRD v1.6 §7.1 F-P0w-8 `<AdZone>` 컴포넌트 + 수동 큐레이션
- PRD v1.6 §9.6 Affiliate Commerce 수익 모델
- PRD v1.6 §11.3.2 `assert-affiliate-link-provenance.ts`
- ADR-001 Data Licensing (v1.3) — 저장 가능 데이터 원칙 (본 ADR에서 확장)
- ADR-005 Ad Zone Separation — 렌더 영역 경계 (본 ADR은 데이터 경계)

---

## Amendment 1 (2026-05-10, P0w D7+2) — 변호사 자문 반영

> **Status**: Accepted
> **Decider**: 태욱 (Founder)
> **Driving source**: `docs/legal/2026-05-10-legal-response-opinion.md` §3 (line 312-381)
> **근거 법령**: 표시광고법 §3, 전자상거래법 §13, 공정거래위원회 추천·보증 광고 기준 (2024-12-01 시행)

### A1.1 표시 문구 강화 (의견서 §3.1)

기존 — "이 카드는 제휴 링크입니다 (쿠팡 파트너스)"

신규 표준 — "광고/제휴 링크 안내 — 이 카드를 통해 상품을 구매하면 뜬이유는 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다."

### A1.2 표시 위치 — Multi-touchpoint (의견서 §3.2)

카드 하단만으로 약함. 다음 3 위치에 동시 표시.

| 위치 | 표기 |
|---|---|
| **카드 상단 라벨** | "광고·제휴" (배지 형태) |
| **CTA 버튼 근처** | 수수료 문구 ("쿠팡 파트너스 활동의 일환으로 수수료 제공받을 수 있음") |
| **카드 하단** | 제휴 플랫폼명 + 외부 쇼핑몰 이동 안내 |

hover tooltip 또는 약관 내부에만 숨기는 방식 절대 X.

### A1.3 민감 카테고리 자동 제외 — 5개 → 18+개 (의견서 §3.5)

기존 자동 제외 5개.
- 정치 / 선거 / 사고 / 재해 / 의료

추가 13개 (의견서 권고).
- 종교·이단·사이비
- 성범죄·아동·학교폭력·미성년자
- 사망·자살·실종
- 금융·투자·보험·대출·가상자산
- 부동산·전세·임대차 분쟁
- 노동쟁의·파업·산재
- 법적 분쟁·수사·재판
- 외교·국방·안보
- 젠더·혐오·차별
- 공중보건·감염병

총 **18+ 카테고리** 자동 제외 (자동 매칭 X, 수동 큐레이션도 비노출).

### A1.4 affiliate_url 처리 보강 (의견서 §3.4)

추가 권고.
- 링크 cloaking 금지
- shortener 금지
- 자체 tracking parameter 추가 금지
- raw affiliate API payload 저장 금지 (기존 §Storage Prohibition과 정합)
- 클릭 로그 최소 정보만 (timestamp + cluster_id + offer_id, IP/UA X)
- 외부 쇼핑몰 이동 고지

### A1.5 시각 강조 제한 (의견서 §3.3)

상품 카드가 분석 카드보다 시각적으로 더 강조되지 않도록 제한.
- 상품 카드 폰트 크기 ≤ 분석 카드
- 상품 카드 보더 굵기 ≤ 분석 카드
- 상품 카드 배경 색상 — 베이스(slate-900)와 동등 또는 약간 흐림

### A1.6 harness 갱신 (PR #19 또는 Sprint 0)

`harness:affiliate-link-provenance` 추가 검사.
- multi-touchpoint 표시 검증 — `<AffiliateCard>`가 상단 라벨 + CTA 근처 + 하단 모두에 표시
- 18+ 민감 카테고리 자동 제외 검증 — 카테고리 매칭 시 `is_affiliate_blocked=true`

### A1.7 영향 받는 코드

| 대상 | 변경 |
|---|---|
| `apps/web/components/AffiliateCard.tsx` | Multi-touchpoint 표시 (상단 라벨 + CTA + 하단) |
| `apps/web/lib/affiliate/curation.ts` | 18+ 민감 카테고리 자동 차단 검증 추가 |
| `config/affiliate_manual_curation.yaml` | 18+ 카테고리 운영자 가이드 + 차단 사유 기록 필드 |
| `harness/checks/assert-affiliate-link-provenance.ts` | A1.6 신규 검사 |

**End of Amendment 1 — 2026-05-10**
