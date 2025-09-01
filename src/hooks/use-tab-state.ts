'use client'

import { useEffect, useRef } from 'react'
import { useAppState } from '@/contexts/app-state-context'

interface UseTabStateOptions {
  tab: 'dashboard' | 'wallet' | 'groups' | 'notifications'
  scrollElementId?: string
  autoSave?: boolean
}

export function useTabState({ tab, scrollElementId, autoSave = true }: UseTabStateOptions) {
  const { state, setTabState } = useAppState()
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  
  const tabState = state.tabs[tab]

  // Save scroll position
  const saveScrollPosition = (position: number) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setTabState(tab, { scrollPosition: position })
    }, 100) // Debounce scroll saves
  }

  // Restore scroll position
  const restoreScrollPosition = () => {
    if (scrollElementId && tabState.scrollPosition > 0) {
      const element = document.getElementById(scrollElementId)
      if (element) {
        setTimeout(() => {
          element.scrollTo({
            top: tabState.scrollPosition,
            behavior: 'smooth'
          })
        }, 100) // Allow time for content to load
      }
    } else if (tabState.scrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: tabState.scrollPosition,
          behavior: 'smooth'
        })
      }, 100)
    }
  }

  // Set up scroll listener
  useEffect(() => {
    if (!autoSave) return

    const handleScroll = () => {
      const position = scrollElementId 
        ? document.getElementById(scrollElementId)?.scrollTop || 0
        : window.scrollY
      
      saveScrollPosition(position)
    }

    const element = scrollElementId 
      ? document.getElementById(scrollElementId)
      : window

    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [scrollElementId, autoSave, tab])

  // Filters management
  const setFilters = (filters: Record<string, any>) => {
    setTabState(tab, { filters })
  }

  const updateFilter = (key: string, value: any) => {
    setTabState(tab, { 
      filters: { 
        ...tabState.filters, 
        [key]: value 
      } 
    })
  }

  const clearFilters = () => {
    setTabState(tab, { filters: {} })
  }

  // Search management
  const setSearchQuery = (query: string) => {
    setTabState(tab, { searchQuery: query })
  }

  const clearSearch = () => {
    setTabState(tab, { searchQuery: '' })
  }

  // Selection management
  const setSelectedItems = (items: string[]) => {
    setTabState(tab, { selectedItems: items })
  }

  const toggleSelectedItem = (itemId: string) => {
    const isSelected = tabState.selectedItems.includes(itemId)
    const newSelection = isSelected
      ? tabState.selectedItems.filter(id => id !== itemId)
      : [...tabState.selectedItems, itemId]
    
    setTabState(tab, { selectedItems: newSelection })
  }

  const clearSelection = () => {
    setTabState(tab, { selectedItems: [] })
  }

  return {
    // State
    scrollPosition: tabState.scrollPosition,
    filters: tabState.filters,
    searchQuery: tabState.searchQuery,
    selectedItems: tabState.selectedItems,
    
    // Actions
    saveScrollPosition,
    restoreScrollPosition,
    setFilters,
    updateFilter,
    clearFilters,
    setSearchQuery,
    clearSearch,
    setSelectedItems,
    toggleSelectedItem,
    clearSelection,
    
    // Utilities
    hasFilters: Object.keys(tabState.filters).length > 0,
    hasSearch: tabState.searchQuery.length > 0,
    hasSelection: tabState.selectedItems.length > 0
  }
}