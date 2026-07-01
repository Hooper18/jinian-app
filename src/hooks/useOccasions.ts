import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { OccasionRow, OccasionInsert } from '../types/occasion'

export function useOccasions() {
  const { user } = useAuth()
  const [occasions, setOccasions] = useState<OccasionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setOccasions([])
      setLoading(false)
      return
    }
    setError(null)
    const { data, error } = await supabase
      .from('occasions')
      .select('*')
      .order('date', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setOccasions((data ?? []) as OccasionRow[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createOccasion = useCallback(
    async (input: OccasionInsert): Promise<OccasionRow> => {
      const { data, error } = await supabase.from('occasions').insert(input).select().single()
      if (error) throw error
      const row = data as OccasionRow
      setOccasions((prev) => [...prev, row])
      return row
    },
    [],
  )

  const updateOccasion = useCallback(
    async (id: string, patch: Partial<OccasionInsert>): Promise<OccasionRow> => {
      const { data, error } = await supabase
        .from('occasions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const row = data as OccasionRow
      setOccasions((prev) => prev.map((o) => (o.id === id ? row : o)))
      return row
    },
    [],
  )

  const deleteOccasion = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('occasions').delete().eq('id', id)
    if (error) throw error
    setOccasions((prev) => prev.filter((o) => o.id !== id))
  }, [])

  return { occasions, loading, error, createOccasion, updateOccasion, deleteOccasion, refresh }
}
