import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TournamentType = 'arena' | 'swiss';
export type TournamentStatus = 'scheduled' | 'active' | 'finished';
export type ParticipantStatus = 'registered' | 'in_lobby' | 'in_game' | 'paused' | 'withdrawn';
export type GameStatus = 'countdown' | 'active' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  tournament_type: TournamentType;
  status: TournamentStatus;
  category_id: string | null;
  min_rating: number;
  max_rating: number;
  min_rated_games: number;
  time_per_problem_seconds: number;
  start_time: string;
  duration_minutes: number;
  total_rounds: number;
  current_round: number;
  created_by: string;
  created_at: string;
  participant_count?: number;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  status: ParticipantStatus;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  is_on_fire: boolean;
  is_berserk_next: boolean;
  last_opponent_id: string | null;
  lobby_since: string | null;
  joined_at: string;
  pause_count: number;
  last_paused_at: string | null;
  can_rejoin_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_stats?: {
    rating: number;
  };
}

export interface TournamentGame {
  id: string;
  tournament_id: string;
  round_number: number;
  player_a_id: string;
  player_b_id: string | null;
  problem_id: string | null;
  status: GameStatus;
  player_a_answer: string | null;
  player_b_answer: string | null;
  player_a_time_ms: number | null;
  player_b_time_ms: number | null;
  player_a_mistakes: number;
  player_b_mistakes: number;
  player_a_berserk: boolean;
  player_b_berserk: boolean;
  winner_id: string | null;
  is_draw: boolean;
  is_bye: boolean;
  points_awarded_a: number;
  points_awarded_b: number;
  started_at: string | null;
  finished_at: string | null;
  problem?: {
    id: string;
    title: string;
    statement: string;
    answer: string | null;
    difficulty: number | null;
  };
}

export function useTournaments(status?: TournamentStatus) {
  return useQuery({
    queryKey: ['tournaments', status],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Tournament[];
    },
  });
}

export function useTournament(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      if (error) throw error;
      return data as Tournament;
    },
    enabled: !!tournamentId,
  });
}

export function useTournamentParticipants(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('score', { ascending: false });
      
      if (error) throw error;

      // Fetch profiles and stats separately
      const userIds = data.map(p => p.user_id);
      const [profilesRes, statsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds),
        supabase.from('user_stats').select('user_id, rating').in('user_id', userIds)
      ]);

      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const statsMap = new Map(statsRes.data?.map(s => [s.user_id, s]) || []);

      return data.map(p => ({
        ...p,
        profile: profilesMap.get(p.user_id),
        user_stats: statsMap.get(p.user_id)
      })) as TournamentParticipant[];
    },
    enabled: !!tournamentId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useMyTournamentParticipation(tournamentId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-tournament-participation', tournamentId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TournamentParticipant | null;
    },
    enabled: !!tournamentId && !!user,
  });
}

export function useJoinTournament() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          status: 'registered',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['my-tournament-participation', tournamentId] });
    },
  });
}

export function useWithdrawTournament() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tournament_participants')
        .update({ status: 'withdrawn' })
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['my-tournament-participation', tournamentId] });
    },
  });
}

export function usePauseTournament() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, paused }: { tournamentId: string; paused: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (paused) {
        // Use Lichess-style pause with progressive delay
        const { data, error } = await supabase.functions.invoke('tournament-engine', {
          body: { action: 'pause_player', tournament_id: tournamentId, game_id: user.id }
        });
        if (error) throw error;
        return data;
      } else {
        // Resume with delay check
        const { data, error } = await supabase.functions.invoke('tournament-engine', {
          body: { action: 'resume_player', tournament_id: tournamentId, game_id: user.id }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      }
    },
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['my-tournament-participation', tournamentId] });
    },
  });
}

