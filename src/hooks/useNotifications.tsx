import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import type { Notification, NotificationFilters, NotificationPreferences } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loadMore: () => Promise<void>;
  // Filters
  setFilters: (filters: NotificationFilters) => void;
  filters: NotificationFilters;
}

export const useNotifications = (initialFilters: NotificationFilters = {}): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const { toast } = useToast();

  const fetchNotifications = useCallback(async (newFilters?: NotificationFilters) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const filtersToUse = newFilters || filters;
      const response = await notificationService.getNotifications(filtersToUse);

      if (filtersToUse.page && filtersToUse.page > 1) {
        // Load more - append to existing notifications
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        // Fresh load - replace notifications
        setNotifications(response.notifications);
      }

      setPagination(response.pagination);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Refresh unread count
        await refreshUnreadCount();
        
        toast({
          title: "Notificação marcada como lida",
          duration: 2000
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível marcar a notificação como lida",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  }, [refreshUnreadCount, toast]);

  const markAllAsRead = useCallback(async () => {
    try {
      const success = await notificationService.markAllAsRead();
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            read: true
          }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        toast({
          title: "Todas as notificações foram marcadas como lidas",
          duration: 2000
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível marcar todas as notificações como lidas",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        
        // Refresh unread count
        await refreshUnreadCount();
        
        toast({
          title: "Notificação eliminada",
          duration: 2000
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível eliminar a notificação",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  }, [refreshUnreadCount, toast]);

  const loadMore = useCallback(async () => {
    if (pagination.page < pagination.pages && !isLoading) {
      const nextPage = pagination.page + 1;
      await fetchNotifications({ ...filters, page: nextPage });
    }
  }, [pagination, isLoading, filters, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNotifications(
      // On new notification
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission is granted
        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
          notificationService.showBrowserNotification(
            notification.title,
            notification.message
          );
        }
        
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000
        });
      },
      // On notification update
      (notification) => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? notification : n)
        );
        
        // If notification was marked as read, update unread count
        if (notification.read) {
          refreshUnreadCount();
        }
      },
      // On notification delete
      (notificationId) => {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
        refreshUnreadCount();
      }
    );

    return unsubscribe;
  }, [refreshUnreadCount, toast]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    refreshUnreadCount();
  }, []);

  // Update filters and refetch when filters change
  const updateFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    // Fetch with new filters
    fetchNotifications({ ...filters, ...newFilters, page: 1 });
  }, [filters, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    loadMore,
    setFilters: updateFilters,
    filters
  };
};

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
      console.error('Error fetching notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      setIsLoading(true);
      const success = await notificationService.updatePreferences(newPreferences);
      
      if (success) {
        // Update local state
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
        
        toast({
          title: "Preferências guardadas",
          description: "As suas definições de notificações foram atualizadas",
          duration: 3000
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível guardar as preferências",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sendTestNotification = useCallback(async () => {
    try {
      const success = await notificationService.sendTestNotification();
      
      if (success) {
        toast({
          title: "Notificação de teste enviada",
          description: "Verifique as suas notificações",
          duration: 3000
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar a notificação de teste",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  }, [toast]);

  const requestPermission = useCallback(async () => {
    try {
      const granted = await notificationService.requestNotificationPermission();
      
      if (granted) {
        toast({
          title: "Permissões concedidas",
          description: "Agora pode receber notificações no navegador",
          duration: 3000
        });
      } else {
        toast({
          title: "Permissões negadas",
          description: "Não será possível mostrar notificações no navegador",
          variant: "destructive",
          duration: 5000
        });
      }
      
      return granted;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    isError,
    error,
    updatePreferences,
    sendTestNotification,
    requestPermission
  };
};