'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/lib/auth-context'
import type { Database } from '@/integrations/supabase/types'

type GroupRow = Database['public']['Tables']['groups']['Row']
type GroupMemberRow = Database['public']['Tables']['group_members']['Row']

interface UserGroup extends GroupRow {
  member_role?: string
  member_status?: string
  total_contributed?: number
  current_balance?: number
}

export function useUserGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserGroups = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get user's groups through group_members table
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          role,
          status,
          total_contributed,
          current_balance,
          groups (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (memberError) throw memberError

      const userGroups = memberData?.map(member => ({
        ...member.groups,
        member_role: member.role,
        member_status: member.status,
        total_contributed: member.total_contributed,
        current_balance: member.current_balance
      })) || []

      setGroups(userGroups)
      setError(null)
    } catch (err) {
      console.error('Error fetching user groups:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserGroups()
  }, [user?.id])

  return {
    groups,
    loading,
    error,
    refetch: fetchUserGroups
  }
}