export function useTournamentGames(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament-games', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_games')
        .select(`
          *,
          problem:problems(id, title, statement, answer, difficulty)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TournamentGame[];
    },
    enabled: !!tournamentId,
    refetchInterval: 3000,
  });
}

export function useMyCurrentGame(tournamentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-current-game', tournamentId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('tournament_games')
        .select(`
          *,
          problem:problems(id, title, statement, answer, difficulty)
        `)
        .eq('tournament_id', tournamentId)
        .or(`player_a_id.eq.${user.id},player_b_id.eq.${user.id}`)
        .in('status', ['countdown', 'active'])
        .maybeSingle();

      if (error) throw error;
      return data as TournamentGame | null;
    },
    enabled: !!tournamentId && !!user,
    refetchInterval: 1000,
  });
}

export function useActivateBerserk() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the game to determine which player we are
      const { data: game, error: gameError } = await supabase
        .from('tournament_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const isPlayerA = game.player_a_id === user.id;
      const updateField = isPlayerA ? 'player_a_berserk' : 'player_b_berserk';

      const { error } = await supabase
        .from('tournament_games')
        .update({ [updateField]: true })
        .eq('id', gameId)
        .eq('status', 'countdown');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-current-game'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-games'] });
    },
  });
}

export function useSubmitTournamentAnswer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      gameId, 
      answer, 
      timeMs 
    }: { 
      gameId: string; 
      answer: string; 
      timeMs: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get the game
      const { data: game, error: gameError } = await supabase
        .from('tournament_games')
        .select('*, problem:problems(answer)')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const isPlayerA = game.player_a_id === user.id;
      const correctAnswer = game.problem?.answer;
      const isCorrect = correctAnswer && answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      // Update based on which player
      const updateData: Record<string, unknown> = {};
      if (isPlayerA) {
        updateData.player_a_answer = answer;
        updateData.player_a_time_ms = timeMs;
        if (!isCorrect) {
          updateData.player_a_mistakes = (game.player_a_mistakes || 0) + 1;
        }
      } else {
        updateData.player_b_answer = answer;
        updateData.player_b_time_ms = timeMs;
        if (!isCorrect) {
          updateData.player_b_mistakes = (game.player_b_mistakes || 0) + 1;
        }
      }

      // If correct, determine winner - use Lichess-style scoring via backend
      if (isCorrect) {
        updateData.winner_id = user.id;
        updateData.status = 'finished';
        updateData.finished_at = new Date().toISOString();
        updateData.result_type = 'win';

        const { error } = await supabase
          .from('tournament_games')
          .update(updateData)
          .eq('id', gameId);

        if (error) throw error;

        // Process game result with Lichess scoring
        await supabase.functions.invoke('tournament-engine', {
          body: { action: 'process_game_result', game_id: gameId, tournament_ended: false }
        });

        return { isCorrect: true, mistakes: 0 };
      }

      const { error } = await supabase
        .from('tournament_games')
        .update(updateData)
        .eq('id', gameId);

      if (error) throw error;

      return { isCorrect, mistakes: isPlayerA ? updateData.player_a_mistakes : updateData.player_b_mistakes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-current-game'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-games'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participants'] });
      queryClient.invalidateQueries({ queryKey: ['featured-duels'] });
    },
  });
}

export function useGiveUpGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: game, error: gameError } = await supabase
        .from('tournament_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const isPlayerA = game.player_a_id === user.id;
      const winnerId = isPlayerA ? game.player_b_id : game.player_a_id;

      const updateData: Record<string, unknown> = {
        winner_id: winnerId,
        status: 'finished',
        finished_at: new Date().toISOString(),
        result_type: 'resign',
      };

      const { error } = await supabase
        .from('tournament_games')
        .update(updateData)
        .eq('id', gameId);

      if (error) throw error;

      // Process game result with Lichess scoring
      await supabase.functions.invoke('tournament-engine', {
        body: { action: 'process_game_result', game_id: gameId, tournament_ended: false }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-current-game'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-games'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participants'] });
      queryClient.invalidateQueries({ queryKey: ['featured-duels'] });
    },
  });
}

// Hook for featured duels (top ongoing games by rating)
export interface FeaturedDuel {
  id: string;
  tournament_id: string;
  game_id: string;
  player_a_name: string;
  player_b_name: string;
  player_a_rating: number;
  player_b_rating: number;
  player_a_rank: number | null;
  player_b_rank: number | null;
  average_rating: number;
  created_at: string;
}

export function useFeaturedDuels(tournamentId: string) {
  return useQuery({
    queryKey: ['featured-duels', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_featured_duels')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('average_rating', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as FeaturedDuel[];
    },
    enabled: !!tournamentId,
    refetchInterval: 3000,
  });
}

export function useCreateTournament() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournament: Partial<Tournament>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: tournament.name!,
          description: tournament.description,
          tournament_type: tournament.tournament_type,
          status: tournament.status,
          duration_minutes: tournament.duration_minutes,
          time_per_problem_seconds: tournament.time_per_problem_seconds,
          min_rating: tournament.min_rating,
          max_rating: tournament.max_rating,
          start_time: tournament.start_time!,
          total_rounds: tournament.total_rounds,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
