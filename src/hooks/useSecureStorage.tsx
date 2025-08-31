import { useCallback } from 'react';
import { useSecurityLimiter } from './useSecurityLimiter';

// Simple encryption/decryption using built-in browser APIs
const encryptData = async (data: string, key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyData,
    encoder.encode(data)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
};

const decryptData = async (encryptedData: string, key: string): Promise<string | null> => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyData,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Generate a device-specific key
const getDeviceKey = (): string => {
  const stored = localStorage.getItem('kixikila_device_key');
  if (stored) return stored;
  
  const key = crypto.randomUUID();
  localStorage.setItem('kixikila_device_key', key);
  return key;
};

export const useSecureStorage = () => {
  const securityLimiter = useSecurityLimiter('storage_access', {
    maxAttempts: 10,
    windowMs: 60000, // 1 minute
    action: 'acesso ao armazenamento'
  });

  const setSecureItem = useCallback(async (key: string, value: any): Promise<boolean> => {
    const limitCheck = securityLimiter.checkLimit();
    if (!limitCheck.allowed) {
      console.error('Storage access rate limited');
      return false;
    }

    try {
      const deviceKey = getDeviceKey();
      const serializedValue = JSON.stringify(value);
      const encrypted = await encryptData(serializedValue, deviceKey);
      
      localStorage.setItem(`secure_${key}`, encrypted);
      localStorage.setItem(`secure_${key}_timestamp`, Date.now().toString());
      
      return true;
    } catch (error) {
      securityLimiter.recordAttempt();
      console.error('Secure storage failed:', error);
      return false;
    }
  }, [securityLimiter]);

  const getSecureItem = useCallback(async (key: string): Promise<any | null> => {
    const limitCheck = securityLimiter.checkLimit();
    if (!limitCheck.allowed) {
      console.error('Storage access rate limited');
      return null;
    }

    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      const timestamp = localStorage.getItem(`secure_${key}_timestamp`);
      
      if (!encrypted || !timestamp) return null;

      // Check if data is expired (7 days)
      const age = Date.now() - parseInt(timestamp);
      if (age > 7 * 24 * 60 * 60 * 1000) {
        removeSecureItem(key);
        return null;
      }

      const deviceKey = getDeviceKey();
      const decrypted = await decryptData(encrypted, deviceKey);
      
      if (!decrypted) {
        securityLimiter.recordAttempt();
        return null;
      }

      return JSON.parse(decrypted);
    } catch (error) {
      securityLimiter.recordAttempt();
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }, [securityLimiter]);

  const removeSecureItem = useCallback((key: string): void => {
    localStorage.removeItem(`secure_${key}`);
    localStorage.removeItem(`secure_${key}_timestamp`);
  }, []);

  const clearAllSecureItems = useCallback((): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_') || key === 'kixikila_device_key') {
        localStorage.removeItem(key);
      }
    });
  }, []);

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearAllSecureItems,
    isBlocked: securityLimiter.isBlocked
  };
};