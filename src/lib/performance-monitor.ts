'use client'

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

interface PerformanceReport {
  metrics: PerformanceMetric[]
  bundleSize: number
  loadTime: number
  memoryUsage?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeWebVitals()
    this.initializeResourceMonitoring()
    this.initializeMemoryMonitoring()
  }

  private initializeWebVitals() {
    // Core Web Vitals
    onCLS((metric) => this.recordMetric('CLS', metric.value, this.getClsRating(metric.value)))
    onINP((metric) => this.recordMetric('INP', metric.value, this.getInpRating(metric.value)))
    onFCP((metric) => this.recordMetric('FCP', metric.value, this.getFcpRating(metric.value)))
    onLCP((metric) => this.recordMetric('LCP', metric.value, this.getLcpRating(metric.value)))
    onTTFB((metric) => this.recordMetric('TTFB', metric.value, this.getTtfbRating(metric.value)))
  }

  private initializeResourceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        // Monitor navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordMetric('DOM_CONTENT_LOADED', navEntry.domContentLoadedEventEnd - navEntry.startTime, 'good')
              this.recordMetric('LOAD_COMPLETE', navEntry.loadEventEnd - navEntry.startTime, 'good')
            }
          }
        })

        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)

        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming
              if (resourceEntry.name.includes('.js') || resourceEntry.name.includes('.css')) {
                this.recordMetric(
                  `RESOURCE_${resourceEntry.name.split('/').pop()?.toUpperCase()}`,
                  resourceEntry.duration,
                  this.getResourceRating(resourceEntry.duration)
                )
              }
            }
          }
        })

        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)

      } catch (error) {
        console.warn('Performance monitoring not supported:', error)
      }
    }
  }

  private initializeMemoryMonitoring() {
    // Chrome-specific memory monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.recordMetric('MEMORY_USED', memory.usedJSHeapSize, this.getMemoryRating(memory.usedJSHeapSize))
        }
      }, 30000) // Every 30 seconds
    }
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // Log poor performance
    if (rating === 'poor') {
      console.warn(`Poor performance detected: ${name} = ${value}`)
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  // Rating functions based on web performance standards
  private getClsRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getFidRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getInpRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 200) return 'good'
    if (value <= 500) return 'needs-improvement'
    return 'poor'
  }

  private getFcpRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private getLcpRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getTtfbRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good'
    if (value <= 1800) return 'needs-improvement'
    return 'poor'
  }

  private getResourceRating(duration: number): 'good' | 'needs-improvement' | 'poor' {
    if (duration <= 500) return 'good'
    if (duration <= 1000) return 'needs-improvement'
    return 'poor'
  }

  private getMemoryRating(bytes: number): 'good' | 'needs-improvement' | 'poor' {
    const mb = bytes / (1024 * 1024)
    if (mb <= 50) return 'good'
    if (mb <= 100) return 'needs-improvement'
    return 'poor'
  }

  getBundleSize(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources
      .filter(resource => resource.name.includes('.js'))
      .reduce((total, resource) => total + (resource.transferSize || 0), 0)
  }

  getLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation ? navigation.loadEventEnd - navigation.startTime : 0
  }

  getCurrentReport(): PerformanceReport {
    const bundleSize = this.getBundleSize()
    const loadTime = this.getLoadTime()
    const memory = (performance as any).memory
    
    return {
      metrics: [...this.metrics],
      bundleSize,
      loadTime,
      memoryUsage: memory?.usedJSHeapSize
    }
  }

  getMetricsByRating(rating: 'good' | 'needs-improvement' | 'poor'): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.rating === rating)
  }

  getCoreWebVitals(): Record<string, PerformanceMetric | undefined> {
    const vitals = ['CLS', 'INP', 'FCP', 'LCP', 'TTFB']
    const result: Record<string, PerformanceMetric | undefined> = {}
    
    vitals.forEach(vital => {
      result[vital] = this.metrics.find(metric => metric.name === vital)
    })
    
    return result
  }

  getPerformanceScore(): number {
    const coreVitals = this.getCoreWebVitals()
    const scores = Object.values(coreVitals)
      .filter(Boolean)
      .map(metric => {
        switch (metric!.rating) {
          case 'good': return 100
          case 'needs-improvement': return 60
          case 'poor': return 20
          default: return 0
        }
      })
    
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function usePerformanceMonitor() {
  return {
    getReport: () => performanceMonitor.getCurrentReport(),
    getScore: () => performanceMonitor.getPerformanceScore(),
    getCoreVitals: () => performanceMonitor.getCoreWebVitals(),
    getMetricsByRating: (rating: 'good' | 'needs-improvement' | 'poor') => 
      performanceMonitor.getMetricsByRating(rating)
  }
}
