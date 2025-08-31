import { useAuthStore } from '@/stores/useAuthStore';
import { useUserGroups } from '@/hooks/useGroupData';

export const useVIPStatus = () => {
  const { user } = useAuthStore();
  const { groups } = useUserGroups();
  
  const isVIP = user?.is_vip || false;
  const groupCount = groups?.length || 0;
  const groupLimit = isVIP ? -1 : 2; // -1 means unlimited for VIP
  
  const canCreateGroup = () => {
    if (isVIP) return true;
    return groupCount < 2;
  };
  
  const getRemainingGroups = () => {
    if (isVIP) return -1; // Unlimited
    return Math.max(0, 2 - groupCount);
  };

  const validateGroupCreation = () => {
    if (isVIP) {
      return {
        canCreate: true,
        message: "Como utilizador VIP, pode criar grupos ilimitados"
      };
    }
    
    if (groupCount >= 2) {
      return {
        canCreate: false,
        message: "Limite de 2 grupos atingido. Faça upgrade para VIP para criar mais!"
      };
    }
    
    return {
      canCreate: true,
      message: `Pode criar ${2 - groupCount} grupos adicionais`
    };
  };
  
  return {
    isVIP,
    groupCount,
    groupLimit,
    canCreateGroup,
    getRemainingGroups,
    validateGroupCreation,
    loading: false
  };
};