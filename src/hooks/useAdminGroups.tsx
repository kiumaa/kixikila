import { useState, useEffect } from 'react';
import { GroupService, type AdminGroup, type GroupAnalytics } from '@/services/groupService';
import { useToast } from '@/hooks/use-toast';

export const useAdminGroups = (options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
} = {}) => {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const { groups: groupData, totalCount: count } = await GroupService.getGroups(options);
        setGroups(groupData);
        setTotalCount(count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
        toast({
          title: "Erro",
          description: "Não foi possível carregar os grupos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [options.page, options.limit, options.search, options.status, options.category, toast]);

  const updateGroupStatus = async (groupId: string, status: string, reason?: string) => {
    try {
      await GroupService.updateGroupStatus(groupId, status as any, reason);
      
      // Update local state
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, status: status as any }
            : group
        )
      );

      toast({
        title: "Sucesso",
        description: "Estado do grupo atualizado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estado do grupo",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await GroupService.deleteGroup(groupId);
      
      // Remove from local state
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      setTotalCount(prev => prev - 1);

      toast({
        title: "Sucesso",
        description: "Grupo eliminado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível eliminar o grupo",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { 
    groups, 
    totalCount, 
    isLoading, 
    error, 
    updateGroupStatus,
    deleteGroup,
    refetch: () => GroupService.getGroups(options).then(({ groups: groupData, totalCount: count }) => {
      setGroups(groupData);
      setTotalCount(count);
    })
  };
};

export const useGroupAnalytics = () => {
  const [analytics, setAnalytics] = useState<GroupAnalytics>({
    totalGroups: 0,
    activeGroups: 0,
    completedGroups: 0,
    suspendedGroups: 0,
    totalMembers: 0,
    averageGroupSize: 0,
    totalPoolValue: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await GroupService.getGroupAnalytics();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, isLoading, error, refetch: () => setIsLoading(true) };
};

export default { useAdminGroups, useGroupAnalytics };