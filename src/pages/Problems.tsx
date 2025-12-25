import { useState } from 'react';
import { Search, Filter, Target, ArrowLeft, Settings } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { ProblemDetail } from '@/components/problems/ProblemDetail';
import { useProblemCategories, useProblems, Problem } from '@/hooks/useProblems';
import { useMyRole } from '@/hooks/useRoles';
import { ProblemEditor } from '@/components/admin/ProblemEditor';

export default function Problems() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [showProblemEditor, setShowProblemEditor] = useState(false);
  const { data: myRole } = useMyRole();
  
  const { data: categories = [] } = useProblemCategories();
  const { data: problems = [], isLoading } = useProblems(
    selectedCategory === 'all' ? undefined : selectedCategory,
    selectedDifficulty === 'all' ? undefined : parseInt(selectedDifficulty)
  );
  
  const filteredProblems = problems.filter(problem => 
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (activeProblem) {
    return (
      <Layout>
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Button 
              variant="ghost" 
              onClick={() => setActiveProblem(null)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Problems
            </Button>
            <ProblemDetail problem={activeProblem} />
          </div>
        </section>
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 gradient-hero pattern-math">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Problem Archive</span>
            </div>
            <h1 className="heading-display text-foreground mb-6">
              Olympiad Problem
              <span className="text-primary"> Collection</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance mb-6">
              Challenge yourself with carefully curated problems from mathematical olympiads 
              and competitions worldwide. Hints and solutions included.
            </p>
            {myRole === 'developer' && (
              <Button variant="outline" onClick={() => setShowProblemEditor(true)}>
                <Settings className="w-5 h-5 mr-2" />
                Add Problem
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Problem Editor Modal for Developers */}
      {showProblemEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add Problem</h2>
                <Button variant="ghost" onClick={() => setShowProblemEditor(false)}>×</Button>
              </div>
              <ProblemEditor problemId={null} categories={categories} onClose={() => setShowProblemEditor(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search problems by title, content, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All Problems
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.slug}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  style={{ 
                    borderColor: category.color || undefined,
                  }}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Problem List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="space-y-4">
              {filteredProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  onClick={() => setActiveProblem(problem)}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="heading-subsection text-muted-foreground mb-2">No problems found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search or filters' : 'Check back soon for new problems'}
              </p>
            </div>
          )}

          {/* Stats Summary */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{problems.length}</p>
              <p className="text-sm text-muted-foreground">Total Problems</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {problems.filter(p => (p.difficulty || 0) >= 7).length}
              </p>
              <p className="text-sm text-muted-foreground">Hard Problems</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {new Set(problems.map(p => p.source).filter(Boolean)).size}
              </p>
              <p className="text-sm text-muted-foreground">Sources</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
