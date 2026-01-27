import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../components/auth/AuthProvider'
import {
  fetchMonthlyData,
  saveMonthlyData,
  updateMonthData as updateMonthInDb,
  hasLocalData,
  migrateFromLocalStorage,
  createEmptyMonthlyData,
  createEmptyCustomersData,
  fetchCustomersData,
  createEmptyCustomerServiceData,
  fetchCustomerServiceData,
  createEmptySalesData,
  fetchSalesData,
} from '../services/wbrDataService'

export function useWBRData() {
  const { isAuthenticated } = useAuthContext()

  const [monthlyData2025, setMonthlyData2025] = useState(createEmptyMonthlyData)
  const [monthlyData2026Base, setMonthlyData2026Base] = useState(createEmptyMonthlyData)
  const [monthlyData2026Upside, setMonthlyData2026Upside] = useState(createEmptyMonthlyData)
  const [customersData2025, setCustomersData2025] = useState(createEmptyCustomersData)
  const [customersData, setCustomersData] = useState(createEmptyCustomersData)
  const [customersGoalsData, setCustomersGoalsData] = useState(createEmptyCustomersData)
  // Customer Service data
  const [customerServiceData2025, setCustomerServiceData2025] = useState(createEmptyCustomerServiceData)
  const [customerServiceData, setCustomerServiceData] = useState(createEmptyCustomerServiceData)
  const [customerServiceGoalsData, setCustomerServiceGoalsData] = useState(createEmptyCustomerServiceData)
  // Sales data
  const [salesData2025, setSalesData2025] = useState(createEmptySalesData)
  const [salesData, setSalesData] = useState(createEmptySalesData)
  const [salesGoalsData, setSalesGoalsData] = useState(createEmptySalesData)
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
        const [
          data2025, data2026Base, data2026Upside,
          dataCustomers2025, dataCustomers, dataCustomersGoals,
          dataCustomerService2025, dataCustomerService, dataCustomerServiceGoals,
          dataSales2025, dataSales, dataSalesGoals
        ] = await Promise.all([
          fetchMonthlyData(2025, 'actual'),
          fetchMonthlyData(2026, 'base'),
          fetchMonthlyData(2026, 'upside'),
          fetchCustomersData(2025, 'customers'),
          fetchCustomersData(2026, 'customers'),
          fetchCustomersData(2026, 'customers_goals'),
          fetchCustomerServiceData(2025, 'customer_service'),
          fetchCustomerServiceData(2026, 'customer_service'),
          fetchCustomerServiceData(2026, 'customer_service_goals'),
          fetchSalesData(2025, 'sales'),
          fetchSalesData(2026, 'sales'),
          fetchSalesData(2026, 'sales_goals'),
        ])

        if (data2025) setMonthlyData2025(data2025)
        if (data2026Base) setMonthlyData2026Base(data2026Base)
        if (data2026Upside) setMonthlyData2026Upside(data2026Upside)
        if (dataCustomers2025) setCustomersData2025(dataCustomers2025)
        if (dataCustomers) setCustomersData(dataCustomers)
        if (dataCustomersGoals) setCustomersGoalsData(dataCustomersGoals)
        if (dataCustomerService2025) setCustomerServiceData2025(dataCustomerService2025)
        if (dataCustomerService) setCustomerServiceData(dataCustomerService)
        if (dataCustomerServiceGoals) setCustomerServiceGoalsData(dataCustomerServiceGoals)
        if (dataSales2025) setSalesData2025(dataSales2025)
        if (dataSales) setSalesData(dataSales)
        if (dataSalesGoals) setSalesGoalsData(dataSalesGoals)
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

  // Update customers data (2025)
  const updateCustomersMonth2025 = useCallback(async (monthIndex, field, value) => {
    // Optimistic update
    setCustomersData2025(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    // Save to database - returns true/false
    const success = await updateMonthInDb(2025, 'customers', monthIndex, field, value)
    return success
  }, [])

  // Update customers data (2026)
  const updateCustomersMonth = useCallback(async (monthIndex, field, value) => {
    // Optimistic update
    setCustomersData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    // Save to database - returns true/false
    const success = await updateMonthInDb(2026, 'customers', monthIndex, field, value)
    return success
  }, [])

  // Update customers goals data
  const updateGoalsMonth = useCallback(async (monthIndex, field, value) => {
    // Optimistic update
    setCustomersGoalsData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })

    // Save to database - returns true/false
    const success = await updateMonthInDb(2026, 'customers_goals', monthIndex, field, value)
    return success
  }, [])

  // ============================================
  // Customer Service Update Functions
  // ============================================

  // Update customer service data (2025)
  const updateCustomerServiceMonth2025 = useCallback(async (monthIndex, field, value) => {
    if (!isAuthenticated) {
      console.warn('Cannot update: not authenticated')
      return false
    }
    setCustomerServiceData2025(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2025, 'customer_service', monthIndex, field, value)
    if (!success) {
      console.error('Failed to save customer service 2025 data')
    }
    return success
  }, [isAuthenticated])

  // Update customer service data (2026)
  const updateCustomerServiceMonth = useCallback(async (monthIndex, field, value) => {
    if (!isAuthenticated) {
      console.warn('Cannot update: not authenticated')
      return false
    }
    setCustomerServiceData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2026, 'customer_service', monthIndex, field, value)
    if (!success) {
      console.error('Failed to save customer service 2026 data')
    }
    return success
  }, [isAuthenticated])

  // Update customer service goals data
  const updateCustomerServiceGoalsMonth = useCallback(async (monthIndex, field, value) => {
    if (!isAuthenticated) {
      console.warn('Cannot update: not authenticated')
      return false
    }
    setCustomerServiceGoalsData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2026, 'customer_service_goals', monthIndex, field, value)
    if (!success) {
      console.error('Failed to save customer service goals data')
    }
    return success
  }, [isAuthenticated])

  // ============================================
  // Sales Update Functions
  // ============================================

  // Update sales data (2025)
  const updateSalesMonth2025 = useCallback(async (monthIndex, field, value) => {
    setSalesData2025(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2025, 'sales', monthIndex, field, value)
    return success
  }, [])

  // Update sales data (2026)
  const updateSalesMonth = useCallback(async (monthIndex, field, value) => {
    setSalesData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2026, 'sales', monthIndex, field, value)
    return success
  }, [])

  // Update sales goals data
  const updateSalesGoalsMonth = useCallback(async (monthIndex, field, value) => {
    setSalesGoalsData(prev => {
      const updated = [...prev]
      updated[monthIndex] = { ...updated[monthIndex], [field]: value }
      return updated
    })
    const success = await updateMonthInDb(2026, 'sales_goals', monthIndex, field, value)
    return success
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
    customersData2025,
    customersData,
    customersGoalsData,
    customerServiceData2025,
    customerServiceData,
    customerServiceGoalsData,
    salesData2025,
    salesData,
    salesGoalsData,

    // Setters (for bulk updates like paste)
    setMonthlyData2025,
    setMonthlyData2026Base,
    setMonthlyData2026Upside,
    setCustomersData2025,
    setCustomersData,
    setCustomersGoalsData,
    setCustomerServiceData2025,
    setCustomerServiceData,
    setCustomerServiceGoalsData,
    setSalesData2025,
    setSalesData,
    setSalesGoalsData,

    // Update handlers
    updateMonthData2025,
    updateMonthData2026Base,
    updateMonthData2026Upside,
    updateCustomersMonth2025,
    updateCustomersMonth,
    updateGoalsMonth,
    updateCustomerServiceMonth2025,
    updateCustomerServiceMonth,
    updateCustomerServiceGoalsMonth,
    updateSalesMonth2025,
    updateSalesMonth,
    updateSalesGoalsMonth,

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
