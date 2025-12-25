import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole } from '@/hooks/useRoles';

export interface IMOWaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  current_level: string | null;
  motivation: string | null;
  experience: string | null;
  user_id: string | null;
  created_at: string;
}

export function useIMOWaitlist() {
  const { user } = useAuth();
  const { data: role } = useMyRole();
  const isDeveloper = role === 'developer';

  return useQuery({
    queryKey: ['imo-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imo_waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IMOWaitlistEntry[];
    },
    enabled: !!user && isDeveloper,
  });
}
