-- Add policy for developers to view all IMO waitlist entries
CREATE POLICY "Developers can view all waitlist entries"
ON public.imo_waitlist
FOR SELECT
USING (has_role(auth.uid(), 'developer'::app_role));