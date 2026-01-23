-- Chat history temizlik fonksiyonu (24 saat sonra)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 24 saatten eski chat mesajlarını sil
  DELETE FROM chat_history 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old chat messages', deleted_count;
END;
$$;

-- Chatbot usage temizlik fonksiyonu (7 gün sonra)
CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 7 günden eski kullanım kayıtlarını sil
  DELETE FROM chatbot_usage 
  WHERE usage_date < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old chatbot usage records', deleted_count;
END;
$$;