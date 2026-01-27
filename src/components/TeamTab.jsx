import { useState, useEffect } from 'react';
import { useRole } from '../hooks/useRole';
import { useOperationalMetrics } from '../hooks/useOperationalMetrics';
import MetricsDataTable from './shared/MetricsDataTable';
import WeekNavigator, { getCurrentWeekStart } from './shared/WeekNavigator';
import { Users, UserPlus, UserMinus, Clock, TrendingUp, TrendingDown, Target, Calendar, Loader2 } from 'lucide-react';

const styles = {
  container: { padding: '24px 32px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#64748B' },
  periodSelector: { display: 'flex', gap: '8px', marginBottom: '24px' },
  periodButton: {
    padding: '8px 16px', fontSize: '13px', fontWeight: 500,
    border: '1px solid #E2E8F0', borderRadius: '6px',
    backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer',
  },
  periodButtonActive: { backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: '#1E293B' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' },
  metricCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  metricTitle: { fontSize: '13px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: '28px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' },
  metricGoal: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' },
  goalProgress: { display: 'flex', alignItems: 'center', gap: '4px' },
  progressBar: { width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s' },
  inputSection: { backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', marginTop: '24px' },
  inputTitle: { fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '12px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase' },
  input: { padding: '10px 12px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none' },
  saveButton: { marginTop: '16px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, backgroundColor: '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  saveButtonDisabled: { backgroundColor: '#94A3B8', cursor: 'not-allowed' },
  saveButtonSaving: { backgroundColor: '#3B82F6' },
  periodHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  datePickerGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  dateInput: { padding: '8px 12px', fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none' },
  currentPeriodButton: { padding: '8px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' },
  loadingOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748B' },
  dirtyIndicator: { fontSize: '12px', color: '#F59E0B', marginLeft: '8px' },
};

// Default metrics structure
const defaultMetrics = {
  headcount: 0,
  openRoles: 0,
  attritionRate: 0,
  timeToHire: 0,
};

// Default goals
const defaultGoals = {
  headcount: 25,
  openRoles: 5,
  attritionRate: 10,
  timeToHire: 30,
};

export default function TeamTab() {
  const { canEdit } = useRole();
  const [period, setPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getCurrentWeekStart());

  // Use the persistence hook - pass selected week when period is 'week'
  const {
    metrics: dbMetrics,
    goals: dbGoals,
    allHistory,
    loading,
    saving,
    isDirty,
    isCurrentPeriod,
    selectedPeriodStart,
    save,
    updateMetric,
    updateGoal,
    goToCurrentPeriod,
    setSelectedPeriodStart,
    saveCell,
    importData,
  } = useOperationalMetrics(
    'team',
    period,
    defaultMetrics,
    defaultGoals,
    period === 'week' ? selectedWeekStart : undefined
  );

  // Local state for form editing
  const [localMetrics, setLocalMetrics] = useState(defaultMetrics);
  const [localGoals, setLocalGoals] = useState(defaultGoals);

  // Sync local state with hook data when it loads
  useEffect(() => {
    if (dbMetrics && Object.keys(dbMetrics).length > 0) {
      setLocalMetrics(dbMetrics);
    }
    if (dbGoals && Object.keys(dbGoals).length > 0) {
      setLocalGoals(dbGoals);
    }
  }, [dbMetrics, dbGoals]);

  // Define columns for the data table
  const dataTableColumns = [
    { id: 'periodStart', label: 'Period', editable: false },
    { id: 'headcount', label: 'Headcount', editable: true },
    { id: 'openRoles', label: 'Open Roles', editable: true },
    { id: 'attritionRate', label: 'Attrition %', editable: true, format: (v) => `${(v || 0).toFixed(1)}%` },
    { id: 'timeToHire', label: 'Time to Hire', editable: true, format: (v) => `${v || 0} days` },
  ];

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  const metricConfigs = [
    { id: 'headcount', title: 'Headcount', color: '#3B82F6', bgColor: '#DBEAFE', icon: Users, format: (v) => v, unit: '', isLowerBetter: false },
    { id: 'openRoles', title: 'Open Roles', color: '#8B5CF6', bgColor: '#EDE9FE', icon: UserPlus, format: (v) => v, unit: '', isLowerBetter: true },
    { id: 'attritionRate', title: 'Attrition Rate', color: '#EF4444', bgColor: '#FEE2E2', icon: UserMinus, format: (v) => `${(v || 0).toFixed(1)}%`, unit: '', isLowerBetter: true },
    { id: 'timeToHire', title: 'Time to Hire', color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock, format: (v) => v, unit: ' days', isLowerBetter: true },
  ];

  const handleValueChange = (metricId, value) => {
    const numValue = parseFloat(value) || 0;
    setLocalMetrics(prev => ({ ...prev, [metricId]: numValue }));
    updateMetric(metricId, numValue);
  };

  const handleGoalChange = (metricId, value) => {
    const numValue = parseFloat(value) || 0;
    setLocalGoals(prev => ({ ...prev, [metricId]: numValue }));
    updateGoal(metricId, numValue);
  };

  const handleSave = async () => {
    await save(localMetrics, localGoals);
  };

  const getProgressPercent = (value, goal, isLowerBetter) => {
    if (!goal) return 0;
    if (isLowerBetter) return Math.min((goal / Math.max(value, 0.1)) * 100, 100);
    return Math.min((value / goal) * 100, 100);
  };

  const getProgressColor = (value, goal, isLowerBetter) => {
    const percent = isLowerBetter ? (goal / Math.max(value, 0.1)) * 100 : (value / goal) * 100;
    if (percent >= 100) return '#10B981';
    if (percent >= 70) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingOverlay}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '8px' }}>Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Week Navigation and Period Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        {/* Week Navigation (only shown when period is 'week') */}
        {period === 'week' && (
          <WeekNavigator
            selectedWeekStart={selectedWeekStart}
            onWeekChange={setSelectedWeekStart}
          />
        )}

        {/* Period Selector */}
        <div style={{ ...styles.periodSelector, marginBottom: 0 }}>
          {periods.map(p => (
            <button key={p.id} style={{ ...styles.periodButton, ...(period === p.id ? styles.periodButtonActive : {}) }} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.metricsGrid}>
        {metricConfigs.map(config => {
          const value = localMetrics[config.id] || 0;
          const goal = localGoals[config.id] || defaultGoals[config.id];
          const progress = getProgressPercent(value, goal, config.isLowerBetter);
          const progressColor = getProgressColor(value, goal, config.isLowerBetter);
          const IconComponent = config.icon;

          return (
            <div key={config.id} style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>{config.title}</span>
                <div style={{ ...styles.metricIcon, backgroundColor: config.bgColor }}>
                  <IconComponent size={18} color={config.color} />
                </div>
              </div>
              <div style={{ ...styles.metricValue, color: config.color }}>{config.format(value)}{config.unit}</div>
              <div style={styles.metricGoal}>
                <Target size={14} />
                <span>Goal: {config.isLowerBetter ? '≤' : '≥'} {config.format(goal)}{config.unit}</span>
                <span style={styles.goalProgress}>
                  {progress >= 100 ? <TrendingUp size={14} color="#10B981" /> : <TrendingDown size={14} color="#EF4444" />}
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: progressColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div style={styles.inputSection}>
          <div style={styles.periodHeader}>
            <h3 style={styles.inputTitle}>
              Update Metrics
              {isDirty && <span style={styles.dirtyIndicator}>• Unsaved changes</span>}
            </h3>
            <div style={styles.datePickerGroup}>
              <Calendar size={16} color="#64748B" />
              <input
                type="date"
                style={styles.dateInput}
                value={selectedPeriodStart}
                onChange={(e) => setSelectedPeriodStart(e.target.value)}
              />
              {!isCurrentPeriod && (
                <button style={styles.currentPeriodButton} onClick={goToCurrentPeriod}>
                  Current Period
                </button>
              )}
            </div>
          </div>
          <div style={styles.inputGrid}>
            {metricConfigs.map(config => (
              <div key={config.id} style={styles.inputGroup}>
                <label style={styles.inputLabel}>{config.title} (Actual)</label>
                <input type="number" style={styles.input} value={localMetrics[config.id] || ''} onChange={(e) => handleValueChange(config.id, e.target.value)} placeholder="Enter value" />
              </div>
            ))}
          </div>
          <div style={{ ...styles.inputGrid, marginTop: '16px' }}>
            {metricConfigs.map(config => (
              <div key={`${config.id}-goal`} style={styles.inputGroup}>
                <label style={styles.inputLabel}>{config.title} (Goal)</label>
                <input type="number" style={styles.input} value={localGoals[config.id] || ''} onChange={(e) => handleGoalChange(config.id, e.target.value)} placeholder="Enter goal" />
              </div>
            ))}
          </div>
          <button
            style={{
              ...styles.saveButton,
              ...(saving ? styles.saveButtonSaving : {}),
              ...(!isDirty && !saving ? styles.saveButtonDisabled : {}),
            }}
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      )}

      {/* Historical Data Table */}
      <MetricsDataTable
        data={allHistory}
        columns={dataTableColumns}
        onSave={saveCell}
        onImport={importData}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        canEdit={canEdit}
        tabName="team"
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
