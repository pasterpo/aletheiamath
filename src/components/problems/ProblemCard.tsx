import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Problem } from '@/hooks/useProblems';
import katex from 'katex';

interface ProblemCardProps {
  problem: Problem;
  onClick?: () => void;
  compact?: boolean;
}

function renderLatex(text: string): string {
  // Replace $...$ with rendered LaTeX
  return text.replace(/\$([^$]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { throwOnError: false });
    } catch {
      return match;
    }
  });
}

export function ProblemCard({ problem, onClick, compact }: ProblemCardProps) {
  const statementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (statementRef.current) {
      statementRef.current.innerHTML = renderLatex(problem.statement);
    }
  }, [problem.statement]);
  
  const difficultyColor = () => {
    if (!problem.difficulty) return 'bg-muted text-muted-foreground';
    if (problem.difficulty <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (problem.difficulty <= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (problem.difficulty <= 7) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };
  
  return (
    <Card 
      className={`card-premium ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{problem.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {problem.category && (
              <Badge 
                variant="outline" 
                style={{ borderColor: problem.category.color || undefined }}
              >
                {problem.category.name}
              </Badge>
            )}
            <Badge className={difficultyColor()}>
              Level {problem.difficulty}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={statementRef} 
          className={`text-muted-foreground ${compact ? 'line-clamp-2' : ''}`}
        />
        {!compact && problem.source && (
          <p className="text-sm text-muted-foreground mt-4">
            Source: {problem.source} {problem.year && `(${problem.year})`}
          </p>
        )}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {problem.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
