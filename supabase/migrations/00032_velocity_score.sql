-- velocity 순위 — 최근 활동량 기반 cluster 정렬 (ADR-008 보강)
--
-- 문제 — widget 순위가 outlets_count(누적 보도 매체 수) 기준이라, 며칠 전
-- 큰 이슈가 incremental merge로 계속 커지며 상위 고정. "지금 뜨는"이 아닌
-- "누적 가장 큰" 순위가 됨.
--
-- 해결 — velocity_score(최근 12시간 내 cluster에 추가된 기사 수)를 1차 정렬
-- 키로. cluster-pending 워커가 매 회차 재계산. 오래된 이슈는 신규 유입이
-- 끊기면 velocity 0으로 떨어져 자연히 하락.

ALTER TABLE clusters
  ADD COLUMN IF NOT EXISTS velocity_score INT NOT NULL DEFAULT 0;

-- widget 정렬 — velocity 우선, 동률 시 outlets_count.
CREATE INDEX IF NOT EXISTS idx_clusters_velocity
  ON clusters (velocity_score DESC, outlets_count DESC);
