import { Card, CardContent } from '@/components/ui/card';
import { Achievement, UserAchievement } from '@/hooks/useLeaderboard';
import { Lock } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: UserAchievement;
}

export function AchievementBadge({ achievement, earned }: AchievementBadgeProps) {
  const isEarned = !!earned;
  
  return (
    <Card className={`card-premium transition-all ${isEarned ? '' : 'opacity-50 grayscale'}`}>
      <CardContent className="p-4 text-center">
        <div className={`text-4xl mb-2 ${isEarned ? '' : 'relative'}`}>
          {achievement.icon || '🏆'}
          {!isEarned && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <h4 className="font-semibold text-sm">{achievement.name}</h4>
        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
        <p className="text-xs font-medium text-primary mt-2">{achievement.points} pts</p>
        {earned && (
          <p className="text-xs text-muted-foreground mt-1">
            Earned {new Date(earned.earned_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
