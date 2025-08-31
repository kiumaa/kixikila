import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserPlan = 'free' | 'vip';

interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
  groupReminders: boolean;
  paymentAlerts: boolean;
  winnerNotifications: boolean;
}

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system';
  selectedTab: string;
  unreadNotifications: number;
  
  // User Preferences  
  notificationPreferences: NotificationPreferences;
  
  // App State
  isOnline: boolean;
  lastSync: string | null;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSelectedTab: (tab: string) => void;
  setUnreadNotifications: (count: number) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  setOnlineStatus: (online: boolean) => void;
  updateLastSync: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      selectedTab: 'home',
      unreadNotifications: 0,
      
      notificationPreferences: {
        push: true,
        sms: true,
        email: false,
        groupReminders: true,
        paymentAlerts: true,
        winnerNotifications: true
      },
      
      isOnline: navigator.onLine,
      lastSync: null,

      // Actions
      setTheme: (theme) => set({ theme }),
      
      setSelectedTab: (selectedTab) => set({ selectedTab }),
      
      setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
      
      updateNotificationPreferences: (prefs) => {
        const current = get().notificationPreferences;
        set({ 
          notificationPreferences: { ...current, ...prefs }
        });
      },
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      updateLastSync: () => set({ lastSync: new Date().toISOString() })
    }),
    {
      name: 'kixikila-app-store',
      partialize: (state) => ({
        theme: state.theme,
        notificationPreferences: state.notificationPreferences,
        lastSync: state.lastSync
      })
    }
  )
);