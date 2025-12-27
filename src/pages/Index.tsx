import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { QuickPlayGrid } from '@/components/home/QuickPlayGrid';
import { LiveMathTV } from '@/components/home/LiveMathTV';
import { PuzzleOfTheDay } from '@/components/home/PuzzleOfTheDay';
import { TournamentSidebar } from '@/components/home/TournamentSidebar';
import { PlayerStats } from '@/components/home/PlayerStats';
import { ActionButtons } from '@/components/home/ActionButtons';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        {/* Top bar with player stats */}
        <div className="border-b border-border bg-secondary/30">
          <div className="container py-2 flex items-center justify-between">
            <PlayerStats />
            <Link 
              to="/about" 
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              About Aletheia
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Tournaments */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="sticky top-20">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Tournaments
                </h3>
                <TournamentSidebar />
              </div>
            </div>

            {/* Center Column - Quick Play Grid */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              {/* Tagline */}
              <div className="text-center mb-4">
                <p className="text-muted-foreground text-sm">
                  Aletheia is a free, no-ads, open math platform.{' '}
                  <Link to="/about" className="text-primary hover:underline">
                    About Aletheia...
                  </Link>
                </p>
              </div>

              {/* Quick Play Grid */}
              <QuickPlayGrid />

              {/* Action Buttons */}
              <ActionButtons />

              {/* Sign up CTA for logged out users */}
              {!user && (
                <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-6 text-center border border-primary/20">
                  <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                    Join the Math Arena
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create an account to compete in duels, join tournaments, and track your rating.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/auth?mode=signup">
                      <Button className="btn-premium">
                        Sign Up - It's Free
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="outline">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Live TV & Puzzle */}
            <div className="lg:col-span-3 order-3 space-y-6">
              <div className="sticky top-20 space-y-6">
                {/* Live Math TV */}
                <LiveMathTV />

                {/* Puzzle of the Day */}
                <PuzzleOfTheDay />

                {/* Leaderboard teaser */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Top Players
                  </h3>
                  <TopPlayersPreview />
                  <Link 
                    to="/leaderboard" 
                    className="block text-center text-sm text-primary hover:underline mt-3"
                  >
                    View leaderboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Mini leaderboard preview component
function TopPlayersPreview() {
  const { data: topPlayers } = useQuery({
    queryKey: ['top-players-preview'],
    queryFn: async () => {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('user_id, rating, total_points')
        .order('rating', { ascending: false })
        .limit(5);

      if (!stats?.length) return [];

      const userIds = stats.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      return stats.map((s: any, index: number) => ({
        ...s,
        rank: index + 1,
        name: profiles?.find((p: any) => p.user_id === s.user_id)?.full_name || 'Anonymous'
      }));
    },
  });

  return (
    <div className="space-y-2">
      {topPlayers?.map((player: any) => (
        <div key={player.user_id} className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground w-4">
            {player.rank}
          </span>
          <span className="text-sm text-foreground flex-1 truncate">
            {player.name}
          </span>
          <span className="text-sm font-medium text-primary">
            {player.rating}
          </span>
        </div>
      ))}
      {(!topPlayers || topPlayers.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No players yet
        </p>
      )}
    </div>
  );
}
