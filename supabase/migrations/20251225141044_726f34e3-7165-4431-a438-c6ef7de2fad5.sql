-- Enable realtime for duels table so both players get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;