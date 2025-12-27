import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that triggers pairing when user enters lobby
 * and sets up real-time subscription for game assignments
 */
export function useTournamentPairing(tournamentId: string, isInLobby: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!tournamentId || !user || !isInLobby) return;

    // Trigger pairing check when entering lobby
    const triggerPairing = async () => {
      try {
        console.log('Triggering arena pairing for tournament:', tournamentId);
        await supabase.functions.invoke('tournament-engine', {
          body: { action: 'pair_arena', tournament_id: tournamentId }
        });
      } catch (error) {
        console.error('Failed to trigger pairing:', error);
      }
    };

    // Trigger immediately
    triggerPairing();

    // Set up interval to keep trying pairing
    const interval = setInterval(triggerPairing, 3000);

    return () => clearInterval(interval);
  }, [tournamentId, user, isInLobby]);
}
