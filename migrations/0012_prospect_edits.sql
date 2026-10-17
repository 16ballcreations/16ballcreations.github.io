-- The contact details and the verification notes of a prospect can be edited
-- in the panel. Once edited, reloading the campaign (scripts/prospectos-sql.mjs)
-- keeps what was typed by hand instead of the research's values, the same way
-- mensaje_editado protects the first message.
--   contacto_editado: canal, enlace, respaldo, direccion, dir_fuente, barrio,
--                     instagram, facebook, tiktok, web and data.telefono
--   notas_editadas:   gancho and nota
ALTER TABLE prospects ADD COLUMN contacto_editado INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prospects ADD COLUMN notas_editadas INTEGER NOT NULL DEFAULT 0;
