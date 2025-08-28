import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  isBlocked: boolean;
  blockUntil?: number;
}

export const useRateLimit = (key: string, options: RateLimitOptions) => {
  const { maxAttempts, windowMs, blockDurationMs = windowMs } = options;
  
  const getStoredState = (): RateLimitState => {
    try {
      const stored = localStorage.getItem(`rateLimit_${key}`);
      if (stored) {
        const state = JSON.parse(stored) as RateLimitState;
        
        // Check if block has expired
        if (state.isBlocked && state.blockUntil && Date.now() > state.blockUntil) {
          const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
          localStorage.setItem(`rateLimit_${key}`, JSON.stringify(resetState));
          return resetState;
        }
        
        // Check if window has expired
        if (Date.now() - state.firstAttempt > windowMs) {
          const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
          localStorage.setItem(`rateLimit_${key}`, JSON.stringify(resetState));
          return resetState;
        }
        
        return state;
      }
    } catch (error) {
      console.warn('Error reading rate limit state:', error);
    }
    
    return { attempts: 0, firstAttempt: 0, isBlocked: false };
  };

  const [state, setState] = useState<RateLimitState>(getStoredState);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateState = (newState: RateLimitState) => {
    setState(newState);
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(newState));
  };

  const checkLimit = useCallback((): { allowed: boolean; remainingTime?: number; attemptsLeft?: number } => {
    const currentState = getStoredState();
    
    if (currentState.isBlocked && currentState.blockUntil) {
      const remainingTime = Math.max(0, currentState.blockUntil - Date.now());
      if (remainingTime > 0) {
        return { allowed: false, remainingTime };
      } else {
        // Block expired, reset state
        const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
        updateState(resetState);
        return { allowed: true, attemptsLeft: maxAttempts };
      }
    }

    // Check if window expired
    if (currentState.attempts > 0 && Date.now() - currentState.firstAttempt > windowMs) {
      const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
      updateState(resetState);
      return { allowed: true, attemptsLeft: maxAttempts };
    }

    const attemptsLeft = maxAttempts - currentState.attempts;
    return { allowed: attemptsLeft > 0, attemptsLeft };
  }, [key, maxAttempts, windowMs]);

  const recordAttempt = useCallback((): { blocked: boolean; remainingTime?: number; attemptsLeft?: number } => {
    const currentState = getStoredState();
    const now = Date.now();
    
    const newAttempts = currentState.attempts + 1;
    const firstAttempt = currentState.firstAttempt || now;

    if (newAttempts >= maxAttempts) {
      // Block the user
      const blockUntil = now + blockDurationMs;
      const blockedState = {
        attempts: newAttempts,
        firstAttempt,
        isBlocked: true,
        blockUntil
      };
      
      updateState(blockedState);
      
      // Set timeout to reset state when block expires
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
        updateState(resetState);
      }, blockDurationMs);

      return { blocked: true, remainingTime: blockDurationMs };
    }

    // Record attempt but don't block
    const newState = {
      attempts: newAttempts,
      firstAttempt,
      isBlocked: false
    };
    
    updateState(newState);
    return { blocked: false, attemptsLeft: maxAttempts - newAttempts };
  }, [key, maxAttempts, blockDurationMs]);

  const reset = useCallback(() => {
    const resetState = { attempts: 0, firstAttempt: 0, isBlocked: false };
    updateState(resetState);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const getRemainingTime = useCallback((): number => {
    const currentState = getStoredState();
    if (currentState.isBlocked && currentState.blockUntil) {
      return Math.max(0, currentState.blockUntil - Date.now());
    }
    return 0;
  }, []);

  return {
    checkLimit,
    recordAttempt,
    reset,
    getRemainingTime,
    isBlocked: state.isBlocked,
    attemptsLeft: Math.max(0, maxAttempts - state.attempts),
    remainingTime: getRemainingTime()
  };
};