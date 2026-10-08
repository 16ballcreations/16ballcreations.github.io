-- Events with fields, as JSON: a call that was scheduled ({"estado":"agendada",
-- "fecha":"2026-10-14T10:00","medio":"visita"}) and the record of the call
-- once it happened ({"estado":"realizada", ...}). Plain notes leave it NULL.
ALTER TABLE prospect_events ADD COLUMN data TEXT;
