import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardTableProps {
  stats: UserStats[];
  title?: string;
}

export function LeaderboardTable({ stats, title = 'Leaderboard' }: LeaderboardTableProps) {
  const { user } = useAuth();
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };
  
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const isCurrentUser = stat.user_id === user?.id;
            return (
              <div 
                key={stat.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={stat.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {stat.profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {stat.profile?.full_name || 'Anonymous'}
                    {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{stat.problems_solved} solved</span>
                    <span>{stat.duels_won} wins</span>
                    <span>{stat.videos_watched} videos</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{stat.total_points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            );
          })}
          
          {stats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No rankings yet. Be the first!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
