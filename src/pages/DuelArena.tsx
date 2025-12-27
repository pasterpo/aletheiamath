import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Clock, CheckCircle, XCircle, Loader2, Trophy, User } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DuelData {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  problem_id: string | null;
  status: string;
  challenger_answer: string | null;
  opponent_answer: string | null;
  challenger_time_seconds: number | null;
  opponent_time_seconds: number | null;
  winner_id: string | null;
  started_at: string | null;
  problem?: {
    id: string;
    title: string;
    statement: string;
    image_url: string | null;
    answer: string | null;
    difficulty: number | null;
  };
  challenger_profile?: {
    full_name: string | null;
  };
  opponent_profile?: {
    full_name: string | null;
  };
}

export default function DuelArena() {
  const { duelId } = useParams<{ duelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [duel, setDuel] = useState<DuelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchDuel = useCallback(async () => {
    if (!duelId) return;
    
    try {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          problem:problems(id, title, statement, image_url, answer, difficulty)
        `)
        .eq('id', duelId)
        .single();

      if (error) throw error;
      
      const duelData = data as unknown as DuelData;
      
      // Fetch player profiles
      const playerIds = [duelData.challenger_id, duelData.opponent_id].filter(Boolean) as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', playerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      duelData.challenger_profile = profileMap.get(duelData.challenger_id) || null;
      if (duelData.opponent_id) {
        duelData.opponent_profile = profileMap.get(duelData.opponent_id) || null;
      }
      
      setDuel(duelData);
      
      // Check if current user has already submitted
      if (user) {
        if (duelData.challenger_id === user.id && duelData.challenger_answer) {
          setHasSubmitted(true);
        } else if (duelData.opponent_id === user.id && duelData.opponent_answer) {
          setHasSubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error fetching duel:', error);
      toast({
        title: 'Error',
        description: 'Failed to load duel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [duelId, user, toast]);

  useEffect(() => {
    fetchDuel();
    
    // Subscribe to duel updates
    const channel = supabase
      .channel(`duel-${duelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duels',
          filter: `id=eq.${duelId}`
        },
        () => {
          fetchDuel();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId, fetchDuel]);

  // Timer effect
  useEffect(() => {
    if (duel?.status === 'active' && duel.started_at && !hasSubmitted) {
      const interval = setInterval(() => {
        const startTime = new Date(duel.started_at!).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [duel?.status, duel?.started_at, hasSubmitted]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !duel || !user) return;

    setSubmitting(true);
    try {
      const isChallenger = duel.challenger_id === user.id;
      const updateData: Record<string, any> = {};
      
      if (isChallenger) {
        updateData.challenger_answer = answer.trim();
        updateData.challenger_time_seconds = elapsedTime;
      } else {
        updateData.opponent_answer = answer.trim();
        updateData.opponent_time_seconds = elapsedTime;
      }

      // Check if both have answered
      const otherAnswered = isChallenger ? duel.opponent_answer : duel.challenger_answer;
      
      if (otherAnswered) {
        // Both have answered, determine winner based on correct answers and time
        const correctAnswer = duel.problem?.answer?.toLowerCase().trim();
        const myAnswerCorrect = answer.trim().toLowerCase() === correctAnswer;
        const otherAnswer = (otherAnswered as string).toLowerCase().trim();
        const otherAnswerCorrect = otherAnswer === correctAnswer;
        
        const myTime = elapsedTime;
        const otherTime = isChallenger ? duel.opponent_time_seconds : duel.challenger_time_seconds;

        let winnerId: string | null = null;
        
        if (myAnswerCorrect && !otherAnswerCorrect) {
          // Only I got it right - I win regardless of time
          winnerId = user.id;
        } else if (!myAnswerCorrect && otherAnswerCorrect) {
          // Only opponent got it right - they win regardless of time
          winnerId = isChallenger ? duel.opponent_id : duel.challenger_id;
        } else if (myAnswerCorrect && otherAnswerCorrect) {
          // Both correct - fastest time wins
          if (myTime < (otherTime || Infinity)) {
            winnerId = user.id;
          } else if ((otherTime || Infinity) < myTime) {
            winnerId = isChallenger ? duel.opponent_id : duel.challenger_id;
          }
          // If times are equal, it's a draw (winnerId stays null)
        }
        // If both wrong, it's a draw (winnerId stays null)

        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.winner_id = winnerId;
      }

      const { error } = await supabase
        .from('duels')
        .update(updateData)
        .eq('id', duel.id);

      if (error) throw error;
      
      setHasSubmitted(true);
      toast({
        title: 'Answer submitted!',
        description: otherAnswered ? 'Duel complete!' : 'Waiting for opponent...',
      });
      
      fetchDuel();
    } catch (error: any) {
      toast({
        title: 'Failed to submit',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!duel) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Swords className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="heading-section text-foreground mb-2">Duel Not Found</h1>
          <Button onClick={() => navigate('/duels')}>Back to Duels</Button>
        </div>
      </Layout>
    );
  }

  const challengerName = duel.challenger_profile?.full_name || 'Player 1';
  const opponentName = duel.opponent_profile?.full_name || 'Player 2';

  // Waiting for opponent
  if (duel.status === 'waiting') {
    const isChallenger = duel.challenger_id === user?.id;
    return (
      <Layout>
        <div className="py-16 text-center">
          <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
          <h1 className="heading-section text-foreground mb-2">
            {isChallenger ? 'Waiting for Opponent' : 'Joining Duel...'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isChallenger 
              ? 'The duel will start automatically when someone joins!' 
              : 'Please wait...'}
          </p>
          {duel.problem && (
            <div className="max-w-md mx-auto bg-secondary/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Problem</p>
              <p className="font-semibold">{duel.problem.title}</p>
              {duel.problem.difficulty && (
                <Badge variant="outline" className="mt-2">Level {duel.problem.difficulty}</Badge>
              )}
            </div>
          )}
          <Button variant="outline" onClick={() => navigate('/duels')}>Back to Duels</Button>
        </div>
      </Layout>
    );
  }

  // Duel completed - show results with player names and times
  if (duel.status === 'completed') {
    const isWinner = duel.winner_id === user?.id;
    const isDraw = !duel.winner_id;
    
    // Determine correctness for display
    const correctAnswer = duel.problem?.answer?.toLowerCase().trim();
    const challengerCorrect = duel.challenger_answer?.toLowerCase().trim() === correctAnswer;
    const opponentCorrect = duel.opponent_answer?.toLowerCase().trim() === correctAnswer;
    
    const winnerName = duel.winner_id === duel.challenger_id 
      ? challengerName 
      : duel.winner_id === duel.opponent_id 
        ? opponentName 
        : null;
    
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center">
              <CardContent className="py-12">
                {isDraw ? (
                  <>
                    <Swords className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="heading-section text-foreground mb-2">It's a Draw!</h1>
                    <p className="text-muted-foreground mb-6">
                      {!challengerCorrect && !opponentCorrect 
                        ? 'Neither player got the correct answer' 
                        : 'Both players solved it at the same time'}
                    </p>
                  </>
                ) : isWinner ? (
                  <>
                    <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                    <h1 className="heading-section text-foreground mb-2">You Won! 🎉</h1>
                    <p className="text-muted-foreground mb-6">Congratulations on your victory!</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                    <h1 className="heading-section text-foreground mb-2">You Lost</h1>
                    <p className="text-muted-foreground mb-6">{winnerName} won this round!</p>
                  </>
                )}
                
                {/* Results Table with Names and Times */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <p className="font-semibold">{challengerName}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-2xl font-mono mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>{formatTime(duel.challenger_time_seconds)}</span>
                    </div>
                    <Badge className={challengerCorrect ? 'bg-green-500' : 'bg-red-500'}>
                      {challengerCorrect ? 'Correct' : 'Wrong'}
                    </Badge>
                    {duel.winner_id === duel.challenger_id && (
                      <div className="mt-2">
                        <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <p className="font-semibold">{opponentName}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-2xl font-mono mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>{formatTime(duel.opponent_time_seconds)}</span>
                    </div>
                    <Badge className={opponentCorrect ? 'bg-green-500' : 'bg-red-500'}>
                      {opponentCorrect ? 'Correct' : 'Wrong'}
                    </Badge>
                    {duel.winner_id === duel.opponent_id && (
                      <div className="mt-2">
                        <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
                
                {duel.problem?.answer && (
                  <div className="bg-secondary rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Correct Answer</p>
                    <p className="font-mono text-lg font-bold">{duel.problem.answer}</p>
                  </div>
                )}
                
                <Button onClick={() => navigate('/duels')}>Back to Duels</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  // Active duel
  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Duel Arena</h1>
            </div>
            <Badge variant="outline" className="gap-2 text-lg px-4 py-2">
              <Clock className="h-4 w-4" />
              {formatTime(elapsedTime)}
            </Badge>
          </div>

          {/* Show both player names */}
          <div className="flex justify-between items-center mb-4 p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{challengerName}</span>
              {duel.challenger_id === user?.id && <Badge variant="outline" className="text-xs">You</Badge>}
            </div>
            <Swords className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="font-medium">{opponentName}</span>
              {duel.opponent_id === user?.id && <Badge variant="outline" className="text-xs">You</Badge>}
              <User className="h-4 w-4" />
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{duel.problem?.title || 'Problem'}</span>
                {duel.problem?.difficulty && (
                  <Badge variant="outline">
                    Difficulty: {duel.problem.difficulty}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {duel.problem?.image_url && (
                <img 
                  src={duel.problem.image_url} 
                  alt="Problem" 
                  className="max-w-full rounded-lg mb-4"
                />
              )}
              <p className="text-lg whitespace-pre-wrap">{duel.problem?.statement}</p>
            </CardContent>
          </Card>

          {hasSubmitted ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Answer Submitted!</h2>
                <p className="text-muted-foreground">Waiting for opponent to finish...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Answer (integer, fraction, or decimal)
                    </label>
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="e.g., 42, 1/2, 3.14"
                      className="text-lg"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={submitting || !answer.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Submit Answer
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
}
