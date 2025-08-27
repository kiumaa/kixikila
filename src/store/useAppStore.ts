import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockGroups, type Group } from '@/data/mockData';

export type UserPlan = 'free' | 'vip';

interface AppState {
  userPlan: UserPlan;
  userGroups: Group[];
  
  // Actions
  togglePlan: () => void;
  setPlan: (plan: UserPlan) => void;
  canCreateGroup: () => boolean;
  addGroup: (group: Group) => void;
  removeGroup: (groupId: number) => void;
  getGroupCount: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userPlan: 'vip', // Inicialmente VIP baseado no mockUser
      userGroups: mockGroups.filter(group => 
        group.members.some(member => member.id === 1) // Filtrar grupos onde o usuário (ID 1) participa
      ),

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

      removeGroup: (groupId: number) => {
        set((state) => ({
          userGroups: state.userGroups.filter(group => group.id !== groupId)
        }));
      },

      getGroupCount: () => {
        return get().userGroups.length;
      }
    }),
    {
      name: 'kixikila-app-storage',
      partialize: (state) => ({
        userPlan: state.userPlan,
        userGroups: state.userGroups
      })
    }
  )
);