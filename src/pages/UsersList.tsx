import { useState } from 'react';
import { Users, Search, Shield, UserPlus, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole, useAllUsersWithRoles, useUpdateUserRole, AppRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const roleColors: Record<AppRole, string> = {
  developer: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  staff: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  moderator: 'bg-green-500/10 text-green-500 border-green-500/20',
  member: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function UsersList() {
  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isDeveloper = role === 'developer';

  // Redirect non-developers
  if (!roleLoading && !isDeveloper) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="heading-section text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Only developers can view this page.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePromote = async (userId: string, currentRole: AppRole) => {
    if (currentRole === 'developer') {
      toast({
        title: 'Cannot modify',
        description: 'This user is already a developer',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateRole.mutateAsync({ userId, newRole: 'staff' });
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

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Developer Only</span>
            </div>
            <h1 className="heading-section text-foreground mb-2">All Users</h1>
            <p className="text-muted-foreground">
              View all registered users and manage their roles
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {users.length} Registered Users
                </CardTitle>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {(u.full_name || u.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {u.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={roleColors[u.role]}>
                          {u.role}
                        </Badge>
                        {u.role !== 'developer' && u.user_id !== user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromote(u.user_id, u.role)}
                            disabled={updateRole.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Promote
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
