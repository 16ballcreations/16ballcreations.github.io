-- Image-use authorisations for the case studies.
-- Renne signs first, from the panel, and the client gets a link with a token
-- to sign their part. Signatures are kept as PNG data URLs; the client's IP
-- and browser are kept as evidence of who signed and when.
CREATE TABLE IF NOT EXISTS authorizations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  token             TEXT    NOT NULL UNIQUE,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  cliente           TEXT    NOT NULL,
  proyecto          TEXT    NOT NULL,
  web               TEXT,
  redes             TEXT,
  fecha             TEXT    NOT NULL,
  renne_sig         TEXT    NOT NULL,
  client_sig        TEXT,
  client_doc        TEXT,
  client_signed_at  TEXT,
  client_ip         TEXT,
  client_ua         TEXT
);

CREATE INDEX IF NOT EXISTS authorizations_by_date ON authorizations (created_at DESC);
