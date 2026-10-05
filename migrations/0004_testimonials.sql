-- Testimonials, gathered from /testimonio/ after a project ends.
-- Three questions about the person (what changed in them, how they felt,
-- how satisfied they are) and how they agree to appear if it is published.
CREATE TABLE IF NOT EXISTS testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  nombre        TEXT    NOT NULL,
  marca         TEXT,
  impacto       TEXT    NOT NULL,
  sentimientos  TEXT,                 -- JSON array of the chips picked
  sentir_mas    TEXT,                 -- the optional line about how they felt
  satisfaccion  INTEGER NOT NULL CHECK (satisfaccion BETWEEN 1 AND 5),
  publicar      TEXT    NOT NULL CHECK (publicar IN ('nombre', 'iniciales', 'no')),
  reviewed      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS testimonials_by_date ON testimonials (created_at DESC);
