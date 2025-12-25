import { useState } from 'react';
import { Search, Shield, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAllUsersWithRoles, useUpdateUserRole, AppRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ userId, newRole });
      toast({
        title: 'Role updated',
        description: `User role has been changed to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const roleColors: Record<AppRole, string> = {
    developer: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    staff: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          User Management
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <span>User</span>
            <span>Email</span>
            <span>Current Role</span>
            <span>Actions</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                </div>
                <div className="hidden md:block text-sm text-muted-foreground truncate">
                  {user.email}
                </div>
                <div>
                  <Badge className={roleColors[user.role]}>{user.role}</Badge>
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        Change Role
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(['developer', 'staff', 'moderator', 'member'] as AppRole[]).map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => handleRoleChange(user.user_id, role)}
                          disabled={role === user.role}
                        >
                          <Badge className={`${roleColors[role]} mr-2`}>{role}</Badge>
                          {role === user.role && '(current)'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
