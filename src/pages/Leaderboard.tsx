import { Trophy, Medal, Award, Star, TrendingUp, Zap, Brain, Swords } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useLeaderboard, useMyStats } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useLeaderboard(50);
  const { data: myStats } = useMyStats();
  
  // Sort leaderboards by different criteria
  const byProblems = [...leaderboard].sort((a, b) => (b.problems_solved || 0) - (a.problems_solved || 0));
  const byRating = [...leaderboard].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const byWins = [...leaderboard].sort((a, b) => (b.duels_won || 0) - (a.duels_won || 0));
  
  const userRank = user ? leaderboard.findIndex(s => s.user_id === user.id) + 1 : null;
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardList = ({ data, valueKey, valueLabel }: { data: typeof leaderboard; valueKey: 'problems_solved' | 'rating' | 'duels_won'; valueLabel: string }) => (
    <div className="space-y-2">
      {data.slice(0, 20).map((stat, index) => {
        const isCurrentUser = user && stat.user_id === user.id;
        return (
          <Link 
            key={stat.id} 
            to={`/profile?id=${stat.user_id}`}
            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 hover:bg-secondary'}`}
          >
            <div className="w-8 flex justify-center">{getRankIcon(index + 1)}</div>
            <Avatar className="w-8 h-8">
              <AvatarImage src={stat.profile?.avatar_url || undefined} />
              <AvatarFallback>{stat.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium hover:underline">
                {stat.profile?.full_name || 'Anonymous'}
                {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{stat[valueKey] || 0}</p>
              <p className="text-xs text-muted-foreground">{valueLabel}</p>
            </div>
          </Link>
        );
      })}
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No data yet</div>
      )}
    </div>
  );
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 gradient-hero pattern-math">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Hall of Fame</span>
            </div>
            <h1 className="heading-display text-foreground mb-6">
              Leaderboard &
              <span className="text-primary"> Rankings</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance">
              See how you rank against other mathematicians across different categories.
            </p>
          </div>
        </div>
      </section>

      {/* User Stats Card */}
      {user && myStats && (
        <section className="py-6 -mt-8 relative z-10">
          <div className="container mx-auto px-4">
            <Card className="card-elevated max-w-4xl mx-auto">
              <CardContent className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      {userRank && userRank <= 3 ? (
                        userRank === 1 ? <Trophy className="w-8 h-8 text-yellow-500" /> :
                        userRank === 2 ? <Medal className="w-8 h-8 text-gray-400" /> :
                        <Award className="w-8 h-8 text-amber-600" />
                      ) : (
                        <span className="text-2xl font-bold text-primary">#{userRank || '?'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Rank</p>
                      <p className="text-2xl font-bold">
                        {userRank ? `#${userRank}` : 'Unranked'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{myStats.rating || 1000}</p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{myStats.problems_solved || 0}</p>
                      <p className="text-sm text-muted-foreground">Problems</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{myStats.duels_won || 0}</p>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold flex items-center gap-1">
                        <Zap className="w-5 h-5 text-orange-500" />
                        {myStats.current_streak || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="rating">
            <TabsList className="mb-8">
              <TabsTrigger value="rating" className="gap-2">
                <Brain className="w-4 h-4" />
                Aletheia Rating
              </TabsTrigger>
              <TabsTrigger value="problems" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Most Problems
              </TabsTrigger>
              <TabsTrigger value="wins" className="gap-2">
                <Swords className="w-4 h-4" />
                Most Wins
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rating">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Top by Aletheia Rating
                    </h3>
                    {loadingLeaderboard ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <LeaderboardList data={byRating} valueKey="rating" valueLabel="rating" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="problems">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Top Problem Solvers
                    </h3>
                    {loadingLeaderboard ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <LeaderboardList data={byProblems} valueKey="problems_solved" valueLabel="solved" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="wins">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Swords className="w-5 h-5 text-yellow-500" />
                      Top Duel Winners
                    </h3>
                    {loadingLeaderboard ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <LeaderboardList data={byWins} valueKey="duels_won" valueLabel="wins" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {!user && (
            <div className="text-center mt-8">
              <Button onClick={() => navigate('/auth')}>Sign In to Track Your Progress</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
