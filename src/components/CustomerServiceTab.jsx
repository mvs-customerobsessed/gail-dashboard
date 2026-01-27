import { useState, useMemo } from 'react';
import { useRole } from '../hooks/useRole';
import { useWBRData } from '../hooks/useWBRData';
import ViewToggle from './shared/ViewToggle';
import WeekNavigator, { getCurrentWeekStart } from './shared/WeekNavigator';
import { MessageSquare, Clock, ThumbsUp, Loader2, Pencil, Settings2 } from 'lucide-react';
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const styles = {
  container: { padding: '24px 32px' },

  // Header with view toggle and edit button
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  headerLeft: {},
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#64748B',
    transition: 'all 0.2s',
  },

  // Period selector
  periodSelector: { display: 'flex', gap: '8px', marginBottom: '24px' },
  periodButton: {
    padding: '8px 16px', fontSize: '13px', fontWeight: 500,
    border: '1px solid #E2E8F0', borderRadius: '6px',
    backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer',
  },
  periodButtonActive: { backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: '#1E293B' },

  // Data Input Panel (matching CustomersTab)
  dataInputPanel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
  },
  dataInputHeader: {
    marginBottom: '24px',
  },
  dataInputTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '8px',
  },
  dataInputSubtitle: {
    fontSize: '14px',
    color: '#64748B',
  },
  gridTableWrapper: {
    overflowX: 'auto',
    marginTop: '24px',
  },
  gridTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    minWidth: '800px',
  },
  gridHeaderMetric: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#0F172A',
    color: 'white',
    fontWeight: 600,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    position: 'sticky',
    left: 0,
    zIndex: 2,
    minWidth: '160px',
  },
  gridHeaderMonth: {
    textAlign: 'center',
    padding: '12px 4px',
    backgroundColor: '#0F172A',
    color: 'white',
    fontWeight: 600,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    minWidth: '65px',
  },
  gridHeaderAction: {
    padding: '12px 8px',
    backgroundColor: '#0F172A',
    width: '40px',
  },
  gridRowEven: {
    backgroundColor: '#FAFAFA',
  },
  gridRowOdd: {
    backgroundColor: 'white',
  },
  gridMetricCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #E2E8F0',
    fontWeight: 500,
    color: '#0F172A',
    position: 'sticky',
    left: 0,
    backgroundColor: 'inherit',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  metricLabel: {
    flex: 1,
    fontSize: '13px',
  },
  rowPasteStatus: {
    fontSize: '11px',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 500,
  },
  gridInputCell: {
    padding: '4px 2px',
    borderBottom: '1px solid #E2E8F0',
    textAlign: 'center',
  },
  gridInput: {
    width: '100%',
    padding: '6px 4px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#0F172A',
    backgroundColor: 'white',
    textAlign: 'right',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  gridActionCell: {
    padding: '6px 8px',
    borderBottom: '1px solid #E2E8F0',
    textAlign: 'center',
  },
  clearRowButton: {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  dataInputFooter: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #E2E8F0',
  },
  dataInputNote: {
    fontSize: '13px',
    color: '#64748B',
  },
  noteSeparator: {
    margin: '0 8px',
    color: '#CBD5E1',
  },

  // Mode Toggle (Actuals vs Goals)
  modeToggle: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    padding: '4px',
  },
  modeButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
  },
  modeButtonActiveGoals: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
  },

  // Main content layout
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '24px',
  },

  // Charts section - 3 columns
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  chartTitle: { fontSize: '13px', fontWeight: 600, color: '#1E293B' },
  chartHeaderRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  chartTypeSelector: { position: 'relative' },
  chartTypeButton: {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
    fontSize: '10px', fontWeight: 500, color: '#64748B', backgroundColor: '#F1F5F9',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
  },
  chartContainer: { height: '200px' },
  tooltip: { backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  legend: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748B' },
  legendDot: { width: '6px', height: '6px', borderRadius: '50%' },
  settingsButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '24px', height: '24px', padding: 0,
    backgroundColor: 'transparent', border: 'none', borderRadius: '4px',
    cursor: 'pointer', color: '#94A3B8', transition: 'all 0.2s',
  },
  settingsButtonActive: { backgroundColor: '#F1F5F9', color: '#64748B' },
  settingsPopover: {
    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
    backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, padding: '12px', minWidth: '180px',
  },
  settingsSection: { marginBottom: '12px' },
  settingsSectionLast: { marginBottom: 0 },
  settingsLabel: { fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  settingsColorGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  settingsTypeGrid: { display: 'flex', flexDirection: 'column', gap: '4px' },
  settingsTypeOption: {
    padding: '8px 10px', fontSize: '12px', color: '#1E293B', cursor: 'pointer',
    borderRadius: '4px', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '8px',
  },
  settingsTypeOptionActive: { backgroundColor: '#F1F5F9', fontWeight: 500 },
  colorSwatch: {
    width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', border: '2px solid transparent',
  },
  colorSwatchSelected: { border: '2px solid #1E293B' },
  colorPicker: {
    position: 'absolute', top: '110%', right: 'auto', left: 0,
    backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '8px',
    display: 'flex', flexWrap: 'wrap', gap: '6px', width: '140px',
  },

  // Summary cards (horizontal row below charts) - 3 cards
  summaryCardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
  },
  summaryCardDark: {
    backgroundColor: '#1E293B',
    border: 'none',
  },
  summaryCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  summaryCardTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryCardTitleLight: {
    color: 'rgba(255,255,255,0.7)',
  },
  summaryCardIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '4px',
  },
  summaryCardValueLight: {
    color: '#FFFFFF',
  },
  summaryCardSubtext: {
    fontSize: '12px',
    color: '#64748B',
  },
  summaryCardSubtextLight: {
    color: 'rgba(255,255,255,0.6)',
  },
  summaryCardGoal: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748B',
    marginTop: '8px',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '2px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s',
  },
  breakdown: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '2px',
  },
  breakdownValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#FFFFFF',
  },

  // Loading state
  loadingOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748B' },
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value?.toLocaleString() || '0';
};

