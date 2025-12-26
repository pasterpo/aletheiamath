import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Users, Clock, ArrowLeft, Zap, Swords, 
  Pause, Play, LogOut, Flame, Crown, Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useTournament,
  useTournamentParticipants,
  useMyTournamentParticipation,
  useJoinTournament,
  useWithdrawTournament,
  usePauseTournament,
  useMyCurrentGame,
  TournamentParticipant,
} from '@/hooks/useTournaments';
import { TournamentGame } from '@/components/tournaments/TournamentGame';
import { format, formatDistanceToNow, differenceInSeconds, isPast } from 'date-fns';

export default function TournamentLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: tournament, isLoading: tournamentLoading } = useTournament(id || '');
  const { data: participants } = useTournamentParticipants(id || '');
  const { data: myParticipation } = useMyTournamentParticipation(id || '');
  const { data: myCurrentGame } = useMyCurrentGame(id || '');

  const joinTournament = useJoinTournament();
  const withdrawTournament = useWithdrawTournament();
  const pauseTournament = usePauseTournament();

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [tournamentProgress, setTournamentProgress] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!tournament) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(tournament.start_time);
      const end = new Date(start.getTime() + tournament.duration_minutes * 60 * 1000);

      if (tournament.status === 'scheduled') {
        const diff = differenceInSeconds(start, now);
        if (diff > 0) {
          const hours = Math.floor(diff / 3600);
          const mins = Math.floor((diff % 3600) / 60);
          const secs = diff % 60;
          setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
        } else {
          setTimeRemaining('Starting...');
        }
        setTournamentProgress(0);
      } else if (tournament.status === 'active') {
        const diff = differenceInSeconds(end, now);
        if (diff > 0) {
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          setTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
          const elapsed = differenceInSeconds(now, start);
          const total = tournament.duration_minutes * 60;
          setTournamentProgress((elapsed / total) * 100);
        } else {
          setTimeRemaining('Finished');
          setTournamentProgress(100);
        }
      } else {
        setTimeRemaining('Finished');
        setTournamentProgress(100);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  // Real-time subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tournament-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_participants',
        filter: `tournament_id=eq.${id}`,
      }, () => {
        // Refetch handled by react-query
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_games',
        filter: `tournament_id=eq.${id}`,
      }, () => {
        // Refetch handled by react-query
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to join', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    try {
      await joinTournament.mutateAsync(id!);
      toast({ title: 'Joined!', description: 'You are now registered for this tournament' });
    } catch (error) {
      toast({ 
        title: 'Failed to join', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawTournament.mutateAsync(id!);
      toast({ title: 'Withdrawn', description: 'You have left the tournament' });
    } catch (error) {
      toast({ 
        title: 'Failed to withdraw', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handlePauseToggle = async () => {
    if (!myParticipation) return;
    
    const isPaused = myParticipation.status === 'paused';
    try {
      await pauseTournament.mutateAsync({ tournamentId: id!, paused: !isPaused });
      toast({ 
        title: isPaused ? 'Resumed' : 'Paused', 
        description: isPaused ? 'You will be paired for the next game' : 'You will not be paired until you resume'
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  if (tournamentLoading || !tournament) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  const isEnrolled = !!myParticipation && myParticipation.status !== 'withdrawn';
  const isPaused = myParticipation?.status === 'paused';
  const isInGame = myParticipation?.status === 'in_game';
  const isArena = tournament.tournament_type === 'arena';

  // If user has an active game, show the game interface
  if (myCurrentGame && myCurrentGame.status !== 'finished') {
    return (
      <TournamentGame 
        game={myCurrentGame} 
        tournament={tournament}
        onGameEnd={() => {}}
      />
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <Badge variant="outline" className={isArena ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}>
                {isArena ? <><Zap className="h-3 w-3 mr-1" /> Arena</> : <><Swords className="h-3 w-3 mr-1" /> Swiss</>}
              </Badge>
            </div>
            {tournament.description && (
              <p className="text-muted-foreground mt-1">{tournament.description}</p>
            )}
          </div>
        </div>

        {/* Timer & Progress */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-lg font-mono font-bold">{timeRemaining}</span>
                <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'}>
                  {tournament.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{participants?.length || 0} players</span>
              </div>
            </div>
            {tournament.status === 'active' && (
              <Progress value={tournamentProgress} className="h-2" />
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Action Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Join/Withdraw/Pause Buttons */}
            <Card>
              <CardContent className="py-4 space-y-3">
                {!user ? (
                  <Button className="w-full" onClick={() => navigate('/auth')}>
                    Log in to Join
                  </Button>
                ) : !isEnrolled ? (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={handleJoin}
                    disabled={joinTournament.isPending}
                  >
                    JOIN
                  </Button>
                ) : (
                  <>
                    {isEnrolled && (
                      <div className="text-center py-2">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400">
                          ✓ You are playing!
                        </Badge>
                      </div>
                    )}
                    
                    {isArena && tournament.status === 'active' && !isInGame && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handlePauseToggle}
                        disabled={pauseTournament.isPending}
                      >
                        {isPaused ? (
                          <><Play className="h-4 w-4 mr-2" /> Resume</>
                        ) : (
                          <><Pause className="h-4 w-4 mr-2" /> Pause</>
                        )}
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={handleWithdraw}
                      disabled={withdrawTournament.isPending || isInGame}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* My Stats */}
            {myParticipation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold text-lg">{myParticipation.score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">W/L/D</span>
                    <span>
                      <span className="text-green-500">{myParticipation.wins}</span>
                      {' / '}
                      <span className="text-red-500">{myParticipation.losses}</span>
                      {' / '}
                      <span className="text-muted-foreground">{myParticipation.draws}</span>
                    </span>
                  </div>
                  {myParticipation.is_on_fire && (
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-medium">On Fire! (Streak: {myParticipation.streak})</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tournament Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tournament Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{tournament.duration_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time/Problem</span>
                  <span>{tournament.time_per_problem_seconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating Range</span>
                  <span>{tournament.min_rating} - {tournament.max_rating}</span>
                </div>
                {!isArena && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rounds</span>
                    <span>{tournament.current_round} / {tournament.total_rounds}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Leaderboard */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants && participants.length > 0 ? (
                <div className="space-y-2">
                  {participants
                    .filter(p => p.status !== 'withdrawn')
                    .sort((a, b) => b.score - a.score)
                    .map((participant, index) => (
                      <ParticipantRow 
                        key={participant.id} 
                        participant={participant} 
                        rank={index + 1}
                        isMe={participant.user_id === user?.id}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No players yet. Be the first to join!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function ParticipantRow({ 
  participant, 
  rank, 
  isMe 
}: { 
  participant: TournamentParticipant; 
  rank: number;
  isMe: boolean;
}) {
  const getRankColor = () => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isMe ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
      }`}
    >
      <span className={`w-6 text-center font-bold ${getRankColor()}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </span>
      
      <Avatar className="h-8 w-8">
        <AvatarImage src={participant.profile?.avatar_url || ''} />
        <AvatarFallback>
          {participant.profile?.full_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {participant.profile?.full_name || 'Anonymous'}
          </span>
          {participant.is_on_fire && (
            <Flame className="h-4 w-4 text-orange-500" />
          )}
          {participant.status === 'paused' && (
            <Pause className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {participant.user_stats?.rating || 1000} rating
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">{participant.score}</div>
        <div className="text-xs text-muted-foreground">
          {participant.wins}W {participant.losses}L
        </div>
      </div>
    </div>
  );
}
