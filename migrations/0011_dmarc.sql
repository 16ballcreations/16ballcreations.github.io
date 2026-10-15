-- DMARC aggregate reports: what the big mailbox providers saw arrive "from"
-- 16ballcreations.com, and whether it passed. They reach the Worker by email
-- (dmarc@16ballcreations.com, Cloudflare Email Routing) and show up in
-- /admin/correo.

CREATE TABLE IF NOT EXISTS dmarc_reports (
  org          TEXT NOT NULL,              -- who reports: google.com, Outlook.com…
  report_id    TEXT NOT NULL,
  begin_at     INTEGER,                    -- unix seconds, start of the period
  end_at       INTEGER,
  policy       TEXT,                       -- p= published at the time
  received_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (org, report_id)
);

CREATE TABLE IF NOT EXISTS dmarc_rows (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org          TEXT NOT NULL,
  report_id    TEXT NOT NULL,
  begin_at     INTEGER,
  source_ip    TEXT,
  count        INTEGER NOT NULL DEFAULT 0,
  disposition  TEXT,                       -- none | quarantine | reject
  dkim         TEXT,                       -- aligned DKIM result: pass | fail
  spf          TEXT,                       -- aligned SPF result: pass | fail
  header_from  TEXT,
  spf_domain   TEXT,
  spf_result   TEXT,
  dkim_domain  TEXT,
  dkim_result  TEXT
);

CREATE INDEX IF NOT EXISTS dmarc_rows_begin ON dmarc_rows (begin_at);
