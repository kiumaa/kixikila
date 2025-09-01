'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePerformanceMonitor } from '@/lib/performance-monitor'
import { useAccessibilityChecker } from '@/lib/accessibility-checker'
import { 
  Activity, Zap, Shield, AlertTriangle, CheckCircle, 
  BarChart3, RefreshCw, Eye, Clock, Smartphone
} from 'lucide-react'

export function PerformanceDashboard() {
  const { getReport, getScore, getCoreVitals } = usePerformanceMonitor()
  const { runAudit, generateReport, getCriticalViolations } = useAccessibilityChecker()
  
  const [performanceData, setPerformanceData] = useState(getReport())
  const [accessibilityReport, setAccessibilityReport] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)

  const refreshData = () => {
    setPerformanceData(getReport())
  }

  const runAccessibilityAudit = async () => {
    setIsRunning(true)
    try {
      await runAudit()
      setAccessibilityReport(generateReport())
    } catch (error) {
      console.error('Accessibility audit failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const performanceScore = getScore()
  const coreVitals = getCoreVitals()
  const criticalA11yIssues = getCriticalViolations()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRatingBadge = (rating: 'good' | 'needs-improvement' | 'poor') => {
    const variants = {
      good: 'bg-emerald-100 text-emerald-700',
      'needs-improvement': 'bg-amber-100 text-amber-700',
      poor: 'bg-red-100 text-red-700'
    }
    
    return (
      <Badge className={variants[rating]}>
        {rating === 'good' && <CheckCircle className="w-3 h-3 mr-1" />}
        {rating === 'needs-improvement' && <Clock className="w-3 h-3 mr-1" />}
        {rating === 'poor' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {rating.charAt(0).toUpperCase() + rating.slice(1).replace('-', ' ')}
      </Badge>
    )
  }

  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4" />
            Performance & A11y Monitor
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="ml-auto p-1 h-6 w-6"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs overflow-y-auto max-h-64">
          {/* Performance Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Performance Score</span>
            </div>
            <span className={`font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}/100
            </span>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <BarChart3 className="w-4 h-4" />
              Core Web Vitals
            </div>
            {Object.entries(coreVitals).map(([name, metric]) => (
              metric && (
                <div key={name} className="flex items-center justify-between ml-6">
                  <span>{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{metric.value.toFixed(0)}ms</span>
                    {getRatingBadge(metric.rating)}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Bundle Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>Bundle Size</span>
            </div>
            <span className="font-mono">
              {(performanceData.bundleSize / 1024).toFixed(0)}KB
            </span>
          </div>

          {/* Load Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>Load Time</span>
            </div>
            <span className="font-mono">
              {performanceData.loadTime.toFixed(0)}ms
            </span>
          </div>

          {/* Memory Usage */}
          {performanceData.memoryUsage && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span>Memory</span>
              </div>
              <span className="font-mono">
                {(performanceData.memoryUsage / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          )}

          {/* Accessibility */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Accessibility</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={runAccessibilityAudit}
                disabled={isRunning}
                className="p-1 h-6"
              >
                <Eye className="w-3 h-3" />
                {isRunning ? 'Running...' : 'Audit'}
              </Button>
            </div>

            {criticalA11yIssues.length > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span>Critical Issues</span>
                <Badge className="bg-red-100 text-red-700">
                  {criticalA11yIssues.length}
                </Badge>
              </div>
            )}

            {accessibilityReport && (
              <div className="mt-2 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {accessibilityReport.slice(0, 200)}...
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}