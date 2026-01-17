import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'user';

interface UseUserRoleReturn {
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  refetch: () => void;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } else {
        // Type assertion since we know the enum values
        const userRoles = (data || []).map(r => r.role as AppRole);
        setRoles(userRoles);
      }
    } catch (e) {
      console.error('Error fetching roles:', e);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AppRole) => {
    return roles.includes(role);
  }, [roles]);

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isModerator: roles.includes('moderator') || roles.includes('admin'),
    isLoading,
    hasRole,
    refetch: fetchRoles,
  };
};
