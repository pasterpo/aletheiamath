import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRatingHistory } from '@/hooks/useUserStats';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface RatingChartProps {
  userId?: string;
  currentRating?: number;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export function RatingChart({ userId, currentRating = 1000 }: RatingChartProps) {
  const { data: history } = useRatingHistory(userId);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  // Filter data based on time range
  const filterData = () => {
    if (!history || history.length === 0) return [];
    
    const now = new Date();
    let cutoff: Date;
    
    switch (timeRange) {
      case '1M':
        cutoff = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3M':
        cutoff = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6M':
        cutoff = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1Y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return history;
    }
    
    return history.filter(h => new Date(h.created_at) >= cutoff);
  };

  const chartData = filterData().map(h => ({
    date: format(new Date(h.created_at), 'MMM d'),
    rating: h.rating,
    fullDate: format(new Date(h.created_at), 'MMM d, yyyy'),
  }));

  // If no history, show a single point at current rating
  if (chartData.length === 0) {
    chartData.push({
      date: 'Now',
      rating: currentRating,
      fullDate: format(new Date(), 'MMM d, yyyy'),
    });
  }

  const minRating = Math.min(...chartData.map(d => d.rating)) - 50;
  const maxRating = Math.max(...chartData.map(d => d.rating)) + 50;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Rating History</CardTitle>
        <div className="flex gap-1">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={[minRating, maxRating]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
              formatter={(value: number) => [value, 'Rating']}
            />
            <ReferenceLine y={1000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="rating" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={chartData.length <= 20}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
