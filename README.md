# 뜬이유 (TTEUN-IYU)

> 한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.

| 항목 | 내용 |
|---|---|
| 코드네임 | TTEUN-IYU |
| 서비스명 (한글) | 뜬이유 |
| 진입 Feature | 실시간 이슈 위젯 |
| PRD | [`docs/prd-v1.6.md`](docs/prd-v1.6.md) (확정본) |
| 로드맵 | [`docs/harness-roadmap-v1.6.md`](docs/harness-roadmap-v1.6.md) |
| 운영 규칙 | [`CLAUDE.md`](CLAUDE.md) |

---

## 구조

```
tteuniyu/
├── apps/
│   └── web/             # Next.js 14 App Router (진입 Surface)
├── harness/
│   └── checks/          # 18 non-negotiable constraint checks
├── config/              # sources whitelist, affiliate curation, etc.
├── supabase/
│   └── migrations/      # DB schema
├── prompts/
│   └── evals/           # LLM golden cases
├── docs/
│   ├── prd-v1.6.md      # PRD (SOURCE OF TRUTH)
│   ├── harness-roadmap-v1.6.md
│   ├── adr/             # Architecture Decision Records (ADR-001~007)
│   └── tickets/         # T-W01~W05 P0w Claude Code prompts
└── .github/
    └── workflows/       # CI (18-check harness)
```

---

## 개발 시작

### Prereqs
- Node.js 22+
- pnpm 9+
- Supabase CLI
- Vercel CLI (optional)

### Install
```bash
pnpm install
```

### Run
```bash
pnpm dev          # Next.js dev server on :3000
pnpm harness:all  # All 18 harness checks
pnpm typecheck    # Workspace-wide TS
pnpm test         # Unit tests
```

### Individual harness
```bash
pnpm harness:realtime-naming            # Naming ban list (v1.5)
pnpm harness:ad-zone-boundary           # Revenue Zone Isolation (v1.6 critical)
pnpm harness:affiliate-link-provenance  # Affiliate data boundary (v1.6 critical)
pnpm harness:native-widget-entry-condition  # iOS Swift gate (v1.6 critical)
# ... 18 total, see harness/checks/README.md
```

---

## 하네스 우선 개발 (Harness-First)

**원칙**: 코드 전에 계약, 계약 전에 반례.

1. **Claude Code** = 작성자
2. **Codex** = 검증자 (반례 생성 + 리뷰)
3. **태욱** = 최종 merge 승인자 + 수익 큐레이션
4. **PostHog** = 객관적 진입 조건 판정자 (iOS Widget 활성화)

모든 PR은:
- `pnpm harness:all` (18/18) 통과 필수
- `@codex review` blocking 0 필수
- [PR 템플릿](.github/pull_request_template.md) 체크리스트 14조 준수

---

## 로드맵 (180일)

```
D0-D7    P0w          실시간 이슈 위젯 + 수익 의향 검증
D7       ★ P0w Exit   Paid Intent ≥ 4% + 대기자 ≥ 100 판정
D7-D10   Sprint 0     18종 하네스 스캐폴드 완성
D10-D24  P0a          신뢰 데모 (Coverage Distribution + OG)
D24-D40  P0b          결제 + 알파 + (조건부) iOS Small Widget
D40-D100 V0.5         수익 다각화 + Native 확장
D100-D180 V1          Native 풀스위트 + 광고 정식화
D180+    V2           방법론 v1 + 학계 파트너십
```

상세: [`docs/harness-roadmap-v1.6.md`](docs/harness-roadmap-v1.6.md)

---

## Non-negotiable Principles

**P12 Revenue Zone Isolation**: 광고·제휴는 실시간 이슈 위젯 영역에만. Coverage Distribution·방법론·이의제기 영역에서 수익 요소 절대 금지.

전체 비협상 14조는 [`CLAUDE.md`](CLAUDE.md) 참조.

---

## License

Proprietary, work in progress. © 2026 뜬이유 프로젝트.
