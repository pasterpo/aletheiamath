import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Clock, Swords, Plus, Calendar, Zap } from 'lucide-react';
import { useTournaments, Tournament, TournamentStatus } from '@/hooks/useTournaments';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole } from '@/hooks/useRoles';
import { CreateTournamentDialog } from '@/components/tournaments/CreateTournamentDialog';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';

const statusColors: Record<TournamentStatus, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  finished: 'bg-muted text-muted-foreground border-border',
};

const typeColors: Record<string, string> = {
  arena: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  swiss: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function Tournaments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myRole } = useMyRole();
  const hasRole = (role: string) => myRole === role;
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'finished'>('upcoming');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: allTournaments, isLoading } = useTournaments();

  const upcomingTournaments = allTournaments?.filter(t => t.status === 'scheduled') || [];
  const activeTournaments = allTournaments?.filter(t => t.status === 'active') || [];
  const finishedTournaments = allTournaments?.filter(t => t.status === 'finished') || [];

  const canCreateTournament = hasRole('developer') || hasRole('staff');

  const formatStartTime = (startTime: string) => {
    const date = new Date(startTime);
    if (isPast(date)) {
      return `Started ${formatDistanceToNow(date)} ago`;
    }
    if (isFuture(date)) {
      return `Starts ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
    return format(date, 'PPp');
  };

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {tournament.name}
            </CardTitle>
            {tournament.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {tournament.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={typeColors[tournament.tournament_type]}>
              {tournament.tournament_type === 'arena' ? (
                <><Zap className="h-3 w-3 mr-1" /> Arena</>
              ) : (
                <><Swords className="h-3 w-3 mr-1" /> Swiss</>
              )}
            </Badge>
            <Badge variant="outline" className={statusColors[tournament.status]}>
              {tournament.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatStartTime(tournament.start_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{tournament.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{tournament.participant_count || 0} players</span>
          </div>
        </div>
        {(tournament.min_rating > 0 || tournament.max_rating < 9999) && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Rating: {tournament.min_rating} - {tournament.max_rating}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                Tournaments
              </h1>
              <p className="text-muted-foreground mt-1">
                Compete in real-time math battles against other players
              </p>
            </div>
            {canCreateTournament && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>
        </div>

        {/* Active Tournaments Banner */}
        {activeTournaments.length > 0 && (
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">
                    {activeTournaments.length} tournament{activeTournaments.length > 1 ? 's' : ''} in progress
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/tournaments/${activeTournaments[0].id}`)}
                >
                  Join Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({upcomingTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Zap className="h-4 w-4" />
              Active ({activeTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="finished" className="gap-2">
              <Trophy className="h-4 w-4" />
              Finished ({finishedTournaments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-32" />
                  </Card>
                ))}
              </div>
            ) : upcomingTournaments.length > 0 ? (
              <div className="space-y-4">
                {upcomingTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming tournaments scheduled" />
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeTournaments.length > 0 ? (
              <div className="space-y-4">
                {activeTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState message="No active tournaments right now" />
            )}
          </TabsContent>

          <TabsContent value="finished">
            {finishedTournaments.length > 0 ? (
              <div className="space-y-4">
                {finishedTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState message="No finished tournaments yet" />
            )}
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How Tournaments Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Arena Format
                </h4>
                <p className="text-sm text-muted-foreground">
                  Continuous pairing system. Win to earn points and build streaks. 
                  The more you win consecutively, the more points you earn. 
                  Activate Berserk mode to risk your time for bonus points!
                </p>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Swords className="h-4 w-4 text-purple-500" />
                  Swiss Format
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fixed rounds where players with similar scores are paired. 
                  Fair and balanced competition with no repeat opponents. 
                  Join late and still compete with half-point byes for missed rounds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateTournamentDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </Layout>
  );
}
