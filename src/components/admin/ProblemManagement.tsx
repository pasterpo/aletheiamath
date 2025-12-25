import { useState } from 'react';
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProblems, useProblemCategories } from '@/hooks/useProblems';
import { ProblemEditor } from './ProblemEditor';

export function ProblemManagement() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingProblem, setEditingProblem] = useState<string | null>(null);
  const { data: problems = [], isLoading } = useProblems();
  const { data: categories = [] } = useProblemCategories();

  const handleEdit = (problemId: string) => {
    setEditingProblem(problemId);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingProblem(null);
    setShowEditor(true);
  };

  const handleClose = () => {
    setShowEditor(false);
    setEditingProblem(null);
  };

  const difficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'bg-muted text-muted-foreground';
    if (difficulty <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  if (showEditor) {
    return (
      <ProblemEditor
        problemId={editingProblem}
        categories={categories}
        onClose={handleClose}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Problem Management
        </CardTitle>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Problem
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No problems created yet</p>
            <Button onClick={handleCreate} variant="outline" className="mt-4">
              Create your first problem
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              <span className="col-span-2">Title</span>
              <span>Category</span>
              <span>Difficulty</span>
              <span>Has Answer</span>
              <span>Actions</span>
            </div>

            {problems.map((problem) => (
              <div
                key={problem.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="col-span-2">
                  <p className="font-medium line-clamp-1">{problem.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {problem.source} {problem.year && `(${problem.year})`}
                  </p>
                </div>
                <div>
                  {problem.category && (
                    <Badge variant="outline">{problem.category.name}</Badge>
                  )}
                </div>
                <div>
                  <Badge className={difficultyColor(problem.difficulty)}>
                    Level {problem.difficulty}
                  </Badge>
                </div>
                <div>
                  <Badge variant={problem.answer ? 'default' : 'secondary'}>
                    {problem.answer ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(problem.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
