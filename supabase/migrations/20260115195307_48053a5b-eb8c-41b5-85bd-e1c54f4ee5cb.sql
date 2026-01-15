-- Make odds column nullable in bet_slip_items since real odds are not available
ALTER TABLE public.bet_slip_items ALTER COLUMN odds DROP NOT NULL;
ALTER TABLE public.bet_slip_items ALTER COLUMN odds DROP DEFAULT;

-- Make total_odds, stake, and potential_win nullable in bet_slips
ALTER TABLE public.bet_slips ALTER COLUMN total_odds DROP NOT NULL;
ALTER TABLE public.bet_slips ALTER COLUMN total_odds DROP DEFAULT;
ALTER TABLE public.bet_slips ALTER COLUMN stake DROP NOT NULL;
ALTER TABLE public.bet_slips ALTER COLUMN stake DROP DEFAULT;
ALTER TABLE public.bet_slips ALTER COLUMN potential_win DROP NOT NULL;
ALTER TABLE public.bet_slips ALTER COLUMN potential_win DROP DEFAULT;