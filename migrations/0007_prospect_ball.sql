-- The ball chosen by hand in the panel. When it is set it wins over the one
-- worked out from the research (prioridad + score), and reloading a campaign
-- never touches it. NULL means "use the research".
ALTER TABLE prospects ADD COLUMN bola INTEGER CHECK (bola IS NULL OR bola IN (1, 2, 3, 4, 5, 8));
