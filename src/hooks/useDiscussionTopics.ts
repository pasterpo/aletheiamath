import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DiscussionTopic {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

export function useDiscussionTopics() {
  return useQuery({
    queryKey: ['discussion-topics'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('discussion_topics')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DiscussionTopic[];
    },
  });
}

export function useCreateTopic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('discussion_topics')
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-topics'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await (supabase as any)
        .from('discussion_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
      return topicId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-topics'] });
    },
  });
}
