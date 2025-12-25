import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole, useUpdateUserRole, AppRole } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Calendar, Loader2, Save, Shield, UserPlus } from 'lucide-react';

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewedUserRole, setViewedUserRole] = useState<AppRole>('member');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');

  const isViewingOther = viewUserId && viewUserId !== user?.id;
  const isDeveloper = myRole === 'developer';
  const targetUserId = viewUserId || user?.id;

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

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="heading-section text-foreground mb-2">
                {isViewingOther ? 'User Profile' : 'Your Profile'}
              </h1>
              <p className="body-regular text-muted-foreground">
                {isViewingOther ? 'View user information' : 'Manage your account information'}
              </p>
            </div>

            <div className="card-elevated p-6 md:p-8">
              {/* Profile Avatar */}
              <div className="flex items-center justify-between gap-4 mb-8 pb-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      {profile?.full_name || 'AletheiaMath Student'}
                    </h2>
                    <p className="text-muted-foreground body-small">
                      Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      }) : 'recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isViewingOther ? (
                    <>
                      <Badge variant="secondary" className="gap-2 capitalize">
                        <Shield className="h-3.5 w-3.5" />
                        {viewedUserRole}
                      </Badge>
                      {isDeveloper && viewedUserRole !== 'developer' && (
                        <Button 
                          size="sm" 
                          onClick={handlePromote}
                          disabled={updateRole.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Promote to Staff
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-2 capitalize">
                        <Shield className="h-3.5 w-3.5" />
                        {roleLoading ? 'loading…' : (myRole || 'member')}
                      </Badge>
                      {myRole && (myRole === 'developer' || myRole === 'staff' || myRole === 'moderator') && (
                        <Link to="/admin">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Profile Form - only show for own profile */}
              {!isViewingOther ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      value={user.email || ''}
                      disabled
                      className="bg-secondary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
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
                      className="bg-secondary"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-premium"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      value={profile?.email || 'Not available'}
                      disabled
                      className="bg-secondary"
                    />
                  </div>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}