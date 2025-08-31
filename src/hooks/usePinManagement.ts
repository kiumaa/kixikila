import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { useToast } from '@/hooks/use-toast';

interface PinData {
  userId: string;
  pinHash: string;
  createdAt: string;
  deviceId?: string;
}

interface UsePinManagementReturn {
  savePinHash: (pin: string, userId: string, deviceId?: string) => Promise<boolean>;
  verifyPin: (pin: string, userId: string) => Promise<boolean>;
  hasPinConfigured: (userId: string) => boolean;
  clearPin: (userId: string) => void;
  isLoading: boolean;
}

export const usePinManagement = (): UsePinManagementReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const STORAGE_KEY = 'kixikila_pins';
  const SALT_ROUNDS = 10;

  // Get all PINs from localStorage
  const getAllPins = (): Record<string, PinData> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading PINs from storage:', error);
      return {};
    }
  };

  // Save PINs to localStorage
  const savePinsToStorage = (pins: Record<string, PinData>): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
    } catch (error) {
      console.error('Error saving PINs to storage:', error);
    }
  };

  // Save PIN hash
  const savePinHash = async (pin: string, userId: string, deviceId?: string): Promise<boolean> => {
    if (!pin || pin.length !== 4 || !userId) {
      toast({
        title: "Erro",
        description: "PIN inválido ou usuário não identificado",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Generate salt and hash
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const pinHash = await bcrypt.hash(pin, salt);

      // Get current PINs
      const allPins = getAllPins();

      // Save new PIN data
      allPins[userId] = {
        userId,
        pinHash,
        createdAt: new Date().toISOString(),
        deviceId
      };

      savePinsToStorage(allPins);

      console.log(`✅ [PIN] PIN salvo com segurança para usuário ${userId}`);
      return true;

    } catch (error) {
      console.error('Error saving PIN:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar PIN. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify PIN
  const verifyPin = async (pin: string, userId: string): Promise<boolean> => {
    if (!pin || pin.length !== 4 || !userId) {
      return false;
    }

    setIsLoading(true);

    try {
      const allPins = getAllPins();
      const userPinData = allPins[userId];

      if (!userPinData) {
        console.log(`❌ [PIN] Nenhum PIN encontrado para usuário ${userId}`);
        return false;
      }

      // Verify PIN against hash
      const isValid = await bcrypt.compare(pin, userPinData.pinHash);
      
      if (isValid) {
        console.log(`✅ [PIN] PIN verificado com sucesso para usuário ${userId}`);
      } else {
        console.log(`❌ [PIN] PIN inválido para usuário ${userId}`);
      }

      return isValid;

    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has PIN configured
  const hasPinConfigured = (userId: string): boolean => {
    if (!userId) return false;

    const allPins = getAllPins();
    return !!allPins[userId];
  };

  // Clear PIN for user
  const clearPin = (userId: string): void => {
    if (!userId) return;

    const allPins = getAllPins();
    delete allPins[userId];
    savePinsToStorage(allPins);
    
    console.log(`🗑️ [PIN] PIN removido para usuário ${userId}`);
  };

  return {
    savePinHash,
    verifyPin,
    hasPinConfigured,
    clearPin,
    isLoading
  };
};