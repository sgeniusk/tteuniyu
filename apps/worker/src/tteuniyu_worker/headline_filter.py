# 정시 뉴스·뉴스 묶음 헤드라인 필터 — 개별 이슈가 아닌 방송 정시 뉴스 제외
#
# "5월 18일 굿모닝 MBN 주요뉴스" 류 — 날짜만 다르고 거의 동일해 임베딩상
# 군집되어 클러스터링 노이즈를 만든다. 이런 헤드라인은 특정 이슈가 아니라
# 그날 뉴스 목록이므로 ingest 단계에서 제외한다.

from __future__ import annotations

# 부분일치 — 헤드라인에 포함되면 정시 뉴스/뉴스 묶음으로 간주.
# 일반 기사 제목에는 거의 등장하지 않는 표현만 보수적으로 선정.
NOISE_KEYWORDS: tuple[str, ...] = (
    "주요뉴스",
    "주요 뉴스",
    "굿모닝MBN",
    "굿모닝 MBN",
    "뉴스와이드",
    "뉴스브리핑",
    "뉴스 브리핑",
    "오늘의 뉴스",
    "조간 브리핑",
    "석간 브리핑",
    "이 시각 주요",
    "이시각 주요",
    "이 시각 헤드라인",
    "주요 일정",
    "주간 뉴스",
)


def is_noise_headline(title: str) -> bool:
    """방송 정시 뉴스·뉴스 묶음 헤드라인이면 True — ingest에서 제외 대상.

    부분일치 — NOISE_KEYWORDS 중 하나라도 헤드라인에 포함되면 노이즈.
    """
    t = title.strip()
    return any(kw in t for kw in NOISE_KEYWORDS)