// Chart type options
const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
];

// Color palette options
const COLOR_PALETTE = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  '#06B6D4', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7',
];

// Default chart configurations
const defaultChartConfig = {
  ticketVolume: { type: 'bar', colors: ['#3B82F6'] },
  resolutionTime: { type: 'area', colors: ['#F59E0B'] },
  nps: { type: 'bar', colors: ['#10B981'] },
};

// Chart settings button component
function ChartSettingsButton({ chartId, config, onConfigChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState(null);

  const handleTypeChange = (type) => {
    onConfigChange(chartId, { ...config, type });
  };

  const handleColorChange = (index, color) => {
    const newColors = [...config.colors];
    newColors[index] = color;
    onConfigChange(chartId, { ...config, colors: newColors });
    setEditingColorIndex(null);
  };

  return (
    <div style={styles.chartTypeSelector}>
      <button
        style={{ ...styles.settingsButton, ...(isOpen ? styles.settingsButtonActive : {}) }}
        onClick={() => setIsOpen(!isOpen)}
        title="Chart settings"
      >
        <Settings2 size={14} />
      </button>
      {isOpen && (
        <div style={styles.settingsPopover}>
          <div style={styles.settingsSection}>
            <div style={styles.settingsLabel}>Chart Type</div>
            <div style={styles.settingsTypeGrid}>
              {CHART_TYPES.map(type => (
                <div
                  key={type.id}
                  style={{
                    ...styles.settingsTypeOption,
                    ...(config.type === type.id ? styles.settingsTypeOptionActive : {}),
                  }}
                  onClick={() => handleTypeChange(type.id)}
                  onMouseEnter={(e) => { if (config.type !== type.id) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (config.type !== type.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {config.type === type.id && <span style={{ color: '#3B82F6' }}>•</span>}
                  {type.label}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.settingsSectionLast}>
            <div style={styles.settingsLabel}>Colors</div>
            <div style={styles.settingsColorGrid}>
              {config.colors.map((color, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: color,
                      ...(editingColorIndex === idx ? styles.colorSwatchSelected : {}),
                    }}
                    onClick={() => setEditingColorIndex(editingColorIndex === idx ? null : idx)}
                  />
                  {editingColorIndex === idx && (
                    <div style={styles.colorPicker}>
                      {COLOR_PALETTE.map(c => (
                        <div
                          key={c}
                          style={{ ...styles.colorSwatch, backgroundColor: c, ...(c === color ? styles.colorSwatchSelected : {}) }}
                          onClick={() => handleColorChange(idx, c)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Data Input Panel Component
function DataInputPanel({
  customerServiceData2025,
  customerServiceData,
  updateCustomerServiceMonth2025,
  updateCustomerServiceMonth,
  goalsData,
  updateGoalsMonth
}) {
  const [pasteStatus, setPasteStatus] = useState({});
  const [dataMode, setDataMode] = useState('actuals');
  const [dataYear, setDataYear] = useState(2026);

  const parseExcelRow = (text) => {
    const cleaned = text.replace(/[$%,]/g, '').trim();
    const values = cleaned.split(/\t|,\s*|\s{2,}/).map(v => {
      const num = parseFloat(v.trim());
      return isNaN(num) ? null : num;
    });
    return values;
  };

  const getUpdateFn = () => {
    if (dataMode === 'goals') return updateGoalsMonth;
    return dataYear === 2025 ? updateCustomerServiceMonth2025 : updateCustomerServiceMonth;
  };

  const handleCellPaste = (e, field, startIndex) => {
    const pastedText = e.clipboardData.getData('text');
    const values = parseExcelRow(pastedText);
    const updateFn = getUpdateFn();

    if (values.length > 1) {
      e.preventDefault();
      values.forEach((val, i) => {
        const targetIndex = startIndex + i;
        if (val !== null && targetIndex < 12) {
          updateFn(targetIndex, field, val);
        }
      });
      setPasteStatus({ [field]: { success: true, count: Math.min(values.length, 12 - startIndex) } });
      setTimeout(() => setPasteStatus({}), 2000);
    }
  };

  const handleClearRow = (field) => {
    const updateFn = getUpdateFn();
    MONTHS.forEach((_, index) => {
      updateFn(index, field, 0);
    });
  };

  const metrics = [
    { key: 'ticketVolume', label: 'Ticket Volume', format: 'number' },
    { key: 'resolutionTime', label: 'Avg Resolution Time (hrs)', format: 'number' },
    { key: 'customerServiceNps', label: 'NPS Score', format: 'number' },
    { key: 'firstResponseTime', label: 'First Response Time (hrs)', format: 'number' },
  ];

  const getCurrentData = () => {
    if (dataMode === 'goals') return goalsData;
    return dataYear === 2025 ? customerServiceData2025 : customerServiceData;
  };
  const currentData = getCurrentData();

  return (
    <div style={styles.dataInputPanel}>
      <div style={styles.dataInputHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.dataInputTitle}>Customer Service Data Input - {dataYear}</h2>
            <p style={styles.dataInputSubtitle}>
              {dataMode === 'actuals'
                ? 'Enter actual values. Data saves automatically as you type.'
                : 'Enter monthly goals/forecasts. These will show as a line on charts.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={styles.modeToggle}>
              <button
                style={{
                  ...styles.modeButton,
                  ...(dataYear === 2025 ? styles.modeButtonActive : {}),
                }}
                onClick={() => setDataYear(2025)}
              >
                2025
              </button>
              <button
                style={{
                  ...styles.modeButton,
                  ...(dataYear === 2026 ? styles.modeButtonActive : {}),
                }}
                onClick={() => setDataYear(2026)}
              >
                2026
              </button>
            </div>
            {dataYear === 2026 && (
              <div style={styles.modeToggle}>
                <button
                  style={{
                    ...styles.modeButton,
                    ...(dataMode === 'actuals' ? styles.modeButtonActive : {}),
                  }}
                  onClick={() => setDataMode('actuals')}
                >
                  Actuals
                </button>
                <button
                  style={{
                    ...styles.modeButton,
                    ...(dataMode === 'goals' ? styles.modeButtonActiveGoals : {}),
                  }}
                  onClick={() => setDataMode('goals')}
                >
                  Goals
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.gridTableWrapper}>
        <table style={styles.gridTable}>
          <thead>
            <tr>
              <th style={{
                ...styles.gridHeaderMetric,
                backgroundColor: dataMode === 'goals' ? '#F59E0B' : '#0F172A',
              }}>Metric</th>
              {MONTHS.map(month => (
                <th key={month} style={{
                  ...styles.gridHeaderMonth,
                  backgroundColor: dataMode === 'goals' ? '#F59E0B' : '#0F172A',
                }}>{month}</th>
              ))}
              <th style={{
                ...styles.gridHeaderAction,
                backgroundColor: dataMode === 'goals' ? '#F59E0B' : '#0F172A',
              }}></th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, rowIndex) => (
              <tr key={metric.key} style={rowIndex % 2 === 0 ? styles.gridRowEven : styles.gridRowOdd}>
                <td style={styles.gridMetricCell}>
                  <span style={styles.metricLabel}>{metric.label}</span>
                  {pasteStatus[metric.key] && (
                    <span style={styles.rowPasteStatus}>
                      {pasteStatus[metric.key].count} values
                    </span>
                  )}
                </td>
                {MONTHS.map((month, monthIndex) => {
                  const rawValue = currentData[monthIndex]?.[metric.key];
                  const displayValue = (rawValue !== null && rawValue !== undefined && rawValue !== '' && rawValue !== 0)
                    ? Number(rawValue).toLocaleString('en-US')
                    : '';

                  return (
                    <td key={month} style={styles.gridInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        style={{
                          ...styles.gridInput,
                          ...(dataMode === 'goals' ? { borderColor: '#FDE68A' } : {}),
                        }}
                        value={displayValue}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9.-]/g, '');
                          const val = cleaned === '' ? 0 : cleaned;
                          const updateFn = getUpdateFn();
                          updateFn(monthIndex, metric.key, val);
                        }}
                        onPaste={(e) => handleCellPaste(e, metric.key, monthIndex)}
                        placeholder="0"
                      />
                    </td>
                  );
                })}
                <td style={styles.gridActionCell}>
                  <button
                    style={styles.clearRowButton}
                    onClick={() => handleClearRow(metric.key)}
                    title="Clear row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.dataInputFooter}>
        <p style={styles.dataInputNote}>
          <strong>Tip:</strong> Paste an Excel row into any cell - values fill across automatically.
          <span style={styles.noteSeparator}>|</span>
          {dataMode === 'actuals'
            ? 'Switch to Goals to enter monthly targets for comparison.'
            : 'Goals will appear as a line on charts, actuals as bars.'}
        </p>
      </div>
    </div>
  );
}

export default function CustomerServiceTab() {
  const { canEdit } = useRole();
  const [view, setView] = useState('charts');
  const [period, setPeriod] = useState('month');
  const [chartConfig, setChartConfig] = useState(defaultChartConfig);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getCurrentWeekStart());

  const handleChartConfigChange = (chartId, newConfig) => {
    setChartConfig(prev => ({ ...prev, [chartId]: newConfig }));
  };

  // Use the unified WBR data hook
  const {
    customerServiceData2025,
    customerServiceData,
    customerServiceGoalsData,
    updateCustomerServiceMonth2025,
    updateCustomerServiceMonth,
    updateCustomerServiceGoalsMonth,
    loading,
  } = useWBRData();

  // Get current month's data for summary metrics
  const currentMonth = new Date().getMonth();
  const currentMetrics = customerServiceData[currentMonth] || {};

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  // Build chart data with 6-month rolling window
  const historicalData = useMemo(() => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    const monthsToShow = [];
    for (let offset = -3; offset <= 2; offset++) {
      let monthIndex = currentMonthIndex + offset;
      let year = currentYear;

      if (monthIndex < 0) {
        monthIndex += 12;
        year -= 1;
      } else if (monthIndex > 11) {
        monthIndex -= 12;
        year += 1;
      }

      monthsToShow.push({ monthIndex, year });
    }

    return monthsToShow.map(({ monthIndex, year }) => {
      const sourceData = year === 2025 ? customerServiceData2025 : customerServiceData;
      const sourceGoals = year === 2026 ? customerServiceGoalsData : null;

      const actual = sourceData?.[monthIndex] || {};
      const goal = sourceGoals?.[monthIndex] || {};

      const monthAbbr = MONTHS[monthIndex];
      const yearShort = String(year).slice(-2);
      const periodLabel = `${monthAbbr}-${yearShort}`;

      return {
        period: periodLabel,
        ticketVolume: actual.ticketVolume || 0,
        resolutionTime: actual.resolutionTime || 0,
        nps: actual.customerServiceNps || 0,
        firstResponseTime: actual.firstResponseTime || 0,
        goalTicketVolume: goal.ticketVolume || null,
        goalResolutionTime: goal.resolutionTime || null,
        goalNps: goal.customerServiceNps || null,
        goalFirstResponseTime: goal.firstResponseTime || null,
      };
    });
  }, [customerServiceData, customerServiceData2025, customerServiceGoalsData]);

  // Check if we have any goals data
  const hasGoalsData = useMemo(() => {
    return customerServiceGoalsData.some(g =>
      g.ticketVolume > 0 || g.resolutionTime > 0 || g.customerServiceNps > 0 || g.firstResponseTime > 0
    );
  }, [customerServiceGoalsData]);

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
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div style={{ ...styles.headerLeft, display: 'flex', alignItems: 'center', gap: '24px' }}>
          {period === 'week' && (
            <WeekNavigator
              selectedWeekStart={selectedWeekStart}
              onWeekChange={setSelectedWeekStart}
            />
          )}

          <div style={{ ...styles.periodSelector, marginBottom: 0 }}>
            {periods.map(p => (
              <button
                key={p.id}
                style={{ ...styles.periodButton, ...(period === p.id ? styles.periodButtonActive : {}) }}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.headerRight}>
          <ViewToggle value={view} onChange={setView} />
          {canEdit && (
            <button
              style={styles.editButton}
              onClick={() => setView('data')}
              title="Edit data"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {view === 'charts' ? (
        <div style={styles.mainLayout}>
          {/* Charts Grid */}
          <div style={styles.chartsGrid}>
            {/* Ticket Volume Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Ticket Volume</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="ticketVolume" config={chartConfig.ticketVolume} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.ticketVolume.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Bar dataKey="ticketVolume" name="Tickets" fill={chartConfig.ticketVolume.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalTicketVolume" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.ticketVolume.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Line type="monotone" dataKey="ticketVolume" name="Tickets" stroke={chartConfig.ticketVolume.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalTicketVolume" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.ticketVolume.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.ticketVolume.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Area type="monotone" dataKey="ticketVolume" name="Tickets" fill="url(#ticketGradient)" stroke={chartConfig.ticketVolume.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalTicketVolume" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
              {hasGoalsData && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.ticketVolume.colors[0] }}></span> Actual</span>
                  <span style={styles.legendItem}><span style={{ width: '12px', height: '2px', borderTop: '2px dashed #F59E0B' }}></span> Goal</span>
                </div>
              )}
            </div>

            {/* Resolution Time Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Avg Resolution Time (hrs)</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="resolutionTime" config={chartConfig.resolutionTime} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.resolutionTime.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Bar dataKey="resolutionTime" name="Resolution Time" fill={chartConfig.resolutionTime.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalResolutionTime" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.resolutionTime.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Line type="monotone" dataKey="resolutionTime" name="Resolution Time" stroke={chartConfig.resolutionTime.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalResolutionTime" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="resolutionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.resolutionTime.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.resolutionTime.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Area type="monotone" dataKey="resolutionTime" name="Resolution Time" fill="url(#resolutionGradient)" stroke={chartConfig.resolutionTime.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalResolutionTime" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
              {hasGoalsData && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.resolutionTime.colors[0] }}></span> Actual</span>
                  <span style={styles.legendItem}><span style={{ width: '12px', height: '2px', borderTop: '2px dashed #F59E0B' }}></span> Goal</span>
                </div>
              )}
            </div>

            {/* NPS Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>NPS Score</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="nps" config={chartConfig.nps} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.nps.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Bar dataKey="nps" name="NPS" fill={chartConfig.nps.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalNps" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.nps.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Line type="monotone" dataKey="nps" name="NPS" stroke={chartConfig.nps.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalNps" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.nps.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.nps.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Area type="monotone" dataKey="nps" name="NPS" fill="url(#npsGradient)" stroke={chartConfig.nps.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalNps" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
              {hasGoalsData && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.nps.colors[0] }}></span> Actual</span>
                  <span style={styles.legendItem}><span style={{ width: '12px', height: '2px', borderTop: '2px dashed #F59E0B' }}></span> Goal</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div style={styles.summaryCardsContainer}>
            {/* Ticket Volume Card */}
            <div style={{ ...styles.summaryCard, ...styles.summaryCardDark }}>
              <div style={styles.summaryCardHeader}>
                <span style={{ ...styles.summaryCardTitle, ...styles.summaryCardTitleLight }}>Ticket Volume</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <MessageSquare size={16} color="#FFFFFF" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, ...styles.summaryCardValueLight }}>
                {formatNumber(currentMetrics.ticketVolume || 0)}
              </div>
              <div style={{ ...styles.summaryCardSubtext, ...styles.summaryCardSubtextLight }}>
                This {period}
              </div>
            </div>

            {/* Resolution Time Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>Avg Resolution Time</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#FEF3C7' }}>
                  <Clock size={16} color="#F59E0B" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#F59E0B' }}>
                {currentMetrics.resolutionTime || 0} hrs
              </div>
              <div style={styles.summaryCardSubtext}>
                Average time to resolve
              </div>
            </div>

            {/* NPS Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>NPS Score</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#D1FAE5' }}>
                  <ThumbsUp size={16} color="#10B981" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#10B981' }}>
                {currentMetrics.customerServiceNps || 0}
              </div>
              <div style={styles.summaryCardSubtext}>
                Customer satisfaction
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Data View */
        <DataInputPanel
          customerServiceData2025={customerServiceData2025}
          customerServiceData={customerServiceData}
          updateCustomerServiceMonth2025={updateCustomerServiceMonth2025}
          updateCustomerServiceMonth={updateCustomerServiceMonth}
          goalsData={customerServiceGoalsData}
          updateGoalsMonth={updateCustomerServiceGoalsMonth}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
