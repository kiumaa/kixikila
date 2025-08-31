import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'navigation' | 'paint' | 'layout' | 'api' | 'custom';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  score: number;
  recommendations: string[];
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Collect Web Vitals and Navigation Timing
  const collectNavigationMetrics = useCallback(() => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const newMetrics: PerformanceMetric[] = [];

      if (navigation) {
        // Page Load Time
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        if (loadTime > 0) {
          newMetrics.push({
            name: 'Page Load Time',
            value: Math.round(loadTime),
            unit: 'ms',
            timestamp: Date.now(),
            category: 'navigation'
          });
        }

        // Time to First Byte
        const ttfb = navigation.responseStart - navigation.fetchStart;
        if (ttfb > 0) {
          newMetrics.push({
            name: 'Time to First Byte',
            value: Math.round(ttfb),
            unit: 'ms',
            timestamp: Date.now(),
            category: 'navigation'
          });
        }

        // DOM Content Loaded
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        if (domContentLoaded > 0) {
          newMetrics.push({
            name: 'DOM Content Loaded',
            value: Math.round(domContentLoaded),
            unit: 'ms',
            timestamp: Date.now(),
            category: 'navigation'
          });
        }
      }

      return newMetrics;
    }
    return [];
  }, []);

  // Collect Paint Timing metrics
  const collectPaintMetrics = useCallback(() => {
    if ('performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      return paintEntries.map(entry => ({
        name: entry.name === 'first-paint' ? 'First Paint' : 'First Contentful Paint',
        value: Math.round(entry.startTime),
        unit: 'ms',
        timestamp: Date.now(),
        category: 'paint' as const
      }));
    }
    return [];
  }, []);

  // Monitor API Response Times
  const monitorAPIRequests = useCallback(() => {
    if (!('performance' in window)) return [];

    const resourceEntries = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/api/') || entry.name.includes('supabase.co'))
      .slice(-10) // Get last 10 API calls
      .map(entry => {
        const resourceEntry = entry as PerformanceResourceTiming;
        return {
          name: `API Request (${new URL(entry.name).pathname})`,
          value: Math.round(resourceEntry.responseEnd - resourceEntry.startTime),
          unit: 'ms',
          timestamp: Date.now(),
          category: 'api' as const
        };
      });

    return resourceEntries;
  }, []);

  // Calculate Cumulative Layout Shift
  const measureCLS = useCallback(() => {
    if ('LayoutShiftAttribution' in window) {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput === false) {
            clsValue += (entry as any).value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Return CLS after a delay to accumulate shifts
      setTimeout(() => {
        observer.disconnect();
        setMetrics(prev => [...prev, {
          name: 'Cumulative Layout Shift',
          value: Math.round(clsValue * 1000) / 1000,
          unit: '',
          timestamp: Date.now(),
          category: 'layout'
        }]);
      }, 5000);
    }
  }, []);

  // Record custom performance metrics
  const recordCustomMetric = useCallback((name: string, value: number, unit: string = 'ms') => {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category: 'custom'
    };

    setMetrics(prev => [...prev, metric]);
  }, []);

  // Time function execution
  const timeFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    name: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      recordCustomMetric(`Function: ${name}`, Math.round(end - start));
      
      return result;
    };
  }, [recordCustomMetric]);

  // Time async function execution
  const timeAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name: string
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      recordCustomMetric(`Async Function: ${name}`, Math.round(end - start));
      
      return result;
    };
  }, [recordCustomMetric]);

  // Generate performance report
  const generateReport = useCallback((): PerformanceReport => {
    const recommendations: string[] = [];
    let score = 100;

    // Analyze metrics and generate score/recommendations
    metrics.forEach(metric => {
      switch (metric.name) {
        case 'Page Load Time':
          if (metric.value > 3000) {
            score -= 20;
            recommendations.push('Consider optimizing page load time (currently > 3s)');
          } else if (metric.value > 2000) {
            score -= 10;
            recommendations.push('Page load time could be improved (currently > 2s)');
          }
          break;

        case 'First Contentful Paint':
          if (metric.value > 2000) {
            score -= 15;
            recommendations.push('Optimize First Contentful Paint (currently > 2s)');
          } else if (metric.value > 1000) {
            score -= 5;
            recommendations.push('Consider improving First Contentful Paint time');
          }
          break;

        case 'Cumulative Layout Shift':
          if (metric.value > 0.25) {
            score -= 25;
            recommendations.push('Reduce Cumulative Layout Shift (poor user experience)');
          } else if (metric.value > 0.1) {
            score -= 10;
            recommendations.push('Consider reducing layout shifts');
          }
          break;

        default:
          if (metric.category === 'api' && metric.value > 1000) {
            score -= 5;
            recommendations.push(`Optimize API response time for ${metric.name}`);
          }
      }
    });

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      metrics,
      score,
      recommendations
    };
  }, [metrics]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    startTimeRef.current = Date.now();
    setMetrics([]);

    // Collect initial metrics
    const navMetrics = collectNavigationMetrics();
    const paintMetrics = collectPaintMetrics();
    setMetrics([...navMetrics, ...paintMetrics]);

    // Monitor CLS
    measureCLS();

    // Set up periodic API monitoring
    const apiInterval = setInterval(() => {
      const apiMetrics = monitorAPIRequests();
      if (apiMetrics.length > 0) {
        setMetrics(prev => [...prev, ...apiMetrics]);
      }
    }, 5000);

    // Cleanup interval on unmount or stop
    return () => {
      clearInterval(apiInterval);
    };
  }, [isMonitoring, collectNavigationMetrics, collectPaintMetrics, measureCLS, monitorAPIRequests]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics([]);
    startTimeRef.current = Date.now();
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    const cleanup = startMonitoring();
    
    return () => {
      stopMonitoring();
      if (cleanup) cleanup();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    recordCustomMetric,
    timeFunction,
    timeAsyncFunction,
    generateReport,
    monitoringDuration: Date.now() - startTimeRef.current
  };
};