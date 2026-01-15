-- Create bet_slips table (Kuponlar)
CREATE TABLE public.bet_slips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT,
  total_odds DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  stake DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  potential_win DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'partial')),
  is_verified BOOLEAN NOT NULL DEFAULT false
);

-- Create bet_slip_items table (Kupon Maçları)
CREATE TABLE public.bet_slip_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slip_id UUID NOT NULL REFERENCES public.bet_slips(id) ON DELETE CASCADE,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  prediction_value TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('düşük', 'orta', 'yüksek')),
  odds DECIMAL(5, 2) NOT NULL DEFAULT 1.50,
  is_correct BOOLEAN,
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slip_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have auth yet)
CREATE POLICY "Allow public read access on bet_slips"
  ON public.bet_slips FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on bet_slips"
  ON public.bet_slips FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on bet_slips"
  ON public.bet_slips FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on bet_slips"
  ON public.bet_slips FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on bet_slip_items"
  ON public.bet_slip_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on bet_slip_items"
  ON public.bet_slip_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on bet_slip_items"
  ON public.bet_slip_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on bet_slip_items"
  ON public.bet_slip_items FOR DELETE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_bet_slip_items_slip_id ON public.bet_slip_items(slip_id);