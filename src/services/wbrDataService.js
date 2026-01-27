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
    console.log(`Creating new dataset: year=${year}, scenario=${scenario}`)
    const { data: newDataset, error: createError } = await supabase
      .from('wbr_datasets')
      .insert({ year, scenario })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create dataset:', createError)
      throw createError
    }
    console.log('Dataset created:', newDataset)
    dataset = newDataset
  } else if (error) {
    console.error('Error fetching dataset:', error)
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
      // Financial metrics (existing)
      smbRevenue: 'smb_revenue',
      enterpriseRevenue: 'enterprise_revenue',
      bancoAztecaRevenue: 'banco_azteca_revenue',
      smbAccounts: 'smb_accounts',
      enterpriseAccounts: 'enterprise_accounts',
      nps: 'nps',
      burn: 'burn',
      grossMarginPct: 'gross_margin_pct',
      // Customer metrics
      gailGptSeats: 'gailgpt_seats',
      smbCalls: 'smb_calls',
      enterpriseCalls: 'enterprise_calls',
      smbTalkTime: 'smb_talk_time',
      enterpriseTalkTime: 'enterprise_talk_time',
      churned: 'churned',
      startOfPeriodAccounts: 'start_of_period_accounts',
      enterpriseRevenueCustomers: 'enterprise_revenue_customers',
      enterpriseExpansion: 'enterprise_expansion',
      // Customer service metrics
      ticketVolume: 'ticket_volume',
      resolutionTime: 'resolution_time',
      customerServiceNps: 'customer_service_nps',
      firstResponseTime: 'first_response_time',
      // Sales metrics
      pipelineAdded: 'pipeline_added',
      totalPipeline: 'total_pipeline',
      dealsClosed: 'deals_closed',
      revenueClosed: 'revenue_closed',
      winRate: 'win_rate',
      meetingsBooked: 'meetings_booked',
      qualifiedLeads: 'qualified_leads',
      avgDealSize: 'avg_deal_size',
    }

    const dbField = fieldMap[field]
    if (!dbField) {
      console.error(`Unknown field: ${field}`)
      throw new Error(`Unknown field: ${field}`)
    }

    // Parse value appropriately - integers for counts, floats for revenue/percentages
    const intFields = [
      'smbAccounts', 'enterpriseAccounts', 'gailGptSeats', 'smbCalls',
      'enterpriseCalls', 'smbTalkTime', 'enterpriseTalkTime', 'churned', 'startOfPeriodAccounts',
      // Customer service integers
      'ticketVolume',
      // Sales integers
      'dealsClosed', 'meetingsBooked', 'qualifiedLeads'
    ]
    const nullableFields = ['nps', 'customerServiceNps']

    let parsedValue
    if (nullableFields.includes(field)) {
      parsedValue = value !== null && value !== '' ? parseFloat(value) : null
    } else if (intFields.includes(field)) {
      parsedValue = parseInt(value) || 0
    } else {
      parsedValue = parseFloat(value) || 0
    }

    console.log(`Saving: dataset_id=${dataset.id}, month=${monthIndex + 1}, ${dbField}=${parsedValue}`)

    const { data, error, status, statusText } = await supabase
      .from('monthly_data')
      .upsert({
        dataset_id: dataset.id,
        month: monthIndex + 1,
        [dbField]: parsedValue,
      }, {
        onConflict: 'dataset_id,month',
      })
      .select()

    console.log(`Upsert response: status=${status}, statusText=${statusText}`)

    if (error) {
      console.error('Upsert error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn('Upsert returned no data - possible RLS policy block. Check user role.')
    } else {
      console.log('Upsert success:', data)
    }
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

// ============================================
// Customer Metrics Functions
// ============================================

// Create empty customer monthly data
function createEmptyCustomersData() {
  return MONTHS.map(month => ({
    month,
    smbAccounts: 0,
    enterpriseAccounts: 0,
    gailGptSeats: 0,
    smbRevenue: 0,
    enterpriseRevenueCustomers: 0,
    smbCalls: 0,
    enterpriseCalls: 0,
    smbTalkTime: 0,
    enterpriseTalkTime: 0,
    churned: 0,
    startOfPeriodAccounts: 0,
    enterpriseExpansion: 0,
  }))
}

// ============================================
// Customer Service Metrics Functions
// ============================================

// Create empty customer service monthly data
function createEmptyCustomerServiceData() {
  return MONTHS.map(month => ({
    month,
    ticketVolume: 0,
    resolutionTime: 0,
    customerServiceNps: 0,
    firstResponseTime: 0,
  }))
}

// Convert database row to customer service app format
function dbRowToCustomerServiceFormat(row) {
  return {
    month: MONTHS[row.month - 1],
    ticketVolume: row.ticket_volume || 0,
    resolutionTime: row.resolution_time || 0,
    customerServiceNps: row.customer_service_nps || 0,
    firstResponseTime: row.first_response_time || 0,
  }
}

// Fetch customer service monthly data for a dataset
async function fetchCustomerServiceData(year, scenario = 'customer_service') {
  try {
    console.log(`Fetching customer service data: year=${year}, scenario=${scenario}`)
    const dataset = await getOrCreateDataset(year, scenario)

    if (!dataset) {
      console.error('Failed to get/create dataset - returned null')
      return createEmptyCustomerServiceData()
    }

    console.log(`Got dataset: id=${dataset.id}`)

    const { data: rows, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('dataset_id', dataset.id)
      .order('month')

    if (error) {
      console.error('Error fetching monthly_data:', error)
      throw error
    }

    console.log(`Fetched ${rows?.length || 0} rows for customer service:`, rows)

    // Convert to app format, filling in missing months
    const monthlyData = createEmptyCustomerServiceData()
    rows.forEach(row => {
      const monthIndex = row.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = dbRowToCustomerServiceFormat(row)
      }
    })

    return monthlyData
  } catch (error) {
    console.error('Error fetching customer service data:', error)
    return null
  }
}

// ============================================
// Sales Metrics Functions
// ============================================

// Create empty sales monthly data
function createEmptySalesData() {
  return MONTHS.map(month => ({
    month,
    pipelineAdded: 0,
    totalPipeline: 0,
    dealsClosed: 0,
    revenueClosed: 0,
    winRate: 0,
    meetingsBooked: 0,
    qualifiedLeads: 0,
    avgDealSize: 0,
  }))
}

// Convert database row to sales app format
function dbRowToSalesFormat(row) {
  return {
    month: MONTHS[row.month - 1],
    pipelineAdded: row.pipeline_added || 0,
    totalPipeline: row.total_pipeline || 0,
    dealsClosed: row.deals_closed || 0,
    revenueClosed: row.revenue_closed || 0,
    winRate: row.win_rate || 0,
    meetingsBooked: row.meetings_booked || 0,
    qualifiedLeads: row.qualified_leads || 0,
    avgDealSize: row.avg_deal_size || 0,
  }
}

// Fetch sales monthly data for a dataset
async function fetchSalesData(year, scenario = 'sales') {
  try {
    const dataset = await getOrCreateDataset(year, scenario)

    const { data: rows, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('dataset_id', dataset.id)
      .order('month')

    if (error) throw error

    // Convert to app format, filling in missing months
    const monthlyData = createEmptySalesData()
    rows.forEach(row => {
      const monthIndex = row.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = dbRowToSalesFormat(row)
      }
    })

    return monthlyData
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return null
  }
}

// Convert database row to customer app format
function dbRowToCustomersFormat(row) {
  return {
    month: MONTHS[row.month - 1],
    smbAccounts: row.smb_accounts || 0,
    enterpriseAccounts: row.enterprise_accounts || 0,
    gailGptSeats: row.gailgpt_seats || 0,
    smbRevenue: row.smb_revenue || 0,
    enterpriseRevenueCustomers: row.enterprise_revenue_customers || 0,
    smbCalls: row.smb_calls || 0,
    enterpriseCalls: row.enterprise_calls || 0,
    smbTalkTime: row.smb_talk_time || 0,
    enterpriseTalkTime: row.enterprise_talk_time || 0,
    churned: row.churned || 0,
    startOfPeriodAccounts: row.start_of_period_accounts || 0,
    enterpriseExpansion: row.enterprise_expansion || 0,
  }
}

// Fetch customer monthly data for a dataset
async function fetchCustomersData(year, scenario = 'customers') {
  try {
    const dataset = await getOrCreateDataset(year, scenario)

    const { data: rows, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('dataset_id', dataset.id)
      .order('month')

    if (error) throw error

    // Convert to app format, filling in missing months
    const monthlyData = createEmptyCustomersData()
    rows.forEach(row => {
      const monthIndex = row.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = dbRowToCustomersFormat(row)
      }
    })

    return monthlyData
  } catch (error) {
    console.error('Error fetching customers data:', error)
    return null
  }
}

export {
  fetchMonthlyData,
  saveMonthlyData,
  updateMonthData,
  migrateFromLocalStorage,
  hasLocalData,
  createEmptyMonthlyData,
  // Customer exports
  createEmptyCustomersData,
  fetchCustomersData,
  // Customer service exports
  createEmptyCustomerServiceData,
  fetchCustomerServiceData,
  // Sales exports
  createEmptySalesData,
  fetchSalesData,
}
