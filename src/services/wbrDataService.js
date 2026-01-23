import { supabase } from '../lib/supabase'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Convert database row to app format
function dbRowToAppFormat(row) {
  return {
    month: MONTHS[row.month - 1],
    smbRevenue: row.smb_revenue || 0,
    enterpriseRevenue: row.enterprise_revenue || 0,
    bancoAztecaRevenue: row.banco_azteca_revenue || 0,
    smbAccounts: row.smb_accounts || 0,
    enterpriseAccounts: row.enterprise_accounts || 0,
    nps: row.nps,
    burn: row.burn || 0,
    grossMarginPct: row.gross_margin_pct || 0,
  }
}

// Convert app format to database row
function appFormatToDbRow(monthData, monthIndex) {
  return {
    month: monthIndex + 1,
    smb_revenue: parseFloat(monthData.smbRevenue) || 0,
    enterprise_revenue: parseFloat(monthData.enterpriseRevenue) || 0,
    banco_azteca_revenue: parseFloat(monthData.bancoAztecaRevenue) || 0,
    smb_accounts: parseInt(monthData.smbAccounts) || 0,
    enterprise_accounts: parseInt(monthData.enterpriseAccounts) || 0,
    nps: monthData.nps !== null && monthData.nps !== '' ? parseFloat(monthData.nps) : null,
    burn: parseFloat(monthData.burn) || 0,
    gross_margin_pct: parseFloat(monthData.grossMarginPct) || 0,
  }
}

// Create empty monthly data
function createEmptyMonthlyData() {
  return MONTHS.map(month => ({
    month,
    smbRevenue: 0,
    enterpriseRevenue: 0,
    bancoAztecaRevenue: 0,
    smbAccounts: 0,
    enterpriseAccounts: 0,
    nps: null,
    burn: 0,
    grossMarginPct: 0,
  }))
}

// Get or create a dataset for a year/scenario
async function getOrCreateDataset(year, scenario) {
  // Try to find existing dataset
  let { data: dataset, error } = await supabase
    .from('wbr_datasets')
    .select('*')
    .eq('year', year)
    .eq('scenario', scenario)
    .single()

  if (error && error.code === 'PGRST116') {
    // Dataset doesn't exist, create it
    const { data: newDataset, error: createError } = await supabase
      .from('wbr_datasets')
      .insert({ year, scenario })
      .select()
      .single()

    if (createError) throw createError
    dataset = newDataset
  } else if (error) {
    throw error
  }

  return dataset
}

// Fetch monthly data for a dataset
async function fetchMonthlyData(year, scenario) {
  try {
    const dataset = await getOrCreateDataset(year, scenario)

    const { data: rows, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('dataset_id', dataset.id)
      .order('month')

    if (error) throw error

    // Convert to app format, filling in missing months
    const monthlyData = createEmptyMonthlyData()
    rows.forEach(row => {
      const monthIndex = row.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = dbRowToAppFormat(row)
      }
    })

    return monthlyData
  } catch (error) {
    console.error('Error fetching monthly data:', error)
    return null
  }
}

// Save monthly data for a dataset
async function saveMonthlyData(year, scenario, monthlyData) {
  try {
    const dataset = await getOrCreateDataset(year, scenario)

    // Upsert all monthly data
    const rows = monthlyData.map((monthData, index) => ({
      dataset_id: dataset.id,
      ...appFormatToDbRow(monthData, index),
    }))

    const { error } = await supabase
      .from('monthly_data')
      .upsert(rows, {
        onConflict: 'dataset_id,month',
      })

    if (error) throw error

    // Update dataset timestamp
    await supabase
      .from('wbr_datasets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', dataset.id)

    return true
  } catch (error) {
    console.error('Error saving monthly data:', error)
    return false
  }
}

// Update a single month's data
async function updateMonthData(year, scenario, monthIndex, field, value) {
  try {
    const dataset = await getOrCreateDataset(year, scenario)

    // Map app field name to db column name
    const fieldMap = {
      smbRevenue: 'smb_revenue',
      enterpriseRevenue: 'enterprise_revenue',
      bancoAztecaRevenue: 'banco_azteca_revenue',
      smbAccounts: 'smb_accounts',
      enterpriseAccounts: 'enterprise_accounts',
      nps: 'nps',
      burn: 'burn',
      grossMarginPct: 'gross_margin_pct',
    }

    const dbField = fieldMap[field]
    if (!dbField) throw new Error(`Unknown field: ${field}`)

    // Parse value appropriately
    let parsedValue
    if (field === 'nps') {
      parsedValue = value !== null && value !== '' ? parseFloat(value) : null
    } else if (field === 'smbAccounts' || field === 'enterpriseAccounts') {
      parsedValue = parseInt(value) || 0
    } else {
      parsedValue = parseFloat(value) || 0
    }

    const { error } = await supabase
      .from('monthly_data')
      .upsert({
        dataset_id: dataset.id,
        month: monthIndex + 1,
        [dbField]: parsedValue,
      }, {
        onConflict: 'dataset_id,month',
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating month data:', error)
    return false
  }
}

// Migrate data from localStorage to Supabase
async function migrateFromLocalStorage() {
  const migrations = [
    { key: 'gail-wbr-data-2025-v2', year: 2025, scenario: 'actual' },
    { key: 'gail-wbr-data-2026-base-v1', year: 2026, scenario: 'base' },
    { key: 'gail-wbr-data-2026-upside-v1', year: 2026, scenario: 'upside' },
  ]

  const results = []

  for (const { key, year, scenario } of migrations) {
    const localData = localStorage.getItem(key)
    if (localData) {
      try {
        const monthlyData = JSON.parse(localData)
        const success = await saveMonthlyData(year, scenario, monthlyData)
        if (success) {
          localStorage.removeItem(key)
          results.push({ key, success: true })
        } else {
          results.push({ key, success: false, error: 'Save failed' })
        }
      } catch (error) {
        results.push({ key, success: false, error: error.message })
      }
    }
  }

  return results
}

// Check if there's local data to migrate
function hasLocalData() {
  return [
    'gail-wbr-data-2025-v2',
    'gail-wbr-data-2026-base-v1',
    'gail-wbr-data-2026-upside-v1',
  ].some(key => localStorage.getItem(key) !== null)
}

export {
  fetchMonthlyData,
  saveMonthlyData,
  updateMonthData,
  migrateFromLocalStorage,
  hasLocalData,
  createEmptyMonthlyData,
}
