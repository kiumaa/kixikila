/**
 * Device management utilities for PIN authentication and trusted device handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  trusted: boolean;
  expires_at?: string;
}

/**
 * Get or generate unique device identifier
 */
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('kixikila_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('kixikila_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Generate device name based on user agent and date
 */
export const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  const browserName = userAgent.includes('Chrome') ? 'Chrome' : 
                     userAgent.includes('Firefox') ? 'Firefox' :
                     userAgent.includes('Safari') ? 'Safari' : 'Browser';
  
  return `${browserName} - ${new Date().toLocaleDateString('pt-PT')}`;
};

/**
 * Check if current device is trusted for the user
 */
export const checkDeviceTrust = async (): Promise<DeviceInfo | null> => {
  try {
    const deviceId = getDeviceId();
    
    // Get custom session or Supabase session for authentication
    const customSession = localStorage.getItem('kixikila_custom_session');
    const customUserId = localStorage.getItem('kixikila_user_id');
    
    let headers: Record<string, string> = {};
    
    if (customSession && customUserId) {
      headers['x-kixikila-user-id'] = customUserId;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        console.log('No valid session found for device trust check');
        return null;
      }
    }

    const { data, error } = await supabase.functions.invoke('pin-management', {
      body: {
        action: 'check-device',
        deviceId
      },
      headers
    });

    if (error) {
      console.error('Device trust check error:', error);
      return null;
    }

    if (data.success && data.data) {
      return {
        deviceId,
        deviceName: getDeviceName(),
        trusted: data.data.isTrusted,
        expires_at: data.data.expires_at
      };
    }

    return null;
  } catch (error) {
    console.error('Device trust check failed:', error);
    return null;
  }
};

/**
 * Check if user has PIN configured
 */
export const checkUserHasPin = async (): Promise<boolean> => {
  try {
    const customSession = localStorage.getItem('kixikila_custom_session');
    const customUserId = localStorage.getItem('kixikila_user_id');
    
    let headers: Record<string, string> = {};
    
    if (customSession && customUserId) {
      headers['x-kixikila-user-id'] = customUserId;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        return false;
      }
    }

    const { data, error } = await supabase.functions.invoke('pin-management', {
      body: {
        action: 'check-device',
        deviceId: getDeviceId()
      },
      headers
    });

    if (error) {
      console.error('PIN check error:', error);
      return false;
    }

    return data.success && data.data?.hasPin;
  } catch (error) {
    console.error('PIN check failed:', error);
    return false;
  }
};

/**
 * Store device authentication preference
 */
export const setDeviceAuthPreference = (usePin: boolean): void => {
  localStorage.setItem('kixikila_device_auth_preference', usePin ? 'pin' : 'otp');
};

/**
 * Get device authentication preference
 */
export const getDeviceAuthPreference = (): 'pin' | 'otp' => {
  const preference = localStorage.getItem('kixikila_device_auth_preference');
  return preference === 'pin' ? 'pin' : 'otp';
};

/**
 * Clear device trust data (used during logout)
 */
export const clearDeviceTrust = (): void => {
  localStorage.removeItem('kixikila_device_id');
  localStorage.removeItem('kixikila_device_auth_preference');
};