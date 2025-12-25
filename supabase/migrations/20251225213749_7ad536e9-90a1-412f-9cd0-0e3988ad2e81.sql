-- Allow devs to manage videos
DROP POLICY IF EXISTS "Developers can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Developers can update videos" ON public.videos;
DROP POLICY IF EXISTS "Developers can delete videos" ON public.videos;

CREATE POLICY "Developers can insert videos" ON public.videos
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can update videos" ON public.videos
  FOR UPDATE USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can delete videos" ON public.videos
  FOR DELETE USING (has_role(auth.uid(), 'developer'));

-- Allow devs to manage video categories
DROP POLICY IF EXISTS "Developers can insert video_categories" ON public.video_categories;
DROP POLICY IF EXISTS "Developers can update video_categories" ON public.video_categories;
DROP POLICY IF EXISTS "Developers can delete video_categories" ON public.video_categories;

CREATE POLICY "Developers can insert video_categories" ON public.video_categories
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can update video_categories" ON public.video_categories
  FOR UPDATE USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can delete video_categories" ON public.video_categories
  FOR DELETE USING (has_role(auth.uid(), 'developer'));

-- Create storage bucket for chat images if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat images
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;

CREATE POLICY "Anyone can view chat images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);