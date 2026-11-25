CREATE TABLE IF NOT EXISTS chart_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  delete_token_hash TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_chart_requests_created
  ON chart_requests (created_at DESC);
