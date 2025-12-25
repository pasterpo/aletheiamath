-- Allow an authenticated user to join a waiting duel by claiming opponent_id
-- (Required because the existing UPDATE policy only allows updates once you are already challenger/opponent)

CREATE POLICY "Users can join waiting duels"
ON public.duels
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND status = 'waiting'
  AND opponent_id IS NULL
  AND auth.uid() <> challenger_id
)
WITH CHECK (
  opponent_id = auth.uid()
  AND status = 'active'
  AND winner_id IS NULL
  AND completed_at IS NULL
);
