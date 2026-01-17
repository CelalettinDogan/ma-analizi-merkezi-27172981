-- 1. predictions tablosuna is_primary kolonu ekle
ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 2. Mevcut kayıtlarda her maç+user için en yüksek hybrid_confidence'a sahip olanı is_primary=true yap
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY home_team, away_team, match_date, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY hybrid_confidence DESC NULLS LAST, created_at DESC
    ) as rn
  FROM predictions
)
UPDATE predictions SET is_primary = true
WHERE id IN (SELECT id FROM ranked WHERE rn = 1);

-- 3. Gereksiz duplikatları sil (is_primary = false olanlar)
DELETE FROM prediction_features
WHERE prediction_id IN (
  SELECT id FROM predictions WHERE is_primary = false
);

DELETE FROM predictions WHERE is_primary = false;

-- 4. overall_stats view'ını güncelle (sadece primary tahminleri say)
DROP VIEW IF EXISTS overall_stats;
CREATE VIEW overall_stats AS
SELECT 
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_predictions,
  COUNT(*) FILTER (WHERE is_correct = false) as incorrect_predictions,
  COUNT(*) FILTER (WHERE is_correct IS NULL) as pending_predictions,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_correct IS NOT NULL) > 0 THEN
      ROUND(
        COUNT(*) FILTER (WHERE is_correct = true)::numeric / 
        COUNT(*) FILTER (WHERE is_correct IS NOT NULL) * 100, 1
      )
    ELSE NULL
  END as accuracy_percentage,
  COUNT(*) FILTER (WHERE is_premium = true) as high_confidence_total,
  COUNT(*) FILTER (WHERE is_premium = true AND is_correct = true) as high_confidence_correct
FROM predictions
WHERE is_primary = true;

-- 5. prediction_stats view'ını güncelle
DROP VIEW IF EXISTS prediction_stats;
CREATE VIEW prediction_stats AS
SELECT 
  prediction_type,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_predictions,
  COUNT(*) FILTER (WHERE is_correct = false) as incorrect_predictions,
  COUNT(*) FILTER (WHERE is_correct IS NULL) as pending_predictions,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_correct IS NOT NULL) > 0 THEN
      ROUND(
        COUNT(*) FILTER (WHERE is_correct = true)::numeric / 
        COUNT(*) FILTER (WHERE is_correct IS NOT NULL) * 100, 1
      )
    ELSE NULL
  END as accuracy_percentage
FROM predictions
WHERE is_primary = true
GROUP BY prediction_type;

-- 6. Cleanup fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION cleanup_old_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- is_primary=false olan tüm kayıtları sil (gereksiz duplikatlar)
  DELETE FROM prediction_features
  WHERE prediction_id IN (
    SELECT id FROM predictions WHERE is_primary = false
  );
  
  DELETE FROM predictions WHERE is_primary = false;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % non-primary predictions', deleted_count;
  
  -- 30 günden eski doğrulanmış kayıtları sil
  DELETE FROM prediction_features
  WHERE prediction_id IN (
    SELECT id FROM predictions 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_correct IS NOT NULL
  );
  
  DELETE FROM predictions 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_correct IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old verified predictions', deleted_count;
END;
$$;