import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'developer' | 'staff' | 'moderator' | 'member';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: AppRole[] = ['member', 'moderator', 'staff', 'developer'];

export function getRoleLevel(role: AppRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasPermission(userRole: AppRole, requiredRole: AppRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function useMyRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.role as AppRole) || 'member';
    },
    enabled: !!user,
  });
}

export function useAllUsersWithRoles() {
  const { data: myRole } = useMyRole();

  return useQuery({
    queryKey: ['all-users-roles'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge them
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      return (profiles || []).map(profile => ({
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        role: roleMap.get(profile.user_id) || 'member',
        created_at: profile.created_at,
      })) as UserWithRole[];
    },
    enabled: myRole === 'developer',
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
    },
  });
}

// Permission check hook for components
export function useHasPermission(requiredRole: AppRole) {
  const { data: myRole, isLoading } = useMyRole();

  return {
    hasPermission: myRole ? hasPermission(myRole, requiredRole) : false,
    isLoading,
    role: myRole,
  };
}
