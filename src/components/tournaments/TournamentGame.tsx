import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Swords, Timer, Flame, Flag, Send, AlertTriangle, 
  Check, X, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TournamentGame as TournamentGameType, 
  Tournament,
  useActivateBerserk,
  useSubmitTournamentAnswer,
  useGiveUpGame 
} from '@/hooks/useTournaments';
import katex from 'katex';

interface TournamentGameProps {
  game: TournamentGameType;
  tournament: Tournament;
  onGameEnd: () => void;
}

export function TournamentGame({ game, tournament, onGameEnd }: TournamentGameProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [answer, setAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCountdown, setIsCountdown] = useState(game.status === 'countdown');
  const [countdownValue, setCountdownValue] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  const [renderedProblem, setRenderedProblem] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [afkWarning, setAfkWarning] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const afkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activateBerserk = useActivateBerserk();
  const submitAnswer = useSubmitTournamentAnswer();
  const giveUp = useGiveUpGame();

  const isPlayerA = game.player_a_id === user?.id;
  const myBerserk = isPlayerA ? game.player_a_berserk : game.player_b_berserk;
  const myMistakes = isPlayerA ? game.player_a_mistakes : game.player_b_mistakes;
  const timeLimit = myBerserk 
    ? Math.floor(tournament.time_per_problem_seconds / 2) 
    : tournament.time_per_problem_seconds;

  // Render LaTeX
  useEffect(() => {
    if (game.problem?.statement) {
      try {
        const rendered = game.problem.statement.replace(
          /\$\$([\s\S]*?)\$\$/g,
          (_, tex) => katex.renderToString(tex, { displayMode: true, throwOnError: false })
        ).replace(
          /\$(.*?)\$/g,
          (_, tex) => katex.renderToString(tex, { displayMode: false, throwOnError: false })
        );
        setRenderedProblem(rendered);
      } catch {
        setRenderedProblem(game.problem.statement);
      }
    }
  }, [game.problem?.statement]);

  // Countdown timer
  useEffect(() => {
    if (!isCountdown) return;

    const interval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          setIsCountdown(false);
          startTimeRef.current = Date.now();
          clearInterval(interval);
          inputRef.current?.focus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountdown]);

  // AFK Detection - Auto-resign after 15 seconds of no interaction
  useEffect(() => {
    if (isCountdown || game.status === 'finished' || hasInteracted) return;

    // Start AFK timer when game becomes active
    afkTimeoutRef.current = setTimeout(() => {
      if (!hasInteracted) {
        setAfkWarning(true);
        toast({ 
          title: 'AFK Warning!', 
          description: 'You will be auto-resigned in 5 seconds...',
          variant: 'destructive'
        });
        
        // Give 5 more seconds then auto-resign
        setTimeout(() => {
          if (!hasInteracted) {
            handleAfkResign();
          }
        }, 5000);
      }
    }, 15000); // 15 seconds

    return () => {
      if (afkTimeoutRef.current) {
        clearTimeout(afkTimeoutRef.current);
      }
    };
  }, [isCountdown, game.status, hasInteracted]);

  // Track user interaction
  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setAfkWarning(false);
      if (afkTimeoutRef.current) {
        clearTimeout(afkTimeoutRef.current);
      }
    }
  }, [hasInteracted]);

  // Game timer
  useEffect(() => {
    if (isCountdown || game.status === 'finished') return;

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeElapsed(elapsed);

        // Auto-lose if time runs out
        if (elapsed >= timeLimit) {
          handleGiveUp();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCountdown, game.status, timeLimit]);

  // Lock countdown
  useEffect(() => {
    if (!isLocked || lockCountdown <= 0) return;

    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          inputRef.current?.focus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockCountdown]);

  const handleAfkResign = async () => {
    try {
      await giveUp.mutateAsync(game.id);
      toast({ 
        title: 'AFK Auto-Resign', 
        description: 'You were withdrawn due to inactivity.',
        variant: 'destructive'
      });
      onGameEnd();
    } catch (error) {
      console.error('AFK resign error:', error);
    }
  };

  const handleBerserk = async () => {
    try {
      await activateBerserk.mutateAsync(game.id);
      toast({ title: 'Berserk Activated!', description: 'Half time, +1 point if you win!' });
    } catch (error) {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!answer.trim() || isLocked || isCountdown) return;

    const timeMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

    try {
      const result = await submitAnswer.mutateAsync({
        gameId: game.id,
        answer: answer.trim(),
        timeMs,
      });

      if (result.isCorrect) {
        toast({ 
          title: 'Correct!', 
          description: 'You won this clash!',
          className: 'bg-green-500/20 border-green-500'
        });
        onGameEnd();
      } else {
        // Lock for 5 seconds
        setIsLocked(true);
        setLockCountdown(5);
        setAnswer('');
        
        if ((result.mistakes as number) >= 3) {
          toast({ 
            title: 'Too many mistakes!', 
            description: 'You lost this clash.',
            variant: 'destructive'
          });
          onGameEnd();
        } else {
          toast({ 
            title: 'Wrong Answer', 
            description: `${3 - (result.mistakes as number)} attempts remaining`,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleGiveUp = async () => {
    try {
      await giveUp.mutateAsync(game.id);
      toast({ title: 'You resigned', description: 'Better luck next time!' });
      onGameEnd();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const timeProgress = (timeElapsed / timeLimit) * 100;
  const timeColor = timeProgress > 80 ? 'text-red-500' : timeProgress > 50 ? 'text-yellow-500' : 'text-foreground';

  // Countdown screen
  if (isCountdown) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <div className="text-6xl font-bold mb-6 animate-pulse">
              {countdownValue}
            </div>
            <p className="text-muted-foreground mb-6">Get ready...</p>
            
            {!myBerserk && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleBerserk}
                disabled={activateBerserk.isPending}
                className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
              >
                <Swords className="h-5 w-5 mr-2" />
                Berserk! (½ time, +1 point)
              </Button>
            )}
            
            {myBerserk && (
              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                <Flame className="h-4 w-4 mr-1" />
                Berserk Activated!
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Swords className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">{tournament.name}</span>
            {myBerserk && (
              <Badge className="bg-orange-500/20 text-orange-500">
                <Flame className="h-3 w-3 mr-1" /> Berserk
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeColor}`}>
              <Timer className="h-5 w-5" />
              {Math.floor((timeLimit - timeElapsed) / 60)}:
              {((timeLimit - timeElapsed) % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Time Progress */}
        <Progress value={timeProgress} className="h-1 mb-6" />

        {/* Problem */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{game.problem?.title || 'Problem'}</span>
              {game.problem?.difficulty && (
                <Badge variant="outline">
                  Difficulty: {game.problem.difficulty}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: renderedProblem }}
            />
          </CardContent>
        </Card>

        {/* Mistakes indicator */}
        {myMistakes > 0 && (
          <div className="flex items-center gap-2 mb-4 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Mistakes: {myMistakes}/3</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <X 
                  key={i} 
                  className={`h-4 w-4 ${i < myMistakes ? 'text-destructive' : 'text-muted-foreground/30'}`} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Answer Input */}
        <Card>
          <CardContent className="py-4">
            {isLocked ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-destructive mb-2 animate-pulse">
                  {lockCountdown}
                </div>
                <p className="text-muted-foreground">Locked after wrong answer...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    handleInteraction();
                  }}
                  onKeyDown={handleInteraction}
                  placeholder="Enter your answer..."
                  className="flex-1 text-lg"
                  autoFocus
                  disabled={submitAnswer.isPending}
                />
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={!answer.trim() || submitAnswer.isPending}
                >
                  {submitAnswer.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Give Up Button */}
        <div className="mt-6 flex justify-center">
          {!showGiveUpConfirm ? (
            <Button 
              variant="ghost" 
              className="text-muted-foreground"
              onClick={() => setShowGiveUpConfirm(true)}
            >
              <Flag className="h-4 w-4 mr-2" />
              Give Up
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Are you sure?</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleGiveUp}
                disabled={giveUp.isPending}
              >
                Yes, resign
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowGiveUpConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
