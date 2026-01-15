-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add user_id column to bet_slips
ALTER TABLE public.bet_slips ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to predictions
ALTER TABLE public.predictions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies on bet_slips
DROP POLICY IF EXISTS "Allow public read access on bet_slips" ON public.bet_slips;
DROP POLICY IF EXISTS "Allow public insert access on bet_slips" ON public.bet_slips;
DROP POLICY IF EXISTS "Allow public update access on bet_slips" ON public.bet_slips;
DROP POLICY IF EXISTS "Allow public delete access on bet_slips" ON public.bet_slips;

-- Create user-specific policies for bet_slips
CREATE POLICY "Users can view their own bet slips"
  ON public.bet_slips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bet slips"
  ON public.bet_slips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bet slips"
  ON public.bet_slips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bet slips"
  ON public.bet_slips FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old permissive policies on bet_slip_items
DROP POLICY IF EXISTS "Allow public read access on bet_slip_items" ON public.bet_slip_items;
DROP POLICY IF EXISTS "Allow public insert access on bet_slip_items" ON public.bet_slip_items;
DROP POLICY IF EXISTS "Allow public update access on bet_slip_items" ON public.bet_slip_items;
DROP POLICY IF EXISTS "Allow public delete access on bet_slip_items" ON public.bet_slip_items;

-- Create user-specific policies for bet_slip_items (through bet_slips relationship)
CREATE POLICY "Users can view their own bet slip items"
  ON public.bet_slip_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bet_slips 
    WHERE bet_slips.id = bet_slip_items.slip_id 
    AND bet_slips.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own bet slip items"
  ON public.bet_slip_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bet_slips 
    WHERE bet_slips.id = bet_slip_items.slip_id 
    AND bet_slips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own bet slip items"
  ON public.bet_slip_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bet_slips 
    WHERE bet_slips.id = bet_slip_items.slip_id 
    AND bet_slips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own bet slip items"
  ON public.bet_slip_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bet_slips 
    WHERE bet_slips.id = bet_slip_items.slip_id 
    AND bet_slips.user_id = auth.uid()
  ));

-- Drop old permissive policies on predictions
DROP POLICY IF EXISTS "Allow public read" ON public.predictions;
DROP POLICY IF EXISTS "Allow public insert" ON public.predictions;
DROP POLICY IF EXISTS "Allow public update" ON public.predictions;

-- Create user-specific policies for predictions
-- Allow public read for all predictions (for dashboard stats)
CREATE POLICY "Anyone can view predictions"
  ON public.predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON public.predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON public.predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();