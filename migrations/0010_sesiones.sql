-- Sessions for the panel. They replace Basic Auth: the panel gets its own
-- sign-in page (/admin/entrar), a cookie that lasts 30 days, a way out
-- (/admin/salir) and a limit on wrong passwords. Same design as KaffeePlatz.
CREATE TABLE IF NOT EXISTS sesiones (
  id          TEXT    PRIMARY KEY,                 -- 256 random bits, hex
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT    NOT NULL,
  ultima_ip   TEXT,
  ultima_ua   TEXT
);
CREATE INDEX IF NOT EXISTS sesiones_por_caducidad ON sesiones (expires_at);

-- Sign-in attempts, to slow down anyone guessing the password.
CREATE TABLE IF NOT EXISTS intentos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ip          TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  ok          INTEGER NOT NULL DEFAULT 0 CHECK (ok IN (0, 1))
);
CREATE INDEX IF NOT EXISTS intentos_por_ip ON intentos (ip, created_at DESC);
-- old rows are swept now and then without scanning the whole table
CREATE INDEX IF NOT EXISTS intentos_por_fecha ON intentos (created_at);
