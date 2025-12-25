import { Trophy, Medal, Award, Star, TrendingUp, Zap } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { useLeaderboard, useAchievements, useMyAchievements, useMyStats } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useLeaderboard(20);
  const { data: achievements = [], isLoading: loadingAchievements } = useAchievements();
  const { data: myAchievements = [] } = useMyAchievements();
  const { data: myStats } = useMyStats();
  
  const getAchievementEarned = (achievementId: string) => {
    return myAchievements.find(ua => ua.achievement_id === achievementId);
  };
  
  const userRank = user ? leaderboard.findIndex(s => s.user_id === user.id) + 1 : null;
  
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
              <span className="text-primary"> Achievements</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance">
              See how you rank against other mathematicians. Earn achievements, 
              climb the rankings, and prove your mathematical prowess.
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
                      <p className="text-2xl font-bold text-primary">{myStats.total_points}</p>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{myStats.problems_solved}</p>
                      <p className="text-sm text-muted-foreground">Problems</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{myStats.duels_won}</p>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold flex items-center gap-1">
                        <Zap className="w-5 h-5 text-orange-500" />
                        {myStats.current_streak}
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
          <Tabs defaultValue="leaderboard">
            <TabsList className="mb-8">
              <TabsTrigger value="leaderboard" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2">
                <Star className="w-4 h-4" />
                Achievements
                {myAchievements.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {myAchievements.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="leaderboard">
              <div className="max-w-3xl mx-auto">
                {loadingLeaderboard ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </CardContent>
                  </Card>
                ) : leaderboard.length > 0 ? (
                  <LeaderboardTable stats={leaderboard} title="Top Mathematicians" />
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <TrendingUp className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="heading-subsection text-muted-foreground mb-2">
                        No rankings yet
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Be the first to earn points and appear on the leaderboard!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={() => navigate('/problems')}>
                          Solve Problems
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/duels')}>
                          Start a Duel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="achievements">
              {loadingAchievements ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-square bg-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div>
                  {/* Progress Summary */}
                  <Card className="mb-8">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">Achievement Progress</h3>
                          <p className="text-muted-foreground">
                            {myAchievements.length} of {achievements.length} unlocked
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ 
                                width: `${(myAchievements.length / achievements.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round((myAchievements.length / achievements.length) * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Achievement Categories */}
                  {['learning', 'problems', 'duels', 'special'].map((category) => {
                    const categoryAchievements = achievements.filter(a => a.category === category);
                    if (categoryAchievements.length === 0) return null;
                    
                    return (
                      <div key={category} className="mb-8">
                        <h3 className="font-semibold capitalize mb-4 flex items-center gap-2">
                          {category === 'learning' && <Star className="w-5 h-5 text-blue-500" />}
                          {category === 'problems' && <Award className="w-5 h-5 text-green-500" />}
                          {category === 'duels' && <Trophy className="w-5 h-5 text-yellow-500" />}
                          {category === 'special' && <Zap className="w-5 h-5 text-purple-500" />}
                          {category} Achievements
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {categoryAchievements.map((achievement) => (
                            <AchievementBadge
                              key={achievement.id}
                              achievement={achievement}
                              earned={getAchievementEarned(achievement.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
