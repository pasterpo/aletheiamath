import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyRole, AppRole } from './useRoles';

export interface UIPermission {
  id: string;
  element_key: string;
  element_name: string;
  element_type: string;
  visible_to_roles: string[];
  interactable_by_roles: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useUIPermissions() {
  return useQuery({
    queryKey: ['ui-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ui_permissions')
        .select('*')
        .order('element_name');

      if (error) throw error;
      return data as UIPermission[];
    },
  });
}

export function useUIPermission(elementKey: string) {
  const { data: permissions } = useUIPermissions();
  const { data: myRole } = useMyRole();
  
  const permission = permissions?.find(p => p.element_key === elementKey);
  const role = myRole || 'member';
  
  return {
    isVisible: !permission || permission.visible_to_roles.includes(role),
    isInteractable: !permission || permission.interactable_by_roles.includes(role),
    permission,
  };
}

export function useCheckUIPermission() {
  const { data: permissions } = useUIPermissions();
  const { data: myRole } = useMyRole();
  
  return (elementKey: string) => {
    const permission = permissions?.find(p => p.element_key === elementKey);
    const role = myRole || 'member';
    
    return {
      isVisible: !permission || permission.visible_to_roles.includes(role),
      isInteractable: !permission || permission.interactable_by_roles.includes(role),
    };
  };
}

export function useCreateUIPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permission: Omit<UIPermission, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ui_permissions')
        .insert(permission)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-permissions'] });
    },
  });
}

export function useUpdateUIPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UIPermission> & { id: string }) => {
      const { data, error } = await supabase
        .from('ui_permissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-permissions'] });
    },
  });
}

export function useDeleteUIPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ui_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-permissions'] });
    },
  });
}