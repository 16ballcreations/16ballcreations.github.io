-- Rubro of each prospect (what the business does), so the lists are found by
-- rubro and not by the search that brought them (Renne, 16 nov 2026). The
-- panel fills it from the category (worker/ventas/modelo.js, rubroOf) for any
-- prospect that has none, so new loads need nothing extra.
ALTER TABLE prospects ADD COLUMN rubro TEXT;
CREATE INDEX IF NOT EXISTS prospects_by_rubro ON prospects (rubro, campaign);
