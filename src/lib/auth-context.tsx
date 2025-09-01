'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

type UserRow = Database['public']['Tables']['users']['Row']

interface User {
  id: string
  full_name: string
  phone?: string
  email?: string
  is_vip: boolean
  kyc_status: 'pending' | 'approved' | 'rejected'
  first_login: boolean
  wallet_balance: number
  total_saved: number
  total_earned: number
  trust_score: number
  active_groups: number
  completed_cycles: number
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  session: SupabaseSession | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name: string; phone?: string }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from Supabase
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile data from our users table with retry logic
          setTimeout(async () => {
            const profileLoaded = await fetchUserProfile(session.user.id)
            if (!profileLoaded) {
              console.warn('[Auth] Failed to load user profile after all retries')
            }
          }, 0)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      
      if (session?.user) {
        setTimeout(async () => {
          const profileLoaded = await fetchUserProfile(session.user.id)
          if (!profileLoaded) {
            console.warn('[Auth] Failed to load existing session profile')
          }
          setLoading(false)
        }, 0)
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<boolean> => {
    const maxRetries = 3
    const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff

    try {
      console.log(`[Auth] Fetching profile for user ${userId} (attempt ${retryCount + 1}/${maxRetries + 1})`)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error(`[Auth] Database error fetching profile:`, error)
        
        // If profile doesn't exist and we haven't maxed retries, try to create it
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log(`[Auth] Profile not found for user ${userId}, attempting to create...`)
          
          if (retryCount < maxRetries) {
            const profileCreated = await createUserProfileFallback(userId)
            if (profileCreated) {
              // Retry fetching after creating profile
              await new Promise(resolve => setTimeout(resolve, retryDelay))
              return fetchUserProfile(userId, retryCount + 1)
            }
          }
        }
        
        // For other errors, retry if possible
        if (retryCount < maxRetries) {
          console.log(`[Auth] Retrying profile fetch in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return fetchUserProfile(userId, retryCount + 1)
        }
        
        return false
      }

      if (data) {
        console.log(`[Auth] Profile loaded successfully for user ${userId}`)
        const userData = data as UserRow
        setUser({
          id: userData.id,
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          is_vip: userData.is_vip || false,
          kyc_status: (userData.kyc_status as 'pending' | 'approved' | 'rejected') || 'pending',
          first_login: userData.first_login || true,
          wallet_balance: userData.wallet_balance || 0,
          total_saved: userData.total_saved || 0,
          total_earned: userData.total_earned || 0,
          trust_score: userData.trust_score || 50,
          active_groups: userData.active_groups || 0,
          completed_cycles: userData.completed_cycles || 0
        })
        return true
      } else {
        console.log(`[Auth] No profile data returned for user ${userId}`)
        
        // Profile doesn't exist, try to create it
        if (retryCount < maxRetries) {
          const profileCreated = await createUserProfileFallback(userId)
          if (profileCreated) {
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            return fetchUserProfile(userId, retryCount + 1)
          }
        }
        
        return false
      }
    } catch (error) {
      console.error(`[Auth] Unexpected error in fetchUserProfile:`, error)
      
      // Retry on network or unexpected errors
      if (retryCount < maxRetries) {
        console.log(`[Auth] Retrying due to unexpected error in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return fetchUserProfile(userId, retryCount + 1)
      }
      
      return false
    }
  }

  const createUserProfileFallback = async (userId: string): Promise<boolean> => {
    try {
      console.log(`[Auth] Creating fallback profile for user ${userId}`)
      
      // Get user data from Supabase Auth
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser?.user || authUser.user.id !== userId) {
        console.error('[Auth] Auth user not found or ID mismatch')
        return false
      }

      const user = authUser.user
      const email = user.email || ''
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Utilizador'
      const phone = user.user_metadata?.phone || user.phone || ''

      console.log(`[Auth] Creating profile with name: ${fullName}, email exists: ${!!email}`)

      const { error } = await supabase.from('users').insert({
        id: userId,
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        email_verified: !!user.email_confirmed_at,
        phone_verified: !!user.phone_confirmed_at,
        kyc_status: 'pending',
        is_active: true,
        trust_score: 50,
        wallet_balance: 0.00,
        total_saved: 0.00,
        total_earned: 0.00,
        total_withdrawn: 0.00,
        active_groups: 0,
        completed_cycles: 0,
        first_login: true
      })

      if (error) {
        console.error('[Auth] Error creating fallback profile:', error)
        return false
      }

      console.log(`[Auth] Fallback profile created successfully for user ${userId}`)
      return true
    } catch (error) {
      console.error('[Auth] Unexpected error creating fallback profile:', error)
      return false
    }
  }

  const signUp = async (email: string, password: string, userData?: { full_name: string; phone?: string }) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData ? {
          full_name: userData.full_name,
          phone: userData.phone || ''
        } : {}
      }
    })
    
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSupabaseUser(null)
      setSession(null)
    }
    return { error }
  }

  const refreshUserData = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUserData
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