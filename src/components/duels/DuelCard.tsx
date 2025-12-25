import { Swords, Clock, Trophy, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Duel } from '@/hooks/useDuels';
import { useAuth } from '@/contexts/AuthContext';

interface DuelCardProps {
  duel: Duel;
  onJoin?: () => void;
  onView?: () => void;
}

const statusColors: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export function DuelCard({ duel, onJoin, onView }: DuelCardProps) {
  const { user } = useAuth();
  const isChallenger = duel.challenger_id === user?.id;
  const isOpponent = duel.opponent_id === user?.id;
  const isParticipant = isChallenger || isOpponent;
  const isWinner = duel.winner_id === user?.id;
  
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };
  
  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Math Duel
          </CardTitle>
          <Badge className={statusColors[duel.status]}>
            {duel.status === 'waiting' ? 'Waiting for opponent' : duel.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {duel.problem && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Problem</p>
            <p className="font-medium">{duel.problem.title}</p>
            {duel.problem.difficulty && (
              <Badge variant="outline" className="mt-1">
                Level {duel.problem.difficulty}
              </Badge>
            )}
          </div>
        )}
        
        {duel.status === 'completed' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <User className="w-3 h-3" /> Challenger
              </p>
              <p className="font-mono text-lg flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(duel.challenger_time_seconds)}
              </p>
              {duel.winner_id === duel.challenger_id && (
                <Trophy className="w-5 h-5 text-accent mx-auto mt-1" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <User className="w-3 h-3" /> Opponent
              </p>
              <p className="font-mono text-lg flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(duel.opponent_time_seconds)}
              </p>
              {duel.winner_id === duel.opponent_id && (
                <Trophy className="w-5 h-5 text-accent mx-auto mt-1" />
              )}
            </div>
          </div>
        )}
        
        {isParticipant && isWinner && duel.status === 'completed' && (
          <div className="text-center py-2 bg-accent/10 rounded-lg">
            <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="font-semibold text-accent">You Won!</p>
          </div>
        )}
        
        <div className="flex gap-2">
          {duel.status === 'waiting' && !isChallenger && onJoin && (
            <Button onClick={onJoin} className="w-full">
              Join Duel
            </Button>
          )}
          {duel.status === 'waiting' && isChallenger && onView && (
            <Button onClick={onView} className="w-full" variant="outline">
              View Waiting Room
            </Button>
          )}
          {isParticipant && duel.status === 'active' && onView && (
            <Button onClick={onView} className="w-full">
              Enter Arena
            </Button>
          )}
          {duel.status === 'completed' && onView && (
            <Button variant="outline" onClick={onView} className="w-full">
              View Results
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
