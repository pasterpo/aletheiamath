import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Eye, EyeOff, Check, X, SkipForward, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Problem } from '@/hooks/useProblems';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMyRating } from '@/hooks/useRating';
import { useSkipsForCategory, useRecordSkip } from '@/hooks/useSkips';
import { supabase } from '@/integrations/supabase/client';
import katex from 'katex';

interface SolvingInterfaceProps {
  problem: Problem;
  onNext?: () => void;
  onClose?: () => void;
}

function renderLatex(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { throwOnError: false });
    } catch {
      return match;
    }
  });
}

export function SolvingInterface({ problem, onNext, onClose }: SolvingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userAnswer, setUserAnswer] = useState('');
  const [showHints, setShowHints] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [ratingChange, setRatingChange] = useState<number>(0);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const statementRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  
  const { data: myRating, refetch: refetchRating } = useMyRating();
  const { data: skipData } = useSkipsForCategory(problem.category_id);
  const recordSkip = useRecordSkip();

  // Get problem with image
  const problemWithImage = problem as Problem & { image_url?: string };

  useEffect(() => {
    if (statementRef.current) {
      statementRef.current.innerHTML = renderLatex(problem.statement);
    }
  }, [problem.statement]);

  useEffect(() => {
    if (solutionRef.current && problem.solution && showSolution) {
      solutionRef.current.innerHTML = renderLatex(problem.solution);
    }
  }, [problem.solution, showSolution]);

  // Reset state when problem changes
  useEffect(() => {
    setUserAnswer('');
    setResult(null);
    setRatingChange(0);
    setCorrectAnswer(null);
    setShowHints([]);
    setShowSolution(false);
  }, [problem.id]);

  const toggleHint = (index: number) => {
    setShowHints(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit answers',
        variant: 'destructive',
      });
      return;
    }

    if (!userAnswer.trim()) {
      toast({
        title: 'Empty answer',
        description: 'Please enter your answer',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Call edge function for secure server-side verification
      const { data, error } = await supabase.functions.invoke('verify-answer', {
        body: { problemId: problem.id, userAnswer: userAnswer.trim() },
      });

      if (error) throw error;

      const { isCorrect, ratingChange: change, correctAnswer: answer } = data;
      
      setResult(isCorrect ? 'correct' : 'incorrect');
      setRatingChange(change);
      if (answer) setCorrectAnswer(answer);

      // Refetch rating to show updated value
      refetchRating();

      toast({
        title: isCorrect ? '🎉 Correct!' : '❌ Incorrect',
        description: isCorrect 
          ? `You earned ${change} rating points!` 
          : `You lost ${Math.abs(change)} rating points.`,
      });
    } catch (error: any) {
      console.error('Failed to verify answer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify answer',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to skip problems',
        variant: 'destructive',
      });
      return;
    }

    if (!problem.category_id) {
      onNext?.();
      return;
    }

    if (!skipData?.canSkip) {
      toast({
        title: 'Skip limit reached',
        description: 'You have used all 3 skips for this category today',
        variant: 'destructive',
      });
      return;
    }

    try {
      await recordSkip.mutateAsync(problem.category_id);
      toast({
        title: 'Problem skipped',
        description: `${skipData.remaining - 1} skips remaining for this category today`,
      });
      onNext?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to skip problem',
        variant: 'destructive',
      });
    }
  };

  const difficultyColor = () => {
    if (!problem.difficulty) return 'bg-muted text-muted-foreground';
    if (problem.difficulty <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (problem.difficulty <= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (problem.difficulty <= 7) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Rating Display */}
      {user && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rating</p>
                <p className="text-2xl font-bold">{myRating?.rating || 1000}</p>
              </div>
              {result && (
                <div className={`flex items-center gap-2 ${ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ratingChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="font-bold">{ratingChange >= 0 ? '+' : ''}{ratingChange}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Problem Card */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="heading-subsection">{problem.title}</CardTitle>
            <div className="flex items-center gap-2">
              {problem.category && (
                <Badge variant="outline" style={{ borderColor: problem.category.color || undefined }}>
                  {problem.category.name}
                </Badge>
              )}
              <Badge className={difficultyColor()}>
                Level {problem.difficulty}
              </Badge>
            </div>
          </div>
          {problem.source && (
            <p className="text-sm text-muted-foreground">
              Source: {problem.source} {problem.year && `(${problem.year})`}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Problem Image */}
          {problemWithImage.image_url && (
            <div className="rounded-lg overflow-hidden border">
              <img 
                src={problemWithImage.image_url} 
                alt="Problem statement" 
                className="w-full max-h-96 object-contain bg-background"
              />
            </div>
          )}
          <div ref={statementRef} className="text-lg leading-relaxed" />
        </CardContent>
      </Card>

      {/* Hints Section */}
      {problem.hints && problem.hints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              Hints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {problem.hints.map((hint, index) => (
              <div key={index} className="border rounded-lg">
                <button
                  onClick={() => toggleHint(index)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium">Hint {index + 1}</span>
                  {showHints.includes(index) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showHints.includes(index) && (
                  <div className="px-3 pb-3 text-muted-foreground">{hint}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Answer Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Answer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your answer (supports integers, decimals, and fractions like 1/2)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer..."
            disabled={result !== null || submitting}
            className={result ? (result === 'correct' ? 'border-green-500' : 'border-red-500') : ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !result && !submitting) {
                handleSubmit();
              }
            }}
          />
          
          {result && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              result === 'correct' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {result === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span className="font-medium">
                {result === 'correct' ? 'Correct! Well done!' : `Incorrect. The answer was: ${correctAnswer}`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!result && (
              <>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Verifying...' : 'Submit Answer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  disabled={!skipData?.canSkip}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip ({skipData?.remaining ?? 3} left)
                </Button>
              </>
            )}
            {result && onNext && (
              <Button onClick={onNext}>
                Next Problem
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Solution Section */}
      {problem.solution && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Solution</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSolution(!showSolution)}
              >
                {showSolution ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" /> Hide Solution
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Show Solution
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showSolution && (
            <CardContent>
              <div ref={solutionRef} className="text-muted-foreground leading-relaxed" />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}