-- Security Definer View hatalarını düzelt: view'ları SECURITY INVOKER olarak yeniden oluştur
DROP VIEW IF EXISTS overall_stats;
CREATE VIEW overall_stats WITH (security_invoker = true) AS
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

DROP VIEW IF EXISTS prediction_stats;
CREATE VIEW prediction_stats WITH (security_invoker = true) AS
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