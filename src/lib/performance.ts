import { useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce hook for performance
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized calculations
export const useMemoizedGroupProgress = (members: any[]) => {
  return useMemo(() => {
    const paidMembers = members.filter(m => m.paid).length;
    const totalMembers = members.length;
    const progress = totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0;
    
    return {
      paidMembers,
      totalMembers,
      progress,
      canDraw: progress === 100
    };
  }, [members]);
};

// Memoized filtered groups
export const useMemoizedFilteredGroups = (groups: any[], activeTab: string) => {
  return useMemo(() => {
    if (activeTab === 'all') return groups;
    if (activeTab === 'active') return groups.filter(g => g.status === 'active' || g.status === 'ready_for_draw');
    if (activeTab === 'pending') return groups.filter(g => g.status === 'pending');
    if (activeTab === 'completed') return groups.filter(g => g.status === 'completed');
    return groups;
  }, [groups, activeTab]);
};

// Performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

// Optimized event handlers
export const useOptimizedHandlers = (handlers: Record<string, (...args: any[]) => void>) => {
  return useMemo(() => {
    const optimized: Record<string, (...args: any[]) => void> = {};
    
    Object.entries(handlers).forEach(([key, handler]) => {
      optimized[key] = useCallback(handler, [handler]);
    });
    
    return optimized;
  }, [handlers]);
};

// Import missing React functions
import { useState } from 'react';