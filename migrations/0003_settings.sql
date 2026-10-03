-- Small private settings for the panel. The first one is Renne's signature
-- (key 'renne_sig', a PNG data URL), uploaded from /admin/firma and applied to
-- every new authorisation. It lives here, never in the public site or the repo.
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
