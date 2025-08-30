import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockGroups, type Group } from '@/lib/mockData';

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
  
  // User Plan & Groups
  userPlan: UserPlan;
  userGroups: Group[];
  
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
  
  // Group Actions
  togglePlan: () => void;
  setPlan: (plan: UserPlan) => void;
  canCreateGroup: () => boolean;
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  getGroupCount: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      selectedTab: 'home',
      unreadNotifications: 0,
      
      // User Plan & Groups
      userPlan: 'vip',
      userGroups: mockGroups.filter(group => 
        group.members.some(member => member.user_id === 'user_1')
      ),
      
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
      
      updateLastSync: () => set({ lastSync: new Date().toISOString() }),
      
      // Group Actions
      togglePlan: () => {
        set((state) => ({
          userPlan: state.userPlan === 'free' ? 'vip' : 'free'
        }));
      },

      setPlan: (plan: UserPlan) => {
        set({ userPlan: plan });
      },

      canCreateGroup: () => {
        const { userPlan, userGroups } = get();
        if (userPlan === 'vip') return true;
        return userGroups.length < 2;
      },

      addGroup: (group: Group) => {
        set((state) => ({
          userGroups: [...state.userGroups, group]
        }));
      },

      removeGroup: (groupId: string) => {
        set((state) => ({
          userGroups: state.userGroups.filter(group => group.id !== groupId)
        }));
      },

      getGroupCount: () => {
        return get().userGroups.length;
      }
    }),
    {
      name: 'kixikila-app-store',
      partialize: (state) => ({
        theme: state.theme,
        userPlan: state.userPlan,
        userGroups: state.userGroups,
        notificationPreferences: state.notificationPreferences,
        lastSync: state.lastSync
      })
    }
  )
);