-- Create discussion messages table for global chat
CREATE TABLE public.discussion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages
CREATE POLICY "Anyone can view discussion messages"
ON public.discussion_messages
FOR SELECT
USING (true);

-- Authenticated users can post messages
CREATE POLICY "Authenticated users can post messages"
ON public.discussion_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages, developers can delete any
CREATE POLICY "Users can delete own messages or devs can delete any"
ON public.discussion_messages
FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'developer'));

-- Enable realtime for discussion messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_messages;

-- Update profiles RLS to allow developers to view all profiles
CREATE POLICY "Developers can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'developer'));