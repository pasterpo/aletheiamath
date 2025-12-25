import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDeleteProblem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (problemId: string) => {
      const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', problemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      toast({
        title: 'Problem deleted',
        description: 'The problem has been removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete problem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
