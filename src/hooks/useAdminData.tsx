import { useState, useEffect } from 'react';
import { AdminService, type AdminStats, type AdminUser, type AdminActivity } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    vipUsers: 0,
    pendingOtps: 0,
    unreadNotifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await AdminService.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time updates
    const unsubscribe = AdminService.subscribeToStats((newStats) => {
      setStats(newStats);
    });

    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  return { stats, isLoading, error, refetch: () => AdminService.getStats().then(setStats) };
};

export const useAdminUsers = (options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isVip?: boolean;
  isActive?: boolean;
} = {}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { users: userData, totalCount: count } = await AdminService.getUsers(options);
        setUsers(userData as AdminUser[]);
        setTotalCount(count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        toast({
          title: "Erro",
          description: "Não foi possível carregar os utilizadores",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [options.page, options.limit, options.search, options.role, options.isVip, options.isActive, toast]);

  const updateUserStatus = async (userId: string, updates: {
    is_active?: boolean;
    role?: string;
    is_vip?: boolean;
  }) => {
    try {
      await AdminService.updateUserStatus(userId, updates);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, ...updates }
            : user
        )
      );

      toast({
        title: "Sucesso",
        description: "Estado do utilizador atualizado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estado do utilizador",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { 
    users, 
    totalCount, 
    isLoading, 
    error, 
    updateUserStatus,
    refetch: () => AdminService.getUsers(options).then(({ users: userData, totalCount: count }) => {
      setUsers(userData as AdminUser[]);
      setTotalCount(count);
    })
  };
};

export const useAdminActivityLogs = (limit: number = 10) => {
  const [activityLogs, setActivityLogs] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await AdminService.getActivityLogs(limit);
        setActivityLogs(logs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Subscribe to real-time updates
    const unsubscribe = AdminService.subscribeToActivityLogs((newLogs) => {
      setActivityLogs(newLogs);
    });

    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }, [limit]);

  return { activityLogs, isLoading, error };
};

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const data = await AdminService.getNotifications();
        setNotifications(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const createNotification = async (notification: {
    title: string;
    message: string;
    type: string;
    user_id?: string;
    action_url?: string;
  }) => {
    try {
      const newNotification = await AdminService.createNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Notificação criada com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro", 
        description: "Não foi possível criar a notificação",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { notifications, isLoading, error, createNotification };
};

export default { useAdminStats, useAdminUsers, useAdminActivityLogs, useAdminNotifications };