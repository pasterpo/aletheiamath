import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Eye, EyeOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Problem } from '@/hooks/useProblems';
import { useSubmitSolution } from '@/hooks/useProblems';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import katex from 'katex';
import { AIGradingInterface } from './AIGradingInterface';

interface ProblemDetailProps {
  problem: Problem;
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

export function ProblemDetail({ problem, onClose }: ProblemDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showHints, setShowHints] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const statementRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  
  const submitMutation = useSubmitSolution();
  
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
        description: 'Please sign in to submit solutions',
        variant: 'destructive',
      });
      return;
    }
    
    if (!solution.trim()) {
      toast({
        title: 'Empty solution',
        description: 'Please write your solution before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        problemId: problem.id,
        solutionText: solution,
      });
      toast({
        title: 'Solution submitted!',
        description: 'Your solution has been recorded.',
      });
      setSolution('');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
        <CardContent>
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
                  <div className="px-3 pb-3 text-muted-foreground">
                    {hint}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
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
      
      {/* AI Grading Interface */}
      {problem.solution && (
        <AIGradingInterface problem={problem} />
      )}
      
      {/* Submit Solution (legacy) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Write Your Solution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record your solution for personal reference
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your solution here... You can use $...$ for LaTeX notation."
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="min-h-[150px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting} variant="outline">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Save Solution'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
