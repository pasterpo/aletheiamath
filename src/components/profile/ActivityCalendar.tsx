import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProblemStats } from '@/hooks/useUserStats';
import { format, eachDayOfInterval, subDays, startOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityCalendarProps {
  userId?: string;
}

export function ActivityCalendar({ userId }: ActivityCalendarProps) {
  const { data: stats } = useUserProblemStats(userId);

  // Get last 90 days
  const today = new Date();
  const days = eachDayOfInterval({
    start: subDays(today, 89),
    end: today,
  });

  // Count activities per day
  const activityMap = new Map<string, number>();
  stats?.forEach(stat => {
    const day = format(startOfDay(new Date(stat.created_at)), 'yyyy-MM-dd');
    activityMap.set(day, (activityMap.get(day) || 0) + 1);
  });

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-green-500/30';
    if (count <= 3) return 'bg-green-500/50';
    if (count <= 5) return 'bg-green-500/70';
    return 'bg-green-500';
  };

  // Group days into weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const count = activityMap.get(dateKey) || 0;
                  
                  return (
                    <Tooltip key={dateKey}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`w-3 h-3 rounded-sm ${getIntensity(count)} cursor-pointer`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {format(day, 'MMM d, yyyy')}: {count} problem{count !== 1 ? 's' : ''}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-green-500/30" />
            <div className="w-3 h-3 rounded-sm bg-green-500/50" />
            <div className="w-3 h-3 rounded-sm bg-green-500/70" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
