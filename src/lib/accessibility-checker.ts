'use client'

import axeAccessibilityReporter from '@axe-core/react'

interface AccessibilityIssue {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    target: string[]
    html: string
    failureSummary: string
  }>
}

interface AccessibilityReport {
  violations: AccessibilityIssue[]
  passes: AccessibilityIssue[]
  incomplete: AccessibilityIssue[]
  timestamp: number
  score: number
  url: string
}

class AccessibilityChecker {
  private violations: AccessibilityIssue[] = []
  private isEnabled = false

  constructor() {
    this.initializeAxe()
  }

  private initializeAxe() {
    if (process.env.NODE_ENV === 'development') {
      try {
        // Initialize axe-core React integration
        axeAccessibilityReporter(React, ReactDOM, 1000)
        this.isEnabled = true
        console.log('♿ Accessibility monitoring enabled')
      } catch (error) {
        console.warn('Failed to initialize accessibility checker:', error)
      }
    }
  }

  async runAudit(): Promise<AccessibilityReport> {
    if (typeof window === 'undefined' || !window.axe) {
      throw new Error('Axe-core not available')
    }

    try {
      const results = await window.axe.run(document)
      
      const report: AccessibilityReport = {
        violations: results.violations.map(this.mapViolation),
        passes: results.passes.map(this.mapViolation),
        incomplete: results.incomplete.map(this.mapViolation),
        timestamp: Date.now(),
        score: this.calculateScore(results.violations),
        url: window.location.href
      }

      this.violations = report.violations
      return report
    } catch (error) {
      console.error('Accessibility audit failed:', error)
      throw error
    }
  }

  private mapViolation(violation: any): AccessibilityIssue {
    return {
      id: violation.id,
      impact: violation.impact || 'moderate',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: any) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary || ''
      }))
    }
  }

  private calculateScore(violations: any[]): number {
    if (violations.length === 0) return 100

    const impactWeights = {
      minor: 1,
      moderate: 3,
      serious: 5,
      critical: 10
    }

    const totalImpact = violations.reduce((sum, violation) => {
      const weight = impactWeights[violation.impact as keyof typeof impactWeights] || 1
      return sum + (weight * violation.nodes.length)
    }, 0)

    // Score based on impact severity
    return Math.max(0, 100 - totalImpact)
  }

  getCriticalViolations(): AccessibilityIssue[] {
    return this.violations.filter(v => v.impact === 'critical')
  }

  getSeriousViolations(): AccessibilityIssue[] {
    return this.violations.filter(v => v.impact === 'serious')
  }

  getViolationsByRule(ruleId: string): AccessibilityIssue[] {
    return this.violations.filter(v => v.id === ruleId)
  }

  // Common accessibility checks
  checkColorContrast(): Promise<AccessibilityIssue[]> {
    return this.runSpecificCheck(['color-contrast', 'color-contrast-enhanced'])
  }

  checkKeyboardNavigation(): Promise<AccessibilityIssue[]> {
    return this.runSpecificCheck(['keyboard', 'focus-order-semantics', 'tabindex'])
  }

  checkAriaLabels(): Promise<AccessibilityIssue[]> {
    return this.runSpecificCheck([
      'aria-label', 'aria-labelledby', 'aria-describedby',
      'button-name', 'link-name', 'input-button-name'
    ])
  }

  checkHeadingStructure(): Promise<AccessibilityIssue[]> {
    return this.runSpecificCheck(['heading-order', 'empty-heading'])
  }

  checkImageAltText(): Promise<AccessibilityIssue[]> {
    return this.runSpecificCheck(['image-alt', 'image-redundant-alt'])
  }

  private async runSpecificCheck(rules: string[]): Promise<AccessibilityIssue[]> {
    if (typeof window === 'undefined' || !window.axe) {
      return []
    }

    try {
      const results = await window.axe.run(document, {
        runOnly: {
          type: 'rule',
          values: rules
        }
      })

      return results.violations.map(this.mapViolation)
    } catch (error) {
      console.error('Specific accessibility check failed:', error)
      return []
    }
  }

  // Generate accessibility report
  generateReport(): string {
    if (this.violations.length === 0) {
      return '✅ No accessibility violations found!'
    }

    const criticalCount = this.getCriticalViolations().length
    const seriousCount = this.getSeriousViolations().length
    const moderateCount = this.violations.filter(v => v.impact === 'moderate').length
    const minorCount = this.violations.filter(v => v.impact === 'minor').length

    return `
🔍 Accessibility Report
━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
• Critical: ${criticalCount} issues
• Serious: ${seriousCount} issues  
• Moderate: ${moderateCount} issues
• Minor: ${minorCount} issues

🎯 Priority Actions:
${this.getCriticalViolations().map(v => `• ${v.description}`).join('\n')}
${this.getSeriousViolations().map(v => `• ${v.description}`).join('\n')}

📈 Accessibility Score: ${this.calculateScore(this.violations)}/100
    `
  }

  // Real-time monitoring
  enableRealTimeMonitoring() {
    if (!this.isEnabled) return

    // Monitor DOM changes
    const observer = new MutationObserver(() => {
      // Debounce accessibility checks
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.runAudit().catch(console.error)
      }, 1000)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'role', 'tabindex']
    })

    return observer
  }

  private debounceTimer: NodeJS.Timeout | null = null
}

// Global instance
export const accessibilityChecker = new AccessibilityChecker()

// Hook for React components
export function useAccessibilityChecker() {
  return {
    runAudit: () => accessibilityChecker.runAudit(),
    checkColorContrast: () => accessibilityChecker.checkColorContrast(),
    checkKeyboardNavigation: () => accessibilityChecker.checkKeyboardNavigation(),
    checkAriaLabels: () => accessibilityChecker.checkAriaLabels(),
    checkHeadingStructure: () => accessibilityChecker.checkHeadingStructure(),
    checkImageAltText: () => accessibilityChecker.checkImageAltText(),
    generateReport: () => accessibilityChecker.generateReport(),
    getCriticalViolations: () => accessibilityChecker.getCriticalViolations(),
    getSeriousViolations: () => accessibilityChecker.getSeriousViolations()
  }
}

// Extend global types
declare global {
  interface Window {
    axe: any
  }
}

// React and ReactDOM imports for axe-core
declare const React: any
declare const ReactDOM: any