-- Mevcut tutarsız lig adlarını standartlaştır
UPDATE predictions SET league = 'PD' WHERE league IN ('La Liga', 'İspanya La Liga', 'LaLiga');
UPDATE predictions SET league = 'SA' WHERE league IN ('Serie A', 'İtalya Serie A');
UPDATE predictions SET league = 'PL' WHERE league IN ('Premier League', 'İngiltere Premier Ligi');
UPDATE predictions SET league = 'BL1' WHERE league IN ('Bundesliga', 'Almanya Bundesliga');
UPDATE predictions SET league = 'FL1' WHERE league IN ('Ligue 1', 'Fransa Ligue 1');
UPDATE predictions SET league = 'CL' WHERE league IN ('Champions League', 'UEFA Champions League', 'UEFA Şampiyonlar Ligi');