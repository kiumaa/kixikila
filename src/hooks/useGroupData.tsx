import { useState, useEffect, useCallback } from 'react';
import { GroupService, type Group, type GroupAnalytics } from '@/services/groupService';
import { useToast } from '@/hooks/use-toast';

export const useUserGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { groups: fetchedGroups } = await GroupService.getUserGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createGroup = useCallback(async (groupData: Parameters<typeof GroupService.createGroup>[0]) => {
    try {
      const newGroup = await GroupService.createGroup(groupData);
      setGroups(prev => [newGroup, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Grupo criado com sucesso!'
      });
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  const leaveGroup = useCallback(async (groupId: string) => {
    try {
      await GroupService.leaveGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
      toast({
        title: 'Sucesso',
        description: 'Saiu do grupo com sucesso!'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave group';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    createGroup,
    leaveGroup
  };
};

export const useGroupDetails = (groupId: string | null) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const fetchedGroup = await GroupService.getGroupById(groupId);
      setGroup(fetchedGroup);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch group';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, toast]);

  const addMember = useCallback(async (userId: string, role?: Parameters<typeof GroupService.addMember>[2]) => {
    if (!groupId) return;
    
    try {
      const newMember = await GroupService.addMember(groupId, userId, role);
      setGroup(prev => prev ? { ...prev, members: [...(prev.members || []), newMember] } : null);
      toast({
        title: 'Sucesso',
        description: 'Membro adicionado com sucesso!'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [groupId, toast]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!groupId) return;
    
    try {
      await GroupService.removeMember(groupId, memberId);
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members?.filter(member => member.id !== memberId) || []
      } : null);
      toast({
        title: 'Sucesso',
        description: 'Membro removido com sucesso!'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [groupId, toast]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return {
    group,
    isLoading,
    error,
    refetch: fetchGroup,
    addMember,
    removeMember
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

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedAnalytics = await GroupService.getGroupAnalytics();
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
};