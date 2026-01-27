import { supabase } from '../lib/supabase';

/**
 * Get the start date for a given period type
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {Date} [date] - Optional date to calculate from (defaults to now)
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function getPeriodStart(periodType, date = new Date()) {
  const d = new Date(date);

  switch (periodType) {
    case 'week': {
      // Start of week (Sunday)
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      break;
    }
    case 'month': {
      // Start of month
      d.setDate(1);
      break;
    }
    case 'quarter': {
      // Start of quarter
      const quarter = Math.floor(d.getMonth() / 3);
      d.setMonth(quarter * 3);
      d.setDate(1);
      break;
    }
    case 'year': {
      // Start of year
      d.setMonth(0);
      d.setDate(1);
      break;
    }
    default:
      d.setDate(1); // Default to start of month
  }

  return d.toISOString().split('T')[0];
}

/**
 * Get the label for a period (for display in charts)
 * @param {string} periodStart - ISO date string
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @returns {string} Human-readable label
 */
export function getPeriodLabel(periodStart, periodType) {
  const date = new Date(periodStart);

  switch (periodType) {
    case 'week': {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    }
    case 'month': {
      return date.toLocaleString('en-US', { month: 'short' });
    }
    case 'quarter': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter}`;
    }
    case 'year': {
      return date.getFullYear().toString();
    }
    default:
      return periodStart;
  }
}

/**
 * Fetch metrics for a specific tab and period
 * @param {string} tabName - Tab identifier (e.g., 'customers', 'finance')
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {string} periodStart - ISO date string
 * @returns {Promise<object|null>} Metrics data or null if not found
 */
export async function fetchMetrics(tabName, periodType, periodStart) {
  const { data, error } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('tab_name', tabName)
    .eq('period_type', periodType)
    .eq('period_start', periodStart)
    .single();

  if (error) {
    // PGRST116 means no rows returned - that's OK for new periods
    if (error.code !== 'PGRST116') {
      console.error('Error fetching metrics:', error);
    }
    return null;
  }
  return data;
}

/**
 * Save metrics for a specific tab and period (upsert)
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {string} periodStart - ISO date string
 * @param {object} metrics - Metrics data to save
 * @param {object} goals - Goals data to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveMetrics(tabName, periodType, periodStart, metrics, goals) {
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    console.error('Error saving metrics: Not authenticated', authError);
    return false;
  }

  console.log('Saving metrics:', { tabName, periodType, periodStart, metrics, userId: userData.user.id });

  const { data, error } = await supabase
    .from('operational_metrics')
    .upsert({
      tab_name: tabName,
      period_type: periodType,
      period_start: periodStart,
      metrics: metrics || {},
      goals: goals || {},
      updated_by: userData.user.id
    }, {
      onConflict: 'tab_name,period_type,period_start'
    })
    .select();

  if (error) {
    console.error('Error saving metrics:', error.message, error.code, error.details);
    // Check for RLS policy error
    if (error.code === '42501' || error.message?.includes('policy')) {
      console.error('RLS Policy Error: User may not have admin/editor role. Check profiles table.');
    }
    return false;
  }

  console.log('Metrics saved successfully:', data);
  return true;
}

/**
 * Fetch historical data for charts (multiple periods)
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {number} [count=12] - Number of periods to fetch
 * @returns {Promise<Array>} Array of metrics records, oldest first
 */
export async function fetchHistory(tabName, periodType, count = 12) {
  const { data, error } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('tab_name', tabName)
    .eq('period_type', periodType)
    .order('period_start', { ascending: false })
    .limit(count);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  // Return in chronological order (oldest first) for charts
  return (data || []).reverse();
}

/**
 * Delete metrics for a specific period (admin only)
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {string} periodStart - ISO date string
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMetrics(tabName, periodType, periodStart) {
  const { error } = await supabase
    .from('operational_metrics')
    .delete()
    .eq('tab_name', tabName)
    .eq('period_type', periodType)
    .eq('period_start', periodStart);

  if (error) {
    console.error('Error deleting metrics:', error);
    return false;
  }
  return true;
}

/**
 * Get all periods with data for a tab (for historical navigation)
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @returns {Promise<Array>} Array of period_start dates
 */
export async function getAvailablePeriods(tabName, periodType) {
  const { data, error } = await supabase
    .from('operational_metrics')
    .select('period_start')
    .eq('tab_name', tabName)
    .eq('period_type', periodType)
    .order('period_start', { ascending: false });

  if (error) {
    console.error('Error fetching available periods:', error);
    return [];
  }

  return (data || []).map(d => d.period_start);
}

/**
 * Fetch all historical data for a tab (unlimited, for data table)
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @returns {Promise<Array>} Array of all metrics records, oldest first
 */
export async function fetchAllHistory(tabName, periodType) {
  const { data, error } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('tab_name', tabName)
    .eq('period_type', periodType)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('Error fetching all history:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a single metric value for a specific period
 * @param {string} tabName - Tab identifier
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {string} periodStart - ISO date string
 * @param {string} metricId - ID of the metric to update
 * @param {any} value - New value for the metric
 * @returns {Promise<boolean>} Success status
 */
export async function updateCellMetric(tabName, periodType, periodStart, metricId, value) {
  console.log('updateCellMetric called:', { tabName, periodType, periodStart, metricId, value });

  // First fetch existing data
  const existing = await fetchMetrics(tabName, periodType, periodStart);
  console.log('Existing data:', existing);

  // Merge the new value
  const updatedMetrics = {
    ...(existing?.metrics || {}),
    [metricId]: value,
  };

  console.log('Updated metrics to save:', updatedMetrics);

  // Save the merged data
  const result = await saveMetrics(tabName, periodType, periodStart, updatedMetrics, existing?.goals || {});
  console.log('Save result:', result);

  return result;
}
