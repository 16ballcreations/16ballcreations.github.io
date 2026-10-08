-- The MIRA becomes the first step, before the call, so each one can belong
-- to a prospect. The link is automatic only when the MIRA comes with the
-- prospect's personal link (?t=<mira_token>); any other MIRA arrives without
-- a prospect and is linked by hand in the panel.
ALTER TABLE prospects ADD COLUMN mira_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS prospects_by_mira_token ON prospects (mira_token);

-- 1 once the first message was edited in the panel: reloading a campaign
-- keeps the edited text instead of the one from the research.
ALTER TABLE prospects ADD COLUMN mensaje_editado INTEGER NOT NULL DEFAULT 0;

ALTER TABLE submissions ADD COLUMN prospect_id TEXT REFERENCES prospects (id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN origen TEXT;     -- ig, bio, historia, web, referido, whatsapp, facebook, visita
ALTER TABLE submissions ADD COLUMN vinculo TEXT;    -- 'enlace' (personal link) or 'manual' (linked in the panel)
CREATE INDEX IF NOT EXISTS submissions_by_prospect ON submissions (prospect_id);
