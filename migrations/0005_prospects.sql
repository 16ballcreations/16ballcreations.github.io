-- Prospects: businesses we may reach out to, grouped in campaigns (one per
-- zone and month, e.g. 'belen-2026-10'). The research behind each one is kept
-- whole in `data` (JSON); the columns beside it are what the panel lists,
-- filters and updates. None of this lives in the repo: it is loaded into the
-- database from the private research folder (scripts/prospectos-sql.mjs).
CREATE TABLE IF NOT EXISTS prospects (
  id              TEXT    PRIMARY KEY,          -- campaign + code, e.g. 'belen-2026-10:P069'
  campaign        TEXT    NOT NULL,
  code            TEXT    NOT NULL,             -- the code inside the campaign, e.g. 'P069'
  negocio         TEXT    NOT NULL,
  categoria       TEXT,
  barrio          TEXT,
  direccion       TEXT,
  dir_fuente      TEXT,                         -- where the address came from: 'bio verificada' or 'handoff'
  distancia_km    REAL,
  prioridad       TEXT,                         -- A, B, C, D or Descartar
  score           INTEGER,
  rank            INTEGER,
  estado_redes    TEXT,                         -- verificado, probable, no_confirmado, sin_redes, fuera_de_zona, requiere_sesion
  canal           TEXT,                         -- the chat to write to first
  enlace          TEXT,
  respaldo        TEXT,
  instagram       TEXT,
  facebook        TEXT,
  tiktok          TEXT,
  web             TEXT,
  gancho          TEXT,                         -- what we saw: the opening of the conversation
  mensaje         TEXT,                         -- the first chat message, ready to copy
  nota            TEXT,
  data            TEXT    NOT NULL,
  etapa           TEXT    NOT NULL DEFAULT 'por_contactar'
                  CHECK (etapa IN ('por_contactar', 'contactado', 'respondio', 'reunion', 'propuesta', 'cliente', 'descartado')),
  proxima_accion  TEXT,
  proxima_fecha   TEXT,                         -- YYYY-MM-DD
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS prospects_by_rank ON prospects (campaign, rank);
CREATE INDEX IF NOT EXISTS prospects_by_stage ON prospects (etapa);

-- What happened with each prospect, newest first in the panel: messages sent,
-- answers, visits, meetings, notes, and every change of stage.
CREATE TABLE IF NOT EXISTS prospect_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  prospect_id  TEXT    NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  tipo         TEXT    NOT NULL CHECK (tipo IN ('mensaje', 'respuesta', 'visita', 'reunion', 'nota', 'etapa')),
  texto        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS prospect_events_by_prospect ON prospect_events (prospect_id, created_at DESC);

-- The documents behind a campaign (the sales script, the field notes, the
-- method), in Markdown, so the panel can show them next to the prospects.
CREATE TABLE IF NOT EXISTS resources (
  slug        TEXT PRIMARY KEY,
  campaign    TEXT,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
