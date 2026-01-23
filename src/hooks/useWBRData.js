import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../components/auth/AuthProvider'
import {
  fetchMonthlyData,
  saveMonthlyData,
  updateMonthData as updateMonthInDb,
  hasLocalData,
  migrateFromLocalStorage,
  createEmptyMonthlyData,
} from '../services/wbrDataService'

export function useWBRData() {
  const { isAuthenticated } = useAuthContext()

  const [monthlyData2025, setMonthlyData2025] = useState(createEmptyMonthlyData)
  const [monthlyData2026Base, setMonthlyData2026Base] = useState(createEmptyMonthlyData)
  const [monthlyData2026Upside, setMonthlyData2026Upside] = useState(createEmptyMonthlyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Check for local data to migrate when authenticated
  useEffect(() => {
    if (isAuthenticated && hasLocalData()) {
      setShowMigrationPrompt(true)
    }
  }, [isAuthenticated])

  // Load data from Supabase
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const [data2025, data2026Base, data2026Upside] = await Promise.all([
          fetchMonthlyData(2025, 'actual'),
          fetchMonthlyData(2026, 'base'),
          fetchMonthlyData(2026, 'upside'),
        ])

        if (data2025) setMonthlyData2025(data2025)
        if (data2026Base) setMonthlyData2026Base(data2026Base)
        if (data2026Upside) setMonthlyData2026Upside(data2026Upside)
      } catch (err) {
        console.error('Error loading WBR data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // Update handlers that save to Supabase
  const updateMonthData2025 = useCallback(async (monthIndex, field, value) => {
    // Optimistic update
    setMonthlyData2025(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    // Save to database
    await updateMonthInDb(2025, 'actual', monthIndex, field, value)
  }, [])

  const updateMonthData2026Base = useCallback(async (monthIndex, field, value) => {
    setMonthlyData2026Base(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    await updateMonthInDb(2026, 'base', monthIndex, field, value)
  }, [])

  const updateMonthData2026Upside = useCallback(async (monthIndex, field, value) => {
    setMonthlyData2026Upside(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    await updateMonthInDb(2026, 'upside', monthIndex, field, value)
  }, [])

  // Bulk save (for paste operations)
  const saveAllData = useCallback(async () => {
    setIsSaving(true)
    try {
      await Promise.all([
        saveMonthlyData(2025, 'actual', monthlyData2025),
        saveMonthlyData(2026, 'base', monthlyData2026Base),
        saveMonthlyData(2026, 'upside', monthlyData2026Upside),
      ])
    } finally {
      setIsSaving(false)
    }
  }, [monthlyData2025, monthlyData2026Base, monthlyData2026Upside])

  // Migration handler
  const migrateLocalData = useCallback(async () => {
    setIsSaving(true)
    try {
      const results = await migrateFromLocalStorage()
      console.log('Migration results:', results)
      setShowMigrationPrompt(false)

      // Reload data after migration
      const [data2025, data2026Base, data2026Upside] = await Promise.all([
        fetchMonthlyData(2025, 'actual'),
        fetchMonthlyData(2026, 'base'),
        fetchMonthlyData(2026, 'upside'),
      ])

      if (data2025) setMonthlyData2025(data2025)
      if (data2026Base) setMonthlyData2026Base(data2026Base)
      if (data2026Upside) setMonthlyData2026Upside(data2026Upside)

      return results
    } finally {
      setIsSaving(false)
    }
  }, [])

  const skipMigration = useCallback(() => {
    setShowMigrationPrompt(false)
  }, [])

  return {
    // Data
    monthlyData2025,
    monthlyData2026Base,
    monthlyData2026Upside,

    // Setters (for bulk updates like paste)
    setMonthlyData2025,
    setMonthlyData2026Base,
    setMonthlyData2026Upside,

    // Update handlers
    updateMonthData2025,
    updateMonthData2026Base,
    updateMonthData2026Upside,

    // Save all data
    saveAllData,

    // State
    loading,
    error,
    isSaving,

    // Migration
    showMigrationPrompt,
    migrateLocalData,
    skipMigration,
  }
}
