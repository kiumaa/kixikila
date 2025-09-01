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
          // Fetch user profile data from our users table
          await fetchUserProfile(session.user.id)
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
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      if (data) {
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
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
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