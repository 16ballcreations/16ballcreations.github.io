-- Where each prospect sits on the map, worked out from its address by
-- scripts/prospectos-geo.mjs. geo says how sure it is: 'esquina' (the exact
-- corner), 'cuadra' (on its street, between the neighbouring corners),
-- 'cercana' (a corner away) or 'barrio' (only the neighbourhood is known).
ALTER TABLE prospects ADD COLUMN lat REAL;
ALTER TABLE prospects ADD COLUMN lng REAL;
ALTER TABLE prospects ADD COLUMN geo TEXT;
