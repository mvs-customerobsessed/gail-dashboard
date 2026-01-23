import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUser(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    async function fetchProfile() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        // If profile doesn't exist yet, that's okay - it will be created by trigger
        if (fetchError.code === 'PGRST116') {
          setProfile(null)
        } else {
          setError(fetchError)
        }
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [userId])

  const updateProfile = async (updates) => {
    if (!userId) return

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) throw updateError
    setProfile(data)
    return data
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
  }
}
