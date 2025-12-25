import { useState } from 'react';
import { Swords, Plus, Trophy, Clock, Users, Settings } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DuelCard } from '@/components/duels/DuelCard';
import { useAvailableDuels, useMyDuels, useCreateDuel, useJoinDuel } from '@/hooks/useDuels';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMyRole } from '@/hooks/useRoles';
import { ProblemEditor } from '@/components/admin/ProblemEditor';
import { useProblemCategories } from '@/hooks/useProblems';

export default function Duels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [showProblemEditor, setShowProblemEditor] = useState(false);
  const { data: myRole } = useMyRole();
  const { data: categories = [] } = useProblemCategories();
  const { data: availableDuels = [], isLoading: loadingAvailable } = useAvailableDuels();
  const { data: myDuels = [], isLoading: loadingMy } = useMyDuels();
  const createDuel = useCreateDuel();
  const joinDuel = useJoinDuel();
  
  const handleCreateDuel = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a duel',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    try {
      const newDuel = await createDuel.mutateAsync(undefined);
      toast({
        title: 'Duel Created!',
        description: 'Waiting for an opponent to join...',
      });
      // Redirect to duel arena immediately - they'll wait there
      navigate(`/duel/${newDuel.id}`);
    } catch (error) {
      toast({
        title: 'Failed to create duel',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };
  
  const handleJoinDuel = async (duelId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join a duel',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    try {
      await joinDuel.mutateAsync(duelId);
      toast({
        title: 'Duel Joined!',
        description: 'The battle begins!',
      });
      // Redirect to duel arena
      navigate(`/duel/${duelId}`);
    } catch (error) {
      toast({
        title: 'Failed to join duel',
        description: 'The duel may no longer be available',
        variant: 'destructive',
      });
    }
  };
  
  const handleViewDuel = (duelId: string) => {
    navigate(`/duel/${duelId}`);
  };
  
  const activeDuels = myDuels.filter(d => d.status === 'active');
  const completedDuels = myDuels.filter(d => d.status === 'completed');
  const waitingDuels = myDuels.filter(d => d.status === 'waiting');
  
  const stats = {
    totalDuels: myDuels.length,
    wins: completedDuels.filter(d => d.winner_id === user?.id).length,
    active: activeDuels.length,
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 gradient-hero pattern-math">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Swords className="w-4 h-4" />
              <span className="text-sm font-medium">Math Duels Arena</span>
            </div>
            <h1 className="heading-display text-foreground mb-6">
              Challenge Your
              <span className="text-primary"> Mathematical Mind</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance mb-8">
              Compete head-to-head in real-time math battles. Solve problems faster than 
              your opponent to climb the leaderboard.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="btn-premium" onClick={handleCreateDuel}>
                <Plus className="w-5 h-5 mr-2" />
                Create New Duel
              </Button>
              {myRole === 'developer' && (
                <Button size="lg" variant="outline" onClick={() => setShowProblemEditor(true)}>
                  <Settings className="w-5 h-5 mr-2" />
                  Add Problem
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Editor Modal for Developers */}
      {showProblemEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add Problem for Duels</h2>
                <Button variant="ghost" onClick={() => setShowProblemEditor(false)}>×</Button>
              </div>
              <ProblemEditor problemId={null} categories={categories} onClose={() => setShowProblemEditor(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {user && (
        <section className="py-6 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                <span className="font-semibold">{stats.totalDuels}</span>
                <span className="text-muted-foreground">Total Duels</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-semibold">{stats.wins}</span>
                <span className="text-muted-foreground">Victories</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">{stats.active}</span>
                <span className="text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="available" className="gap-2">
                <Users className="w-4 h-4" />
                Available Duels
                {availableDuels.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {availableDuels.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="my" className="gap-2">
                <Swords className="w-4 h-4" />
                My Duels
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="available">
              {loadingAvailable ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : availableDuels.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableDuels.map((duel) => (
                    <DuelCard
                      key={duel.id}
                      duel={duel}
                      onJoin={() => handleJoinDuel(duel.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Swords className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="heading-subsection text-muted-foreground mb-2">
                      No duels available
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to create a duel and challenge others!
                    </p>
                    <Button onClick={handleCreateDuel}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Duel
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="my">
              {!user ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Swords className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="heading-subsection text-muted-foreground mb-2">
                      Sign in to view your duels
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Track your battles and climb the leaderboard
                    </p>
                    <Button onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              ) : loadingMy ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : myDuels.length > 0 ? (
                <div className="space-y-8">
                  {waitingDuels.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        Waiting for Opponent
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {waitingDuels.map((duel) => (
                          <DuelCard key={duel.id} duel={duel} onView={() => handleViewDuel(duel.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeDuels.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-blue-500" />
                        Active Duels
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeDuels.map((duel) => (
                          <DuelCard key={duel.id} duel={duel} onView={() => handleViewDuel(duel.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {completedDuels.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-green-500" />
                        Completed Duels
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedDuels.map((duel) => (
                          <DuelCard key={duel.id} duel={duel} onView={() => handleViewDuel(duel.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Swords className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="heading-subsection text-muted-foreground mb-2">
                      No duels yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first duel or join an existing one!
                    </p>
                    <Button onClick={handleCreateDuel}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Duel
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-section text-foreground mb-4">How Duels Work</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Create or Join</h3>
              <p className="text-muted-foreground text-sm">
                Start a new duel or join one that's waiting for an opponent
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Solve the Problem</h3>
              <p className="text-muted-foreground text-sm">
                Both players receive the same problem and race to solve it
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Claim Victory</h3>
              <p className="text-muted-foreground text-sm">
                The fastest correct answer wins! Earn points and climb the rankings
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
