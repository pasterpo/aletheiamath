import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole, useUpdateUserRole, AppRole } from '@/hooks/useRoles';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { useUserStatsById } from '@/hooks/useUserStatsById';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Mail, Calendar, Loader2, Save, Shield, UserPlus, 
  MessageCircle, Swords, Ban, TrendingUp, Target, Award, Flame
} from 'lucide-react';
import { StatsDashboard } from '@/components/profile/StatsDashboard';
import { RatingChart } from '@/components/profile/RatingChart';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { AchievementsDisplay } from '@/components/profile/AchievementsDisplay';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface UserRoleData {
  role: AppRole;
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewUserId = searchParams.get('id');
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: myRole, isLoading: roleLoading } = useMyRole();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  const sendFriendRequest = useSendFriendRequest();
  const { data: friends } = useFriends();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewedUserRole, setViewedUserRole] = useState<AppRole>('member');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');

  const isViewingOther = viewUserId && viewUserId !== user?.id;
  const isDeveloper = myRole === 'developer';
  const targetUserId = viewUserId || user?.id;

  // Get user stats
  const { data: userStats } = useUserStatsById(targetUserId || null);

  // Check if already friends
  const isFriend = friends?.some(f => 
    f.profile?.user_id === viewUserId
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfile(targetUserId);
    }
  }, [targetUserId]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        if (!isViewingOther) {
          setFullName(data.full_name || '');
        }
      }

      // Fetch role for viewed user
      if (isDeveloper && userId !== user?.id) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (roleData) {
          setViewedUserRole((roleData as UserRoleData).role);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });

      fetchProfile(user.id);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async () => {
    if (!viewUserId || !isDeveloper) return;

    try {
      await updateRole.mutateAsync({ userId: viewUserId, newRole: 'staff' });
      setViewedUserRole('staff');
      toast({
        title: 'User promoted',
        description: 'User has been promoted to staff',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to promote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddFriend = async () => {
    if (!viewUserId) return;
    try {
      await sendFriendRequest.mutateAsync(viewUserId);
      toast({ title: 'Friend request sent!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleChallenge = () => {
    navigate('/duels');
    toast({ title: 'Create a duel to challenge this user!' });
  };

  const handleMessage = () => {
    navigate('/friends');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const rating = userStats?.rating || 1000;
  const problemsSolved = userStats?.problems_solved || 0;
  const duelsWon = userStats?.duels_won || 0;
  const duelsPlayed = userStats?.duels_played || 0;
  const currentStreak = userStats?.current_streak || 0;

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Profile Header - Lichess Style */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left: User Info & Actions */}
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground">
                    {profile?.full_name || 'AletheiaMath Student'}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    }) : 'recently'}
                  </p>
                  
                  {/* Role Badge */}
                  <Badge variant="secondary" className="gap-2 capitalize mt-3">
                    <Shield className="h-3.5 w-3.5" />
                    {isViewingOther ? viewedUserRole : (roleLoading ? 'loading…' : (myRole || 'member'))}
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-500">{problemsSolved}</p>
                    <p className="text-xs text-muted-foreground">Solved</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-500">{duelsWon}/{duelsPlayed}</p>
                    <p className="text-xs text-muted-foreground">Duels Won</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-500">{currentStreak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isViewingOther ? (
                  <div className="space-y-2">
                    {!isFriend && (
                      <Button 
                        className="w-full" 
                        onClick={handleAddFriend}
                        disabled={sendFriendRequest.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleChallenge}>
                      <Swords className="h-4 w-4 mr-2" />
                      Challenge to Duel
                    </Button>
                    {isDeveloper && viewedUserRole !== 'developer' && (
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={handlePromote}
                        disabled={updateRole.isPending}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Promote to Staff
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                    {myRole && (myRole === 'developer' || myRole === 'staff' || myRole === 'moderator') && (
                      <Link to="/admin" className="block">
                        <Button variant="secondary" className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Rating Chart & Activity */}
            <div className="lg:col-span-2 space-y-6">
              <RatingChart userId={targetUserId} currentRating={rating} />
              <ActivityCalendar userId={targetUserId} />
            </div>
          </div>

          {/* Stats Dashboard Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="dashboard">Performance</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="details">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <StatsDashboard userId={targetUserId} />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementsDisplay userId={targetUserId} />
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        value={isViewingOther ? (profile?.email || 'Not available') : (user.email || '')}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Account Created
                      </Label>
                      <Input
                        value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Unknown'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
