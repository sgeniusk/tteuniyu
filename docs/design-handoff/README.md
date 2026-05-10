# 뜬이유 디자인 외주 핸드오프 — 시작 안내

> **수신**: 외주 디자이너·디자인 팀
> **발신**: 김태욱 (Founder, sgeniusk@gmail.com)
> **작성일**: 2026-05-09 (P0w D7+1)
> **단계**: P0a 진입 직전 (실 사용자 0, mock 데이터 운영)

---

## 1. 5분 안에 알 수 있는 핵심

**뜬이유 (TTEUN-IYU)** — "지금 뜨는 이유"를 한 문장으로 알려주는 한국 이슈 리스크 OS.

- **타겟 #1** — 콘텐츠 크리에이터 (1인 뉴스레터·유튜버)
- **포지셔닝** — "뉴스 앱"이 아니라 **"이슈 OS"** (소재·리스크·조사 도구)
- **수익 모델** — Free + 코인 충전 + Pro $4.99 / Creator $9.99 / Leader $19.99 구독
- **시각 정체성** — 다크 테마(slate-950) + teal 강조 + Pretendard + JetBrains Mono
- **현재 단계** — web 위젯 + 임베드 스크립트 + 클러스터 분석 detail 페이지 동작

**주의** — 본 서비스는 정치 분류·매체 이념 라벨을 **완전 폐기**했다 (ADR-009 Amendment 1 / ADR-015). 좌/우 색 일체 사용 금지.

---

## 2. 이 폴더의 구성

| 파일 | 무엇이 들어 있나 | 누가 먼저 봐야 하나 |
|---|---|---|
| `README.md` (이 파일) | 시작 안내 + 작업 순서 | 모든 디자이너 (5분) |
| `design-brief.md` | 메인 문서 — 제품 컨텍스트 + 페르소나 + JTBD + 디자인 토큰 + 컴포넌트 + 화면 + 비협상 제약 + 산출물 | 메인 디자이너 (60분 정독) |
| `surface-checklist.md` | 모든 surface (페이지·상태) 체크리스트 + Trust Tag 색·표시 위치 + 자본시장법 고지 표준 문구 | 디자이너·QA (작업 진행하며 참조) |

---

## 3. 첫날 권장 액션 (디자이너용)

```bash
# 1. 저장소 클론 (private repo 권한 필요 — 김태욱에게 GitHub 사용자명 공유)
gh repo clone sgeniusk/tteuniyu
cd tteuniyu

# 2. 의존성 설치 + 개발 서버 실행 (Node 20 + pnpm 필요)
pnpm install
cd apps/web && pnpm exec next dev --port 3001
# → http://localhost:3001 (mock 데이터로 모든 화면 동작)
```

**브라우저에서 보는 순서** (각 5분).
1. http://localhost:3001/widget — 메인 (실시간 이슈 Top 10 위젯)
2. http://localhost:3001/cluster/00000000-0000-4000-8000-000000000001 — 디테일 (미국 연준 금리 동결)
3. http://localhost:3001/cluster/00000000-0000-4000-8000-000000000002 — 디테일 (정치 카테고리)
4. http://localhost:3001/cluster/00000000-0000-4000-8000-000000000015 — 디테일 (표본 부족 노란 경고 케이스)
5. http://localhost:3001/embed/iframe?size=medium — 외부 사이트 임베드 시뮬
6. http://localhost:3001/preorder/pro — Pro 대기자 폼
7. http://localhost:3001/methodology — 방법론 페이지 (광고 0건 영역)

각 화면을 본 후 `design-brief.md` 본문을 정독하면 컨텍스트가 빠르게 잡힌다.

---

## 4. 문서 외 참조 (저장소 `docs/`)

핵심 5건만 우선 보면 충분.

| 문서 | 경로 | 용도 |
|---|---|---|
| **PRD v1.7** (정식) | `docs/prd-v1.7.md` (590줄) | 제품 사양 전체 |
| **PRD v1.7.1 patch** | `docs/prd-v1.7.1-patch.md` (318줄) | Trust Signal & 투자 카드 추가 |
| **CLAUDE.md** (저장소 루트) | `CLAUDE.md` | 비협상 15조 + Naming Ban + 색상 토큰 |
| **ADR-010** Issue Risk OS 포지셔닝 | `docs/adr/ADR-010-positioning-issue-risk-os.md` | 왜 "뉴스 앱"이 아닌가 |
| **ADR-015** Trust Signal & 투자 | `docs/adr/ADR-015-trust-signal-and-investment-risk-layer.md` (265줄) | TrustTag 색상·표시 규칙 |

나머지 ADR (005/006/007/008/009/011/013/014)은 필요 시점에 read.

---

## 5. 산출물 형식 (협의 사항)

다음 중 하나로 협의해 주세요.

- **A. Figma 디자인 파일** + 컴포넌트 라이브러리 (개발자가 Tailwind로 구현)
- **B. HTML/Tailwind 컴포넌트 직접 구현** (현 코드베이스에 PR로 제출)
- **C. Figma + 핵심 컴포넌트는 코드로 (TrustTag, AdZone 등 비협상 제약 들어가는 컴포넌트만)**

저는 C를 선호합니다. Figma는 빠른 시각 의사결정에 유리하고, 비협상 컴포넌트는 코드로 직접 받아 harness 검증이 즉시 가능하기 때문입니다.

---

## 6. 마일스톤 (예상)

| 시점 | 산출물 | 비고 |
|---|---|---|
| 협의 후 D+3 | 디자인 컨셉 3안 (Figma) | 스타일·톤 결정 |
| D+10 | 핵심 surface 5건 디자인 (위젯·클러스터 디테일·임베드·랜딩·Pro 대기자 폼) | 결정한 컨셉 적용 |
| D+17 | 컴포넌트 라이브러리 (12-15개) + Trust Tag 4종 + Investment 분석 카드 | 개발 합류 |
| D+24 | 모바일 (반응형) 검증 + 디크 테마 토글 (선택) | P0a 진입 시점 |
| D+31 | 디자인 QA + 손질 | P0a 데이터 합류 후 |

---

## 7. 비용 + 결제

(협의 사항 — 첫 미팅에서 합의)

---

## 8. 1차 미팅 어젠다 권장

1. 본 README + design-brief.md 정독 후 질문 정리 (디자이너 사전 준비)
2. 김태욱이 라이브 데모 (15분, 위 §3 7개 화면)
3. 디자이너 질문·피드백 (30분)
4. 산출물 형식 (§5) 협의 (10분)
5. 일정·비용 (10분)
6. 다음 단계 합의 — Figma 컨셉 3안 D+3까지

---

## 9. 연락처

- **Founder** — 김태욱 (sgeniusk@gmail.com)
- **저장소** — https://github.com/sgeniusk/tteuniyu (private)
- **CI** — GitHub Actions (verify 50s)
- **로컬 개발** — `~/dev/tteuniyu` (iCloud 폴더 X, git만 진실 원천)

---

**End of README — 2026-05-09**
