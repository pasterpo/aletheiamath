import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
}

export interface Video {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  difficulty: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  view_count: number | null;
  category?: VideoCategory;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export function useVideoCategories() {
  return useQuery({
    queryKey: ['video-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as VideoCategory[];
    },
  });
}

export function useVideos(categorySlug?: string) {
  return useQuery({
    queryKey: ['videos', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select(`
          *,
          category:video_categories(*)
        `)
        .order('created_at', { ascending: false });
      
      if (categorySlug) {
        const { data: category } = await supabase
          .from('video_categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Video[];
    },
  });
}

export function useFeaturedVideos() {
  return useQuery({
    queryKey: ['videos', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          category:video_categories(*)
        `)
        .eq('is_featured', true)
        .limit(4);
      
      if (error) throw error;
      return data as Video[];
    },
  });
}

export function useVideoProgress() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['video-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as VideoProgress[];
    },
    enabled: !!user,
  });
}

export function useUpdateVideoProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ videoId, watchedSeconds, completed }: { 
      videoId: string; 
      watchedSeconds: number; 
      completed?: boolean 
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          watched_seconds: watchedSeconds,
          completed: completed || false,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-progress'] });
    },
  });
}
