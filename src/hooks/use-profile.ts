'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/lib/auth-context'
import type { Database } from '@/integrations/supabase/types'

type UserRow = Database['public']['Tables']['users']['Row']

interface ProfileData extends UserRow {
  // Add any computed fields if needed
}

export function useProfile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    if (!authUser?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error

      setProfile(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserRow>) => {
    if (!authUser?.id) return

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authUser.id)

      if (error) throw error

      // Refresh profile data
      await fetchProfile()
      return true
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return false
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [authUser?.id])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  }
}