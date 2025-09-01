'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'

interface TabState {
  scrollPosition: number
  filters: Record<string, any>
  searchQuery: string
  selectedItems: string[]
}

interface AppState {
  tabs: {
    dashboard: TabState
    wallet: TabState
    groups: TabState
    notifications: TabState
  }
  ui: {
    sidebarOpen: boolean
    theme: 'light' | 'dark' | 'system'
    reducedMotion: boolean
  }
  cache: {
    groups: any[]
    transactions: any[]
    notifications: any[]
    lastUpdate: number
  }
}

type AppAction = 
  | { type: 'SET_TAB_STATE'; payload: { tab: keyof AppState['tabs']; state: Partial<TabState> } }
  | { type: 'SET_UI_STATE'; payload: Partial<AppState['ui']> }
  | { type: 'UPDATE_CACHE'; payload: { key: keyof AppState['cache']; data: any } }
  | { type: 'RESET_TAB'; payload: { tab: keyof AppState['tabs'] } }
  | { type: 'RESTORE_STATE'; payload: AppState }

const initialTabState: TabState = {
  scrollPosition: 0,
  filters: {},
  searchQuery: '',
  selectedItems: []
}

const initialState: AppState = {
  tabs: {
    dashboard: { ...initialTabState },
    wallet: { ...initialTabState },
    groups: { ...initialTabState },
    notifications: { ...initialTabState }
  },
  ui: {
    sidebarOpen: false,
    theme: 'system',
    reducedMotion: false
  },
  cache: {
    groups: [],
    transactions: [],
    notifications: [],
    lastUpdate: 0
  }
}

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TAB_STATE':
      return {
        ...state,
        tabs: {
          ...state.tabs,
          [action.payload.tab]: {
            ...state.tabs[action.payload.tab],
            ...action.payload.state
          }
        }
      }
    
    case 'SET_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      }
    
    case 'UPDATE_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: action.payload.data,
          lastUpdate: Date.now()
        }
      }
    
    case 'RESET_TAB':
      return {
        ...state,
        tabs: {
          ...state.tabs,
          [action.payload.tab]: { ...initialTabState }
        }
      }
    
    case 'RESTORE_STATE':
      return action.payload
    
    default:
      return state
  }
}

interface AppStateContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  setTabState: (tab: keyof AppState['tabs'], state: Partial<TabState>) => void
  setUIState: (state: Partial<AppState['ui']>) => void
  updateCache: (key: keyof AppState['cache'], data: any) => void
  resetTab: (tab: keyof AppState['tabs']) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

const STORAGE_KEY = 'kixikila_app_state'

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        // Check if state is not too old (24 hours)
        if (Date.now() - parsedState.cache.lastUpdate < 24 * 60 * 60 * 1000) {
          dispatch({ type: 'RESTORE_STATE', payload: parsedState })
        }
      }
    } catch (error) {
      console.error('Error loading app state:', error)
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    dispatch({ type: 'SET_UI_STATE', payload: { reducedMotion: prefersReducedMotion } })
  }, [])

  // Save state to localStorage on changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Error saving app state:', error)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [state])

  const setTabState = (tab: keyof AppState['tabs'], tabState: Partial<TabState>) => {
    dispatch({ type: 'SET_TAB_STATE', payload: { tab, state: tabState } })
  }

  const setUIState = (uiState: Partial<AppState['ui']>) => {
    dispatch({ type: 'SET_UI_STATE', payload: uiState })
  }

  const updateCache = (key: keyof AppState['cache'], data: any) => {
    dispatch({ type: 'UPDATE_CACHE', payload: { key, data } })
  }

  const resetTab = (tab: keyof AppState['tabs']) => {
    dispatch({ type: 'RESET_TAB', payload: { tab } })
  }

  return (
    <AppStateContext.Provider value={{
      state,
      dispatch,
      setTabState,
      setUIState,
      updateCache,
      resetTab
    }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}