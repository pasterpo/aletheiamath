import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userTheme, isLoading } = useQuery({
    queryKey: ['user-theme', user?.id],
    queryFn: async () => {
      if (!user) return 'system';

      const { data, error } = await (supabase as any)
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.theme as Theme) || 'system';
    },
    enabled: !!user,
  });

  const updateTheme = useMutation({
    mutationFn: async (theme: Theme) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await (supabase as any)
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('user_settings')
          .update({ theme, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('user_settings')
          .insert({ user_id: user.id, theme });
        if (error) throw error;
      }
      return theme;
    },
    onSuccess: (theme) => {
      queryClient.setQueryData(['user-theme', user?.id], theme);
      applyTheme(theme);
    },
  });

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  // Apply theme on load and when it changes
  useEffect(() => {
    const theme = userTheme || 'system';
    applyTheme(theme);
  }, [userTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!userTheme || userTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userTheme]);

  return {
    theme: userTheme || 'system',
    isLoading,
    setTheme: updateTheme.mutate,
    isPending: updateTheme.isPending,
  };
}
