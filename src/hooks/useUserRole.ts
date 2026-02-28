import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'user' | 'vip';

const ROLES_CACHE_KEY = 'cached_user_roles';

const readCachedRoles = (): AppRole[] => {
  try {
    const raw = localStorage.getItem(ROLES_CACHE_KEY);
    if (raw) return JSON.parse(raw) as AppRole[];
  } catch {}
  return [];
};

interface UseUserRoleReturn {
  roles: AppRole[];
  isAdmin: boolean;
  isVip: boolean;
  isModerator: boolean;
  hasVipOrAdmin: boolean;
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  refetch: () => void;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const cachedRoles = readCachedRoles();
  const [roles, setRoles] = useState<AppRole[]>(cachedRoles);
  const [isLoading, setIsLoading] = useState(cachedRoles.length === 0);

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
        try { localStorage.removeItem(ROLES_CACHE_KEY); } catch {}
      } else {
        const userRoles = (data || []).map(r => r.role as AppRole);
        setRoles(userRoles);
        try { localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(userRoles)); } catch {}
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

  const isAdmin = roles.includes('admin');
  const isVip = roles.includes('vip');

  return {
    roles,
    isAdmin,
    isVip,
    isModerator: roles.includes('moderator') || isAdmin,
    hasVipOrAdmin: isAdmin || isVip,
    isLoading,
    hasRole,
    refetch: fetchRoles,
  };
};
