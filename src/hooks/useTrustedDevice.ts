import { useState } from 'react';

export interface TrustedDeviceSession {
  deviceId: string;
  userId: string;
  createdAt: string;
  lastAccess: string;
  isTrusted: boolean;
  failedAttempts: number;
  lockUntil?: string;
}

interface UseTrustedDeviceReturn {
  isTrustedDevice: (userId: string) => boolean;
  createDeviceSession: (userId: string) => string;
  clearDeviceSession: (userId: string) => void;
  incrementFailedAttempts: (userId: string) => number;
  resetFailedAttempts: (userId: string) => void;
  isDeviceLocked: (userId: string) => boolean;
  getFailedAttempts: (userId: string) => number;
  getTrustedSession: (userId: string) => TrustedDeviceSession | null;
}

export const useTrustedDevice = (): UseTrustedDeviceReturn => {
  const STORAGE_KEY = 'kixikila_trusted_devices';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

  // Generate device ID
  const generateDeviceId = (): string => {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get all trusted sessions
  const getAllSessions = (): Record<string, TrustedDeviceSession> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading trusted devices from storage:', error);
      return {};
    }
  };

  // Save sessions to storage
  const saveSessionsToStorage = (sessions: Record<string, TrustedDeviceSession>): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving trusted devices to storage:', error);
    }
  };

  // Check if device is trusted for user
  const isTrustedDevice = (userId: string): boolean => {
    if (!userId) return false;

    const sessions = getAllSessions();
    const session = sessions[userId];

    if (!session || !session.isTrusted) return false;

    // Check if device is locked
    if (session.lockUntil) {
      const now = new Date();
      const lockUntil = new Date(session.lockUntil);
      
      if (now < lockUntil) {
        return false; // Still locked
      } else {
        // Lock expired, remove lock
        session.lockUntil = undefined;
        session.failedAttempts = 0;
        sessions[userId] = session;
        saveSessionsToStorage(sessions);
      }
    }

    return true;
  };

  // Create trusted device session
  const createDeviceSession = (userId: string): string => {
    const deviceId = generateDeviceId();
    const sessions = getAllSessions();

    const session: TrustedDeviceSession = {
      deviceId,
      userId,
      createdAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      isTrusted: true,
      failedAttempts: 0
    };

    sessions[userId] = session;
    saveSessionsToStorage(sessions);

    console.log(`✅ [TRUSTED DEVICE] Sessão criada para usuário ${userId}:`, deviceId);
    return deviceId;
  };

  // Clear device session
  const clearDeviceSession = (userId: string): void => {
    if (!userId) return;

    const sessions = getAllSessions();
    delete sessions[userId];
    saveSessionsToStorage(sessions);

    console.log(`🗑️ [TRUSTED DEVICE] Sessão removida para usuário ${userId}`);
  };

  // Increment failed attempts
  const incrementFailedAttempts = (userId: string): number => {
    const sessions = getAllSessions();
    const session = sessions[userId];

    if (!session) return 0;

    session.failedAttempts += 1;
    session.lastAccess = new Date().toISOString();

    // Lock device if max attempts reached
    if (session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      session.lockUntil = new Date(Date.now() + LOCK_DURATION).toISOString();
      console.log(`🔒 [TRUSTED DEVICE] Dispositivo bloqueado para usuário ${userId}`);
    }

    sessions[userId] = session;
    saveSessionsToStorage(sessions);

    return session.failedAttempts;
  };

  // Reset failed attempts
  const resetFailedAttempts = (userId: string): void => {
    const sessions = getAllSessions();
    const session = sessions[userId];

    if (!session) return;

    session.failedAttempts = 0;
    session.lockUntil = undefined;
    session.lastAccess = new Date().toISOString();

    sessions[userId] = session;
    saveSessionsToStorage(sessions);

    console.log(`✅ [TRUSTED DEVICE] Tentativas resetadas para usuário ${userId}`);
  };

  // Check if device is locked
  const isDeviceLocked = (userId: string): boolean => {
    const sessions = getAllSessions();
    const session = sessions[userId];

    if (!session || !session.lockUntil) return false;

    const now = new Date();
    const lockUntil = new Date(session.lockUntil);

    return now < lockUntil;
  };

  // Get failed attempts count
  const getFailedAttempts = (userId: string): number => {
    const sessions = getAllSessions();
    const session = sessions[userId];

    return session?.failedAttempts || 0;
  };

  // Get trusted session
  const getTrustedSession = (userId: string): TrustedDeviceSession | null => {
    const sessions = getAllSessions();
    return sessions[userId] || null;
  };

  return {
    isTrustedDevice,
    createDeviceSession,
    clearDeviceSession,
    incrementFailedAttempts,
    resetFailedAttempts,
    isDeviceLocked,
    getFailedAttempts,
    getTrustedSession
  };
};