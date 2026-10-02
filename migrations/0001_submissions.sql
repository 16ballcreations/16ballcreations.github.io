-- Every form that reaches the studio: a MIRA or a contact message.
-- The answers are kept whole in `data` (JSON); the columns beside it are
-- what the review panel lists and filters by.
CREATE TABLE IF NOT EXISTS submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT    NOT NULL CHECK (kind IN ('mira', 'contacto')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  name        TEXT,
  brand       TEXT,
  contact     TEXT,
  data        TEXT    NOT NULL,
  reviewed    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS submissions_by_date ON submissions (created_at DESC);
