import { useState, useEffect, useCallback } from 'react';
import {
  fetchMetrics,
  saveMetrics,
  fetchHistory,
  fetchAllHistory,
  updateCellMetric,
  getPeriodStart,
  getPeriodLabel,
  getAvailablePeriods
} from '../services/operationalMetricsService';
import { useAuthContext } from '../components/auth/AuthProvider';

/**
 * Hook for managing operational metrics data with Supabase persistence
 * @param {string} tabName - Tab identifier (e.g., 'customers', 'finance')
 * @param {string} periodType - 'week', 'month', 'quarter', 'year'
 * @param {object} defaultMetrics - Default metrics structure for new periods
 * @param {object} defaultGoals - Default goals structure for new periods
 * @param {string} periodStartOverride - Optional period start to use instead of calculated one (for week navigation)
 */
export function useOperationalMetrics(tabName, periodType, defaultMetrics = {}, defaultGoals = {}, periodStartOverride = undefined) {
  const { isAuthenticated } = useAuthContext();

  // Current period start (can be overridden for historical entry or week navigation)
  const [selectedPeriodStart, setSelectedPeriodStart] = useState(() => periodStartOverride || getPeriodStart(periodType));

  // Data state
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [goals, setGoals] = useState(defaultGoals);
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]); // All historical data for data table
  const [availablePeriods, setAvailablePeriods] = useState([]);

  // Loading/saving state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Track if data has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Update period start when period type changes or when override changes
  useEffect(() => {
    if (periodStartOverride !== undefined) {
      setSelectedPeriodStart(periodStartOverride);
    } else {
      setSelectedPeriodStart(getPeriodStart(periodType));
    }
  }, [periodType, periodStartOverride]);

  // Load data when authenticated and period changes
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    loadData();
  }, [isAuthenticated, tabName, periodType, selectedPeriodStart]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current period data
      const data = await fetchMetrics(tabName, periodType, selectedPeriodStart);

      if (data) {
        setMetrics(data.metrics || defaultMetrics);
        setGoals(data.goals || defaultGoals);
      } else {
        // No data for this period - use defaults
        setMetrics(defaultMetrics);
        setGoals(defaultGoals);
      }

      // Fetch history for charts (limited to recent periods)
      const historyData = await fetchHistory(tabName, periodType);
      setHistory(historyData.map(h => ({
        ...h.metrics,
        period: getPeriodLabel(h.period_start, periodType),
        periodStart: h.period_start,
      })));

      // Fetch all history for data table (unlimited)
      const allHistoryData = await fetchAllHistory(tabName, periodType);
      setAllHistory(allHistoryData.map(h => ({
        ...h.metrics,
        period: getPeriodLabel(h.period_start, periodType),
        periodStart: h.period_start,
        goals: h.goals,
      })));

      // Fetch available periods for navigation
      const periods = await getAvailablePeriods(tabName, periodType);
      setAvailablePeriods(periods);

      setIsDirty(false);
    } catch (err) {
      console.error('Error loading operational metrics:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tabName, periodType, selectedPeriodStart, defaultMetrics, defaultGoals]);

  // Save current data
  const save = useCallback(async (newMetrics, newGoals) => {
    setSaving(true);
    setError(null);

    const metricsToSave = newMetrics !== undefined ? newMetrics : metrics;
    const goalsToSave = newGoals !== undefined ? newGoals : goals;

    try {
      const success = await saveMetrics(
        tabName,
        periodType,
        selectedPeriodStart,
        metricsToSave,
        goalsToSave
      );

      if (success) {
        setMetrics(metricsToSave);
        setGoals(goalsToSave);
        setIsDirty(false);

        // Refresh history after save
        const historyData = await fetchHistory(tabName, periodType);
        setHistory(historyData.map(h => ({
          ...h.metrics,
          period: getPeriodLabel(h.period_start, periodType),
          periodStart: h.period_start,
        })));

        // Refresh all history for data table
        const allHistoryData = await fetchAllHistory(tabName, periodType);
        setAllHistory(allHistoryData.map(h => ({
          ...h.metrics,
          period: getPeriodLabel(h.period_start, periodType),
          periodStart: h.period_start,
          goals: h.goals,
        })));

        // Update available periods
        const periods = await getAvailablePeriods(tabName, periodType);
        setAvailablePeriods(periods);

        return true;
      } else {
        setError('Failed to save data');
        return false;
      }
    } catch (err) {
      console.error('Error saving operational metrics:', err);
      setError('Failed to save data');
      return false;
    } finally {
      setSaving(false);
    }
  }, [tabName, periodType, selectedPeriodStart, metrics, goals]);

  // Update a single metric value (optimistic update)
  const updateMetric = useCallback((key, value) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Update a single goal value (optimistic update)
  const updateGoal = useCallback((key, value) => {
    setGoals(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Batch update metrics
  const updateMetrics = useCallback((updates) => {
    setMetrics(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Batch update goals
  const updateGoals = useCallback((updates) => {
    setGoals(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Navigate to a different period
  const goToPeriod = useCallback((periodStart) => {
    setSelectedPeriodStart(periodStart);
  }, []);

  // Navigate to current period
  const goToCurrentPeriod = useCallback(() => {
    setSelectedPeriodStart(getPeriodStart(periodType));
  }, [periodType]);

  // Check if viewing current period
  const isCurrentPeriod = selectedPeriodStart === getPeriodStart(periodType);

  // Save a single cell value (for data table inline editing)
  const saveCell = useCallback(async (periodStart, metricId, value) => {
    try {
      const success = await updateCellMetric(tabName, periodType, periodStart, metricId, value);

      if (success) {
        // Update local state optimistically
        setAllHistory(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(h => h.periodStart === periodStart);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], [metricId]: value };
          } else {
            // New period - add it
            updated.push({
              periodStart,
              period: getPeriodLabel(periodStart, periodType),
              [metricId]: value,
            });
            // Sort by date
            updated.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
          }
          return updated;
        });

        // Also update history if within range
        setHistory(prev => {
          const idx = prev.findIndex(h => h.periodStart === periodStart);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [metricId]: value };
            return updated;
          }
          return prev;
        });

        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving cell:', err);
      return false;
    }
  }, [tabName, periodType]);

  // Bulk import from CSV
  const importData = useCallback(async (rows) => {
    try {
      for (const row of rows) {
        const { periodStart, period, ...metricsData } = row;
        if (!periodStart) continue;

        await saveMetrics(tabName, periodType, periodStart, metricsData, goals);
      }

      // Reload all data after import
      await loadData();
      return true;
    } catch (err) {
      console.error('Error importing data:', err);
      return false;
    }
  }, [tabName, periodType, goals, loadData]);

  return {
    // Data
    metrics,
    goals,
    history,
    allHistory,  // All historical data for data table
    availablePeriods,

    // State
    loading,
    saving,
    error,
    isDirty,
    isCurrentPeriod,
    selectedPeriodStart,

    // Actions
    save,
    reload: loadData,
    updateMetric,
    updateGoal,
    updateMetrics,
    updateGoals,
    goToPeriod,
    goToCurrentPeriod,
    setSelectedPeriodStart,
    saveCell,      // Save single cell (for data table)
    importData,    // Bulk import from CSV
  };
}
