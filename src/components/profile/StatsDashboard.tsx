import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStatsSummary, useTopicPerformance } from '@/hooks/useUserStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Target, Clock, TrendingUp, Award } from 'lucide-react';

interface StatsDashboardProps {
  userId?: string;
}

export function StatsDashboard({ userId }: StatsDashboardProps) {
  const stats = useUserStatsSummary(userId);
  const topicPerformance = useTopicPerformance(userId);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Prepare radar chart data
  const radarData = topicPerformance.slice(0, 8).map(t => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + '...' : t.topic,
    value: t.percentage,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProblems}</p>
                <p className="text-xs text-muted-foreground">Problems Attempted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.solveRate}%</p>
                <p className="text-xs text-muted-foreground">Solve Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{formatTime(stats.averageTime)}</p>
                <p className="text-xs text-muted-foreground">Avg. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{stats.correctCount}</p>
                <p className="text-xs text-muted-foreground">Solved Correctly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.difficultyDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.difficultyDistribution}>
                  <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'correct' ? 'Correct' : 'Total'
                    ]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--muted-foreground))" opacity={0.3} name="total" />
                  <Bar dataKey="correct" fill="hsl(var(--primary))" name="correct" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data yet. Solve some problems!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Topic Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="topic" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Need more topics to show radar chart
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topic Performance Table */}
      {topicPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicPerformance.map((topic) => (
                <div key={topic.topic} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.correct}/{topic.total} solved
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          topic.percentage >= 70 
                            ? 'bg-green-500' 
                            : topic.percentage >= 40 
                              ? 'bg-amber-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${
                    topic.percentage >= 70 
                      ? 'text-green-500' 
                      : topic.percentage >= 40 
                        ? 'text-amber-500' 
                        : 'text-red-500'
                  }`}>
                    {topic.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
