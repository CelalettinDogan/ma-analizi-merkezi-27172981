
-- Allow admins to read ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile (for ban/unban)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read ALL chatbot_usage
CREATE POLICY "Admins can view all chatbot usage"
ON public.chatbot_usage
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read ALL analysis_usage
CREATE POLICY "Admins can view all analysis usage"
ON public.analysis_usage
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read ALL premium_subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.premium_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert/update premium_subscriptions (for assigning premium)
CREATE POLICY "Admins can manage all subscriptions"
ON public.premium_subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
