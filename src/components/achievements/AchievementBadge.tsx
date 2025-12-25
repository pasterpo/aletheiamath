import { Card, CardContent } from '@/components/ui/card';
import { Achievement, UserAchievement } from '@/hooks/useLeaderboard';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ achievement, earned, size = 'md' }: AchievementBadgeProps) {
  const isEarned = !!earned;
  
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`card-premium transition-all hover:scale-105 cursor-pointer ${isEarned ? '' : 'opacity-50 grayscale'}`}>
            <CardContent className={`${sizeClasses[size]} text-center`}>
              <div className={`${iconSizes[size]} mb-2 ${isEarned ? '' : 'relative'}`}>
                {achievement.icon || '🏆'}
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-sm">{achievement.name}</h4>
              {size !== 'sm' && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  <p className="text-xs font-medium text-primary mt-2">{achievement.points} pts</p>
                </>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            {earned && (
              <p className="text-xs text-green-500 mt-1">
                Earned {new Date(earned.earned_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
