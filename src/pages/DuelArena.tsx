import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Clock, CheckCircle, XCircle, Loader2, Trophy } from 'lucide-react';
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
      
      // Cast the data properly
      const duelData = data as unknown as DuelData;
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

  const formatTime = (seconds: number) => {
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
        // Both have answered, determine winner
        const correctAnswer = duel.problem?.answer?.toLowerCase().trim();
        const myAnswerCorrect = answer.trim().toLowerCase() === correctAnswer;
        const otherAnswer = (otherAnswered as string).toLowerCase().trim();
        const otherAnswerCorrect = otherAnswer === correctAnswer;
        
        const myTime = elapsedTime;
        const otherTime = isChallenger ? duel.opponent_time_seconds : duel.challenger_time_seconds;

        let winnerId: string | null = null;
        
        if (myAnswerCorrect && !otherAnswerCorrect) {
          winnerId = user.id;
        } else if (!myAnswerCorrect && otherAnswerCorrect) {
          winnerId = isChallenger ? duel.opponent_id : duel.challenger_id;
        } else if (myAnswerCorrect && otherAnswerCorrect) {
          // Both correct, faster wins
          if (myTime < (otherTime || Infinity)) {
            winnerId = user.id;
          } else {
            winnerId = isChallenger ? duel.opponent_id : duel.challenger_id;
          }
        }
        // If both wrong, no winner

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

  // Waiting for opponent
  if (duel.status === 'waiting') {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
          <h1 className="heading-section text-foreground mb-2">Waiting for Opponent</h1>
          <p className="text-muted-foreground mb-6">Share this duel to challenge someone!</p>
          <Button onClick={() => navigate('/duels')}>Back to Duels</Button>
        </div>
      </Layout>
    );
  }

  // Duel completed
  if (duel.status === 'completed') {
    const isWinner = duel.winner_id === user?.id;
    const isDraw = !duel.winner_id;
    
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
                    <p className="text-muted-foreground mb-6">Neither player got the correct answer</p>
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
                    <p className="text-muted-foreground mb-6">Better luck next time!</p>
                  </>
                )}
                
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
