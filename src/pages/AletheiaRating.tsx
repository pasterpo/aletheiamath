import { useState } from 'react';
import { Trophy, Target, Plus } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProblemCategories, useProblems, Problem } from '@/hooks/useProblems';
import { SolvingInterface } from '@/components/problems/SolvingInterface';
import { useMyRating } from '@/hooks/useRating';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole } from '@/hooks/useRoles';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ProblemEditor } from '@/components/admin/ProblemEditor';

export default function AletheiaRating() {
  const { user } = useAuth();
  const { data: role } = useMyRole();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const { data: categories = [] } = useProblemCategories();
  const { data: problems = [], isLoading } = useProblems(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  const { data: myRating } = useMyRating();

  const isDeveloper = role === 'developer';

  // Filter problems that have answers
  const solvableProblems = problems.filter(p => p.answer);
  const currentProblem = solvableProblems[currentProblemIndex];

  const handleNext = () => {
    if (currentProblemIndex < solvableProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    } else {
      setCurrentProblemIndex(0);
    }
  };

  if (!user) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="heading-subsection mb-2">Sign In Required</h2>
                <p className="text-muted-foreground mb-6">
                  Sign in to compete in Aletheia Rating and track your progress
                </p>
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  // Show problem editor for developers
  if (showEditor) {
    return (
      <Layout>
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <ProblemEditor 
              problemId={null} 
              categories={categories} 
              onClose={() => setShowEditor(false)} 
            />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative py-12 md:py-16 gradient-hero pattern-math">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Aletheia Rating</span>
            </div>
            <h1 className="heading-display text-foreground mb-4">
              Competitive <span className="text-primary">Problem Solving</span>
            </h1>
            <p className="body-large text-muted-foreground mb-4">
              Your Rating: <span className="font-bold text-foreground">{myRating?.rating || 1000}</span>
            </p>
            
            {/* Developer-only Add Problem button */}
            {isDeveloper && (
              <Button onClick={() => setShowEditor(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Problem
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Tabs value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentProblemIndex(0); }} className="mb-6">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All
              </TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.slug} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : solvableProblems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isDeveloper 
                    ? 'No problems yet. Click "Add Problem" above to create one!'
                    : 'No problems available in this category yet'}
                </p>
              </CardContent>
            </Card>
          ) : currentProblem ? (
            <SolvingInterface problem={currentProblem} onNext={handleNext} />
          ) : null}
        </div>
      </section>
    </Layout>
  );
}