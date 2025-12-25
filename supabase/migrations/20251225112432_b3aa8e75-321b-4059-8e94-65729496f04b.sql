-- Add image_url column to problems table for problem statement images
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for problem images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('problem-images', 'problem-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view problem images (public bucket)
CREATE POLICY "Anyone can view problem images"
ON storage.objects FOR SELECT
USING (bucket_id = 'problem-images');

-- Allow staff+ to upload problem images
CREATE POLICY "Staff can upload problem images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'problem-images' 
  AND (
    public.has_role(auth.uid(), 'developer') 
    OR public.has_role(auth.uid(), 'staff')
  )
);

-- Allow staff+ to update problem images
CREATE POLICY "Staff can update problem images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'problem-images' 
  AND (
    public.has_role(auth.uid(), 'developer') 
    OR public.has_role(auth.uid(), 'staff')
  )
);

-- Allow developers to delete problem images
CREATE POLICY "Developers can delete problem images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'problem-images' 
  AND public.has_role(auth.uid(), 'developer')
);

-- Create ui_permissions table for dynamic UI control
CREATE TABLE IF NOT EXISTS public.ui_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_key TEXT NOT NULL UNIQUE,
  element_name TEXT NOT NULL,
  element_type TEXT NOT NULL DEFAULT 'button',
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['developer', 'staff', 'moderator', 'member'],
  interactable_by_roles TEXT[] NOT NULL DEFAULT ARRAY['developer', 'staff', 'moderator', 'member'],
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ui_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone can view UI permissions (needed for client-side rendering)
CREATE POLICY "Anyone can view ui permissions"
ON public.ui_permissions FOR SELECT
USING (true);

-- Only developers can modify UI permissions
CREATE POLICY "Developers can insert ui permissions"
ON public.ui_permissions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can update ui permissions"
ON public.ui_permissions FOR UPDATE
USING (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can delete ui permissions"
ON public.ui_permissions FOR DELETE
USING (public.has_role(auth.uid(), 'developer'));

-- Trigger for updated_at
CREATE TRIGGER update_ui_permissions_updated_at
BEFORE UPDATE ON public.ui_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();