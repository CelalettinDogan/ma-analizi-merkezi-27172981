import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Favorite {
  id: string;
  user_id: string;
  favorite_type: 'team' | 'league';
  favorite_id: string;
  favorite_name: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async ({
      type,
      id,
      name,
    }: {
      type: 'team' | 'league';
      id: string;
      name?: string;
    }) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          favorite_type: type,
          favorite_id: id,
          favorite_name: name || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ type, id, name }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites', user?.id]);
      
      const optimisticFavorite: Favorite = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        favorite_type: type,
        favorite_id: id,
        favorite_name: name || null,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Favorite[]>(['favorites', user?.id], (old) => [
        optimisticFavorite,
        ...(old || []),
      ]);
      
      return { previousFavorites };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['favorites', user?.id], context?.previousFavorites);
      toast({
        title: 'Hata',
        description: 'Favori eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async ({ type, id }: { type: 'team' | 'league'; id: string }) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_type', type)
        .eq('favorite_id', id);

      if (error) throw error;
    },
    onMutate: async ({ type, id }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites', user?.id]);
      
      queryClient.setQueryData<Favorite[]>(['favorites', user?.id], (old) =>
        old?.filter((f) => !(f.favorite_type === type && f.favorite_id === id)) || []
      );
      
      return { previousFavorites };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['favorites', user?.id], context?.previousFavorites);
      toast({
        title: 'Hata',
        description: 'Favori kaldırılırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const isFavorite = (type: 'team' | 'league', id: string): boolean => {
    return favorites.some((f) => f.favorite_type === type && f.favorite_id === id);
  };

  const toggleFavorite = async (
    type: 'team' | 'league',
    id: string,
    name?: string
  ) => {
    if (!user) {
      toast({
        title: 'Giriş Yapın',
        description: 'Favorilere eklemek için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return;
    }

    if (isFavorite(type, id)) {
      await removeFavorite.mutateAsync({ type, id });
      toast({
        title: 'Favorilerden Kaldırıldı',
        description: `${name || id} favorilerden kaldırıldı.`,
      });
    } else {
      await addFavorite.mutateAsync({ type, id, name });
      toast({
        title: 'Favorilere Eklendi',
        description: `${name || id} favorilere eklendi.`,
      });
    }
  };

  const getFavoritesByType = (type: 'team' | 'league'): Favorite[] => {
    return favorites.filter((f) => f.favorite_type === type);
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    getFavoritesByType,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
  };
}
