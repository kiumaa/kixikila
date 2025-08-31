'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  full_name: string
  phone: string
  email?: string
  is_vip: boolean
  kyc_status: 'pending' | 'approved' | 'rejected'
  first_login: boolean
}

interface Session {
  user: User
  access_token: string
  expires_at: number
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (phone: string, fullName: string) => Promise<{ success: boolean; requiresOTP?: boolean }>
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; requiresPIN?: boolean }>
  setupPIN: (pin: string) => Promise<{ success: boolean }>
  signIn: (phone: string) => Promise<{ success: boolean; requiresOTP?: boolean; requiresPIN?: boolean }>
  verifyPIN: (pin: string) => Promise<{ success: boolean }>
  signOut: () => void
  completedKYC: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_USERS_KEY = 'kixikila_mock_users'
const CURRENT_SESSION_KEY = 'kixikila_current_session'
const PENDING_AUTH_KEY = 'kixikila_pending_auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedSession = localStorage.getItem(CURRENT_SESSION_KEY)
        if (savedSession) {
          const parsedSession: Session = JSON.parse(savedSession)
          
          // Check if session is still valid
          if (parsedSession.expires_at > Date.now()) {
            setSession(parsedSession)
            setUser(parsedSession.user)
          } else {
            // Session expired, clear it
            localStorage.removeItem(CURRENT_SESSION_KEY)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        localStorage.removeItem(CURRENT_SESSION_KEY)
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const getMockUsers = (): User[] => {
    try {
      const users = localStorage.getItem(MOCK_USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  const saveMockUsers = (users: User[]) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
  }

  const createSession = (user: User) => {
    const session: Session = {
      user,
      access_token: `mock_token_${Date.now()}`,
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }
    
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))
    setSession(session)
    setUser(user)
    
    return session
  }

  const signUp = async (phone: string, fullName: string) => {
    // Check if user already exists
    const users = getMockUsers()
    const existingUser = users.find(u => u.phone === phone)
    
    if (existingUser) {
      return { success: false }
    }

    // Store pending registration
    localStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
      type: 'signup',
      phone,
      fullName,
      step: 'otp'
    }))

    return { success: true, requiresOTP: true }
  }

  const verifyOTP = async (phone: string, otp: string) => {
    // Mock OTP verification (accept any 6-digit code)
    if (otp.length !== 6) {
      return { success: false }
    }

    const pendingAuth = localStorage.getItem(PENDING_AUTH_KEY)
    if (!pendingAuth) {
      return { success: false }
    }

    const authData = JSON.parse(pendingAuth)
    if (authData.phone !== phone) {
      return { success: false }
    }

    // Update pending auth to PIN setup step
    localStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
      ...authData,
      step: 'pin'
    }))

    return { success: true, requiresPIN: true }
  }

  const setupPIN = async (pin: string) => {
    if (pin.length !== 4) {
      return { success: false }
    }

    const pendingAuth = localStorage.getItem(PENDING_AUTH_KEY)
    if (!pendingAuth) {
      return { success: false }
    }

    const authData = JSON.parse(pendingAuth)
    
    if (authData.type === 'signup') {
      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        full_name: authData.fullName,
        phone: authData.phone,
        is_vip: false,
        kyc_status: 'pending',
        first_login: true
      }

      const users = getMockUsers()
      users.push(newUser)
      saveMockUsers(users)

      // Create session
      createSession(newUser)
      
      // Clear pending auth
      localStorage.removeItem(PENDING_AUTH_KEY)
      
      return { success: true }
    }

    return { success: false }
  }

  const signIn = async (phone: string) => {
    const users = getMockUsers()
    const user = users.find(u => u.phone === phone)
    
    if (!user) {
      return { success: false }
    }

    // Check if there's an active session
    const savedSession = localStorage.getItem(CURRENT_SESSION_KEY)
    if (savedSession) {
      try {
        const parsedSession: Session = JSON.parse(savedSession)
        if (parsedSession.expires_at > Date.now() && parsedSession.user.phone === phone) {
          // Active session exists, only require PIN
          localStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
            type: 'signin',
            phone,
            step: 'pin',
            userId: user.id
          }))
          return { success: true, requiresPIN: true }
        }
      } catch {
        localStorage.removeItem(CURRENT_SESSION_KEY)
      }
    }

    // No active session, require OTP + PIN
    localStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
      type: 'signin',
      phone,
      step: 'otp',
      userId: user.id
    }))

    return { success: true, requiresOTP: true }
  }

  const verifyPIN = async (pin: string) => {
    if (pin.length !== 4) {
      return { success: false }
    }

    const pendingAuth = localStorage.getItem(PENDING_AUTH_KEY)
    if (!pendingAuth) {
      return { success: false }
    }

    const authData = JSON.parse(pendingAuth)
    
    if (authData.type === 'signin') {
      const users = getMockUsers()
      const user = users.find(u => u.id === authData.userId)
      
      if (user) {
        // Create session
        createSession(user)
        
        // Clear pending auth
        localStorage.removeItem(PENDING_AUTH_KEY)
        
        return { success: true }
      }
    }

    return { success: false }
  }

  const signOut = () => {
    localStorage.removeItem(CURRENT_SESSION_KEY)
    localStorage.removeItem(PENDING_AUTH_KEY)
    setSession(null)
    setUser(null)
  }

  const completedKYC = () => {
    if (user) {
      const updatedUser = { ...user, first_login: false }
      const users = getMockUsers()
      const userIndex = users.findIndex(u => u.id === user.id)
      
      if (userIndex !== -1) {
        users[userIndex] = updatedUser
        saveMockUsers(users)
        
        // Update current session
        if (session) {
          const updatedSession = { ...session, user: updatedUser }
          localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(updatedSession))
          setSession(updatedSession)
          setUser(updatedUser)
        }
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      verifyOTP,
      setupPIN,
      signIn,
      verifyPIN,
      signOut,
      completedKYC
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}