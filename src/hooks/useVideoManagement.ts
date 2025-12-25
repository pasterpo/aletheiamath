import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AddVideoParams {
  youtube_id: string;
  title: string;
  description?: string;
  category_id?: string;
  difficulty?: string;
  tags?: string[];
  duration_seconds?: number;
}

export function useAddVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddVideoParams) => {
      // Extract video ID from various YouTube URL formats
      let videoId = params.youtube_id;
      
      // Handle full URLs
      if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
        const url = new URL(videoId.includes('http') ? videoId : `https://${videoId}`);
        if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        } else {
          videoId = url.searchParams.get('v') || videoId;
        }
      }

      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      const { data, error } = await supabase
        .from('videos')
        .insert({
          youtube_id: videoId,
          title: params.title,
          description: params.description || null,
          category_id: params.category_id || null,
          difficulty: params.difficulty || null,
          tags: params.tags || null,
          duration_seconds: params.duration_seconds || null,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      return videoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}
