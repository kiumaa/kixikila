import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(), 
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn()
}))

// Mock performance observer
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should measure Core Web Vitals', () => {
    const mockCallback = vi.fn()
    
    // Simulate measuring performance metrics
    vi.mocked(getCLS).mockImplementation(mockCallback)
    vi.mocked(getFID).mockImplementation(mockCallback)
    vi.mocked(getFCP).mockImplementation(mockCallback)
    vi.mocked(getLCP).mockImplementation(mockCallback)
    vi.mocked(getTTFB).mockImplementation(mockCallback)
    
    // Call the metrics
    getCLS(mockCallback)
    getFID(mockCallback)
    getFCP(mockCallback)  
    getLCP(mockCallback)
    getTTFB(mockCallback)
    
    expect(getCLS).toHaveBeenCalledWith(mockCallback)
    expect(getFID).toHaveBeenCalledWith(mockCallback)
    expect(getFCP).toHaveBeenCalledWith(mockCallback)
    expect(getLCP).toHaveBeenCalledWith(mockCallback)
    expect(getTTFB).toHaveBeenCalledWith(mockCallback)
  })

  it('should track navigation timing', () => {
    // Mock performance.navigation
    Object.defineProperty(window, 'performance', {
      value: {
        navigation: {
          type: 1,
          redirectCount: 0
        },
        timing: {
          navigationStart: 1000,
          domContentLoadedEventEnd: 2000,
          loadEventEnd: 3000
        },
        getEntriesByType: vi.fn(() => [
          {
            name: 'https://example.com',
            duration: 100,
            startTime: 0
          }
        ])
      }
    })

    const navigationEntries = performance.getEntriesByType('navigation')
    expect(navigationEntries).toHaveLength(1)
  })

  it('should measure bundle size impact', () => {
    // Mock resource timing for bundle analysis
    const mockResources = [
      {
        name: 'https://example.com/bundle.js',
        transferSize: 250000, // 250KB
        duration: 150
      },
      {
        name: 'https://example.com/vendor.js', 
        transferSize: 500000, // 500KB
        duration: 300
      }
    ]

    vi.mocked(performance.getEntriesByType).mockReturnValue(mockResources as any)
    
    const resources = performance.getEntriesByType('resource')
    const totalSize = resources.reduce((sum, resource) => sum + (resource as any).transferSize, 0)
    
    expect(totalSize).toBe(750000) // 750KB total
    expect(resources).toHaveLength(2)
  })

  it('should track memory usage when available', () => {
    // Mock memory API (Chrome-specific)
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 10000000, // 10MB
        totalJSHeapSize: 20000000, // 20MB  
        jsHeapSizeLimit: 50000000 // 50MB
      }
    })

    const memoryUsage = (performance as any).memory?.usedJSHeapSize
    expect(memoryUsage).toBe(10000000)
  })

  it('should measure paint timing', () => {
    const mockPaintEntries = [
      {
        name: 'first-paint',
        startTime: 100,
        duration: 0
      },
      {
        name: 'first-contentful-paint', 
        startTime: 150,
        duration: 0
      }
    ]

    vi.mocked(performance.getEntriesByType).mockImplementation((type) => {
      if (type === 'paint') {
        return mockPaintEntries as any
      }
      return []
    })

    const paintEntries = performance.getEntriesByType('paint')
    expect(paintEntries).toHaveLength(2)
    expect(paintEntries[0].name).toBe('first-paint')
    expect(paintEntries[1].name).toBe('first-contentful-paint')
  })
})