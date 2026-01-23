-- premium_subscriptions tablosu için kullanıcıların kendi aboneliklerini okumasına izin ver
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Users can view their own subscriptions" 
ON public.premium_subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- chat_history tablosu için kullanıcıların kendi mesajlarını yönetmesine izin ver
DROP POLICY IF EXISTS "Users can manage their own chat history" ON public.chat_history;
CREATE POLICY "Users can manage their own chat history" 
ON public.chat_history 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- chatbot_usage tablosu için kullanıcıların kendi kullanım verilerini okumasına izin ver
DROP POLICY IF EXISTS "Users can view their own chatbot usage" ON public.chatbot_usage;
CREATE POLICY "Users can view their own chatbot usage" 
ON public.chatbot_usage 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- analysis_usage tablosu için kullanıcıların kendi kullanım verilerini okumasına izin ver
DROP POLICY IF EXISTS "Users can view their own analysis usage" ON public.analysis_usage;
CREATE POLICY "Users can view their own analysis usage" 
ON public.analysis_usage 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);