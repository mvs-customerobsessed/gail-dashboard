import { useState, useEffect, useMemo } from 'react';
import { useRole } from '../hooks/useRole';
import { useWBRData } from '../hooks/useWBRData';
import ViewToggle from './shared/ViewToggle';
import EditDataModal from './shared/EditDataModal';
import WeekNavigator, { getCurrentWeekStart } from './shared/WeekNavigator';
import { Users, Phone, TrendingUp, Loader2, Pencil, Settings2, ChevronDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, ReferenceLine, AreaChart } from 'recharts';

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
  title: { fontSize: '24px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#64748B' },
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

  // Data Input Panel (matching WBRTab)
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

  // Main content layout (charts view) - charts on top, cards below
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
  chartGoal: { fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' },
  chartGoalValue: { fontWeight: 600 },
  chartTypeSelector: { position: 'relative' },
  chartTypeButton: {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
    fontSize: '10px', fontWeight: 500, color: '#64748B', backgroundColor: '#F1F5F9',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
  },
  chartTypeDropdown: {
    position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10, minWidth: '100px', overflow: 'hidden',
  },
  chartTypeOption: {
    padding: '8px 12px', fontSize: '11px', color: '#1E293B', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
  },
  chartContainer: { height: '200px' },
  tooltip: { backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  legend: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748B' },
  legendDot: { width: '6px', height: '6px', borderRadius: '50%' },
  colorPicker: {
    position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10, padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', width: '140px',
  },
  colorSwatch: {
    width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', border: '2px solid transparent',
  },
  colorSwatchSelected: { border: '2px solid #1E293B' },
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

// Default metrics structure
const defaultMetrics = {
  smbAccounts: 0,
  smbCalls: 0,
  smbTalkTime: 0,
  enterpriseAccounts: 0,
  enterpriseCalls: 0,
  enterpriseTalkTime: 0,
  enterpriseRevenue: 0,
  enterpriseExpansion: 0,
  gailGptSeats: 0,
  churned: 0,
  startOfPeriodAccounts: 0,
};

// Default goals
const defaultGoals = {
  totalAccounts: 100,
  totalRevenue: 500000,
  calls: 100000,
};

// Chart type options
const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'stacked', label: 'Stacked Bar' },
];

// Color palette options
const COLOR_PALETTE = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  '#06B6D4', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7',
];

// Default chart configurations
const defaultChartConfig = {
  accountGrowth: { type: 'stacked', colors: ['#3B82F6', '#8B5CF6', '#EF4444'] },
  revenue: { type: 'stacked', colors: ['#10B981', '#8B5CF6'] },
  usage: { type: 'area', colors: ['#3B82F6'] },
};

// Segment options for filtering chart data
const SEGMENT_OPTIONS = [
  { id: 'total', label: 'Total', color: '#1E293B' },
  { id: 'smb', label: 'SMB', color: '#3B82F6' },
  { id: 'enterprise', label: 'Enterprise', color: '#8B5CF6' },
  { id: 'gailgpt', label: 'GailGPT', color: '#EF4444' },
];

// Default segment selection for each chart
const defaultSegmentConfig = {
  accountGrowth: 'total',
  revenue: 'total',
  usage: 'total',
};

// Sample historical data for charts - compare period-by-period
const getSampleHistoricalData = (period) => {
  if (period === 'week') {
    // Week-by-week comparison (not daily)
    return [
      { period: 'Dec 8, \'25', smb: 40, enterprise: 9, gailgpt: 4, calls: 3200, churn: 2.8, nrr: 104 },
      { period: 'Dec 15, \'25', smb: 42, enterprise: 10, gailgpt: 5, calls: 3500, churn: 2.5, nrr: 106 },
      { period: 'Dec 22, \'25', smb: 43, enterprise: 10, gailgpt: 6, calls: 3400, churn: 2.4, nrr: 107 },
      { period: 'Dec 29, \'25', smb: 44, enterprise: 11, gailgpt: 6, calls: 3600, churn: 2.3, nrr: 108 },
      { period: 'Jan 5, \'26', smb: 45, enterprise: 11, gailgpt: 7, calls: 3800, churn: 2.2, nrr: 109 },
      { period: 'Jan 12, \'26', smb: 46, enterprise: 12, gailgpt: 7, calls: 4000, churn: 2.1, nrr: 110 },
      { period: 'Jan 19, \'26', smb: 47, enterprise: 12, gailgpt: 8, calls: 4200, churn: 2.0, nrr: 112 },
    ];
  }
  if (period === 'month') {
    // Month-by-month comparison
    return [
      { period: 'Aug-25', smb: 30, enterprise: 6, gailgpt: 2, calls: 2800, churn: 3.8, nrr: 100 },
      { period: 'Sep-25', smb: 34, enterprise: 7, gailgpt: 3, calls: 3100, churn: 3.5, nrr: 103 },
      { period: 'Oct-25', smb: 38, enterprise: 8, gailgpt: 4, calls: 3400, churn: 3.2, nrr: 105 },
      { period: 'Nov-25', smb: 41, enterprise: 9, gailgpt: 5, calls: 3800, churn: 2.8, nrr: 108 },
      { period: 'Dec-25', smb: 44, enterprise: 10, gailgpt: 6, calls: 4200, churn: 2.4, nrr: 110 },
      { period: 'Jan-26', smb: 47, enterprise: 12, gailgpt: 8, calls: 4500, churn: 2.1, nrr: 112 },
    ];
  }
  if (period === 'quarter') {
    // Quarter-by-quarter comparison
    return [
      { period: 'Q2-25', smb: 28, enterprise: 5, gailgpt: 1, calls: 35000, churn: 4.1, nrr: 100 },
      { period: 'Q3-25', smb: 35, enterprise: 7, gailgpt: 3, calls: 42000, churn: 3.5, nrr: 104 },
      { period: 'Q4-25', smb: 44, enterprise: 10, gailgpt: 6, calls: 52000, churn: 2.6, nrr: 108 },
      { period: 'Q1-26', smb: 47, enterprise: 12, gailgpt: 8, calls: 67000, churn: 2.1, nrr: 112 },
    ];
  }
  // Year view - year-by-year comparison
  return [
    { period: '2023', smb: 12, enterprise: 2, gailgpt: 0, calls: 45000, churn: 6.5, nrr: 92 },
    { period: '2024', smb: 28, enterprise: 5, gailgpt: 2, calls: 120000, churn: 4.2, nrr: 102 },
    { period: '2025', smb: 44, enterprise: 10, gailgpt: 6, calls: 180000, churn: 2.8, nrr: 108 },
    { period: '2026', smb: 47, enterprise: 12, gailgpt: 8, calls: 67000, churn: 2.1, nrr: 112 },
  ];
};

// Metric configurations for edit modal
const metricConfigs = [
  { id: 'smbAccounts', title: 'SMB Accounts', color: '#3B82F6', category: 'Gail Agent SMB' },
  { id: 'smbCalls', title: 'SMB Calls', color: '#3B82F6', category: 'Gail Agent SMB' },
  { id: 'smbTalkTime', title: 'SMB Talk Time (mins)', color: '#3B82F6', category: 'Gail Agent SMB' },
  { id: 'enterpriseAccounts', title: 'Enterprise Accounts', color: '#8B5CF6', category: 'Gail Agent Enterprise' },
  { id: 'enterpriseCalls', title: 'Enterprise Calls', color: '#8B5CF6', category: 'Gail Agent Enterprise' },
  { id: 'enterpriseTalkTime', title: 'Enterprise Talk Time (mins)', color: '#8B5CF6', category: 'Gail Agent Enterprise' },
  { id: 'enterpriseRevenue', title: 'Enterprise Revenue ($)', color: '#8B5CF6', category: 'Gail Agent Enterprise' },
  { id: 'enterpriseExpansion', title: 'Expansion Revenue ($)', color: '#8B5CF6', category: 'Gail Agent Enterprise' },
  { id: 'gailGptSeats', title: 'GailGPT Seats', color: '#EF4444', category: 'GailGPT' },
  { id: 'startOfPeriodAccounts', title: 'Start of Period Accounts', color: '#64748B', category: 'Churn Tracking' },
  { id: 'churned', title: 'Churned Accounts', color: '#64748B', category: 'Churn Tracking' },
];

// Chart settings button component (gear icon with popover)
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
          {/* Chart Type */}
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

          {/* Colors */}
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
                    <div style={{ ...styles.colorPicker, top: '110%', right: 'auto', left: 0 }}>
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

// Data Input Panel Component (matching WBRTab pattern)
function DataInputPanel({
  customersData2025,
  customersData,
  updateCustomersMonth2025,
  updateCustomersMonth,
  goalsData,
  updateGoalsMonth
}) {
  const [pasteStatus, setPasteStatus] = useState({});
  const [dataMode, setDataMode] = useState('actuals'); // 'actuals' or 'goals'
  const [dataYear, setDataYear] = useState(2026); // 2025 or 2026

  const parseExcelRow = (text) => {
    const cleaned = text.replace(/[$%,]/g, '').trim();
    const values = cleaned.split(/\t|,\s*|\s{2,}/).map(v => {
      const num = parseFloat(v.trim());
      return isNaN(num) ? null : num;
    });
    return values;
  };

  // Get the correct update function based on year and mode
  const getUpdateFn = () => {
    if (dataMode === 'goals') return updateGoalsMonth;
    return dataYear === 2025 ? updateCustomersMonth2025 : updateCustomersMonth;
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

  // Simplified metrics - grouped by category (Accounts, Revenue, Usage)
  const metrics = [
    // Accounts
    { key: 'smbAccounts', label: 'SMB Accounts', format: 'number' },
    { key: 'enterpriseAccounts', label: 'Enterprise Accounts', format: 'number' },
    { key: 'gailGptSeats', label: 'GailGPT Seats', format: 'number' },
    // Revenue
    { key: 'smbRevenue', label: 'SMB Revenue ($)', format: 'currency' },
    { key: 'enterpriseRevenueCustomers', label: 'Enterprise Revenue ($)', format: 'currency' },
    // Usage
    { key: 'smbCalls', label: 'SMB Calls', format: 'number' },
    { key: 'enterpriseCalls', label: 'Enterprise Calls', format: 'number' },
    { key: 'smbTalkTime', label: 'SMB Talk Time (mins)', format: 'number' },
    { key: 'enterpriseTalkTime', label: 'Enterprise Talk Time (mins)', format: 'number' },
    // Hidden for now: churned, startOfPeriodAccounts, enterpriseExpansion
  ];

  // Get the data based on current year and mode
  const getCurrentData = () => {
    if (dataMode === 'goals') return goalsData;
    return dataYear === 2025 ? customersData2025 : customersData;
  };
  const currentData = getCurrentData();

  return (
    <div style={styles.dataInputPanel}>
      <div style={styles.dataInputHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.dataInputTitle}>Customer Data Input - {dataYear}</h2>
            <p style={styles.dataInputSubtitle}>
              {dataMode === 'actuals'
                ? 'Enter actual values. Data saves automatically as you type.'
                : 'Enter monthly goals/forecasts. These will show as a line on charts.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Year Toggle */}
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
            {/* Mode Toggle (only show for 2026) */}
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
                    ? (metric.format === 'currency'
                        ? Number(rawValue).toLocaleString('en-US')
                        : Number(rawValue).toLocaleString('en-US'))
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

// Segment selector component for filtering chart data
function SegmentSelector({ value, onChange }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const currentSegment = SEGMENT_OPTIONS.find(s => s.id === value) || SEGMENT_OPTIONS[0];

  return (
    <div style={styles.chartTypeSelector}>
      <button
        style={{
          ...styles.chartTypeButton,
          borderLeft: `3px solid ${currentSegment.color}`,
          paddingLeft: '6px',
        }}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {currentSegment.label}
        <ChevronDown size={10} />
      </button>
      {showDropdown && (
        <div style={styles.chartTypeDropdown}>
          {SEGMENT_OPTIONS.map(segment => (
            <div
              key={segment.id}
              style={{
                ...styles.chartTypeOption,
                backgroundColor: value === segment.id ? '#F1F5F9' : 'transparent',
                borderLeft: `3px solid ${segment.color}`,
              }}
              onClick={() => {
                onChange(segment.id);
                setShowDropdown(false);
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === segment.id ? '#F1F5F9' : 'transparent'}
            >
              {segment.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomersTab() {
  const { canEdit } = useRole();
  const [view, setView] = useState('charts'); // 'charts' or 'data' - default to charts for overview
  const [showEditModal, setShowEditModal] = useState(false);
  const [period, setPeriod] = useState('month'); // Default to month (not week)
  const [chartConfig, setChartConfig] = useState(defaultChartConfig);
  const [segmentConfig, setSegmentConfig] = useState(defaultSegmentConfig);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getCurrentWeekStart());

  const handleChartConfigChange = (chartId, newConfig) => {
    setChartConfig(prev => ({ ...prev, [chartId]: newConfig }));
  };

  const handleSegmentChange = (chartId, segment) => {
    setSegmentConfig(prev => ({ ...prev, [chartId]: segment }));
  };

  // Use the unified WBR data hook (same as Internal/External tabs)
  const {
    customersData2025,
    customersData,
    customersGoalsData,
    updateCustomersMonth2025,
    updateCustomersMonth,
    updateGoalsMonth,
    loading,
    isSaving: saving,
  } = useWBRData();

  // Get current month's data for summary metrics
  const metrics = customersData[new Date().getMonth()] || defaultMetrics;
  const goals = defaultGoals;

  // Create history data for charts (filter out empty months)
  const history = useMemo(() => {
    return customersData
      .map((monthData, index) => ({
        period: MONTHS[index],
        ...monthData,
      }))
      .filter(h =>
        h.smbAccounts > 0 || h.enterpriseAccounts > 0 || h.gailGptSeats > 0 ||
        h.smbCalls > 0 || h.enterpriseCalls > 0
      );
  }, [customersData]);

  const selectedPeriodStart = `2026-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const setSelectedPeriodStart = () => {};

  // Local state for form editing
  const [segments, setSegments] = useState(defaultMetrics);
  const [projections, setProjections] = useState({});

  // Sync local state with hook data (current month's data)
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (customersData && customersData[currentMonth]) {
      setSegments(customersData[currentMonth]);
    }
  }, [customersData]);

  // Sync projections from goals (projections stored in goals.projections)
  useEffect(() => {
    if (goals?.projections) {
      setProjections(goals.projections);
    }
  }, [goals]);

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  // Current goals
  const currentGoals = goals && Object.keys(goals).length > 0 ? goals : defaultGoals;

  // Calculated metrics (ensure number conversion to avoid string concatenation)
  const totalAccounts = Number(segments.smbAccounts || 0) + Number(segments.enterpriseAccounts || 0) + Number(segments.gailGptSeats || 0);
  const totalCalls = Number(segments.smbCalls || 0) + Number(segments.enterpriseCalls || 0);
  const totalRevenue = Number(segments.smbRevenue || 0) + Number(segments.enterpriseRevenueCustomers || 0);

  // Build chart data with 6-month rolling window (3 past + current + 2 future)
  const historicalData = useMemo(() => {
    const now = new Date();
    const currentMonthIndex = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Generate 6 months: 3 back + current + 2 ahead
    const monthsToShow = [];
    for (let offset = -3; offset <= 2; offset++) {
      let monthIndex = currentMonthIndex + offset;
      let year = currentYear;

      // Handle year wrap
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
      // Get data from the appropriate year
      const sourceData = year === 2025 ? customersData2025 : customersData;
      // Goals only exist for 2026
      const sourceGoals = year === 2026 ? customersGoalsData : null;

      const actual = sourceData?.[monthIndex] || {};
      const goal = sourceGoals?.[monthIndex] || {};

      // Format: "Dec-25" or "Jan-26"
      const monthAbbr = MONTHS[monthIndex];
      const yearShort = String(year).slice(-2);
      const periodLabel = `${monthAbbr}-${yearShort}`;

      return {
        period: periodLabel,
        // Account values (for bars)
        smb: actual.smbAccounts || 0,
        enterprise: actual.enterpriseAccounts || 0,
        gailgpt: actual.gailGptSeats || 0,
        total: (actual.smbAccounts || 0) + (actual.enterpriseAccounts || 0) + (actual.gailGptSeats || 0),
        // Revenue values
        smbRevenue: actual.smbRevenue || 0,
        enterpriseRevenue: actual.enterpriseRevenueCustomers || 0,
        totalRevenue: (actual.smbRevenue || 0) + (actual.enterpriseRevenueCustomers || 0),
        // Usage values
        smbCalls: actual.smbCalls || 0,
        enterpriseCalls: actual.enterpriseCalls || 0,
        totalCalls: (actual.smbCalls || 0) + (actual.enterpriseCalls || 0),
        calls: (actual.smbCalls || 0) + (actual.enterpriseCalls || 0),
        // Goal values (for line) - only for 2026 months
        goalSmb: goal.smbAccounts || null,
        goalEnterprise: goal.enterpriseAccounts || null,
        goalGailgpt: goal.gailGptSeats || null,
        goalTotal: (goal.smbAccounts || 0) + (goal.enterpriseAccounts || 0) + (goal.gailGptSeats || 0) || null,
        goalSmbRevenue: goal.smbRevenue || null,
        goalEnterpriseRevenue: goal.enterpriseRevenueCustomers || null,
        goalTotalRevenue: (goal.smbRevenue || 0) + (goal.enterpriseRevenueCustomers || 0) || null,
        goalSmbCalls: goal.smbCalls || null,
        goalEnterpriseCalls: goal.enterpriseCalls || null,
        goalTotalCalls: (goal.smbCalls || 0) + (goal.enterpriseCalls || 0) || null,
      };
    });
  }, [customersData, customersData2025, customersGoalsData]);

  // Check if we have any goals data for showing the legend
  const hasGoalsData = useMemo(() => {
    return customersGoalsData.some(g =>
      g.smbAccounts > 0 || g.enterpriseAccounts > 0 || g.gailGptSeats > 0 ||
      g.smbCalls > 0 || g.smbRevenue > 0 || g.enterpriseRevenueCustomers > 0
    );
  }, [customersGoalsData]);

  // Get goals data key for the line overlay
  const getGoalDataKey = (segment) => {
    if (segment === 'smb') return 'goalSmb';
    if (segment === 'enterprise') return 'goalEnterprise';
    if (segment === 'gailgpt') return 'goalGailgpt';
    return 'goalTotal';
  };

  const getGoalUsageDataKey = (segment) => {
    if (segment === 'smb') return 'goalSmbCalls';
    if (segment === 'enterprise') return 'goalEnterpriseCalls';
    return 'goalTotalCalls';
  };

  // Get data key for revenue chart based on segment
  const getRevenueDataKey = (segment) => {
    if (segment === 'smb') return 'smbRevenue';
    if (segment === 'enterprise') return 'enterpriseRevenue';
    return 'totalRevenue';
  };

  const getGoalRevenueDataKey = (segment) => {
    if (segment === 'smb') return 'goalSmbRevenue';
    if (segment === 'enterprise') return 'goalEnterpriseRevenue';
    return 'goalTotalRevenue';
  };

  // Get data key for account growth chart based on segment
  const getAccountDataKey = (segment) => {
    if (segment === 'smb') return 'smb';
    if (segment === 'enterprise') return 'enterprise';
    if (segment === 'gailgpt') return 'gailgpt';
    return 'total'; // 'total' shows all segments stacked
  };

  // Get data key for usage chart based on segment
  const getUsageDataKey = (segment) => {
    if (segment === 'smb') return 'smbCalls';
    if (segment === 'enterprise') return 'enterpriseCalls';
    return 'totalCalls';
  };

  // Get projection value for current month
  const getCurrentMonthProjection = (metricId) => {
    const selectedDate = selectedPeriodStart ? new Date(selectedPeriodStart) : new Date();
    const monthIndex = selectedDate.getMonth();
    return projections[metricId]?.[monthIndex] || 0;
  };

  // Calculate total accounts projection (sum of smb + enterprise + gailgpt projections)
  const getTotalAccountsProjection = () => {
    const selectedDate = selectedPeriodStart ? new Date(selectedPeriodStart) : new Date();
    const monthIndex = selectedDate.getMonth();
    const smbProj = projections.smbAccounts?.[monthIndex] || 0;
    const entProj = projections.enterpriseAccounts?.[monthIndex] || 0;
    const gptProj = projections.gailGptSeats?.[monthIndex] || 0;
    return smbProj + entProj + gptProj;
  };

  // Calculate total calls projection
  const getTotalCallsProjection = () => {
    const selectedDate = selectedPeriodStart ? new Date(selectedPeriodStart) : new Date();
    const monthIndex = selectedDate.getMonth();
    const smbCallsProj = projections.smbCalls?.[monthIndex] || 0;
    const entCallsProj = projections.enterpriseCalls?.[monthIndex] || 0;
    return smbCallsProj + entCallsProj;
  };

  const handleSaveFromModal = async (newMetrics, newGoals, newProjections) => {
    setSegments(newMetrics);
    if (newProjections && Object.keys(newProjections).length > 0) {
      setProjections(newProjections);
      // Store projections inside goals object
      const goalsWithProjections = { ...newGoals, projections: newProjections };
      await save(newMetrics, goalsWithProjections);
    } else {
      await save(newMetrics, newGoals);
    }
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
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div style={{ ...styles.headerLeft, display: 'flex', alignItems: 'center', gap: '24px' }}>
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
              onClick={() => setShowEditModal(true)}
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
          {/* Charts Grid (Left) */}
          <div style={styles.chartsGrid}>
            {/* Account Growth Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Account Growth</span>
                <div style={styles.chartHeaderRight}>
                  <SegmentSelector value={segmentConfig.accountGrowth} onChange={(s) => handleSegmentChange('accountGrowth', s)} />
                  <ChartSettingsButton chartId="accountGrowth" config={chartConfig.accountGrowth} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {segmentConfig.accountGrowth === 'total' ? (
                    // Show all segments (stacked or grouped)
                    (() => {
                      const totalProjection = getTotalAccountsProjection();
                      const projectionLine = totalProjection > 0 ? (
                        <ReferenceLine y={totalProjection} stroke="#F59E0B" strokeDasharray="8 4" strokeWidth={2} label={{ value: `Proj: ${totalProjection}`, fill: '#F59E0B', fontSize: 9, position: 'right' }} />
                      ) : null;

                      if (chartConfig.accountGrowth.type === 'stacked') {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            <Bar dataKey="smb" name="SMB Actual" stackId="a" fill={chartConfig.accountGrowth.colors[0]} />
                            <Bar dataKey="enterprise" name="Ent. Actual" stackId="a" fill={chartConfig.accountGrowth.colors[1]} />
                            <Bar dataKey="gailgpt" name="GPT Actual" stackId="a" fill={chartConfig.accountGrowth.colors[2]} radius={[4, 4, 0, 0]} />
                            {hasGoalsData && (
                              <Line type="monotone" dataKey="goalTotal" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                            )}
                          </ComposedChart>
                        );
                      } else if (chartConfig.accountGrowth.type === 'bar') {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            <Bar dataKey="smb" name="SMB Actual" fill={chartConfig.accountGrowth.colors[0]} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="enterprise" name="Ent. Actual" fill={chartConfig.accountGrowth.colors[1]} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="gailgpt" name="GPT Actual" fill={chartConfig.accountGrowth.colors[2]} radius={[4, 4, 0, 0]} />
                            {hasGoalsData && (
                              <Line type="monotone" dataKey="goalTotal" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                            )}
                          </ComposedChart>
                        );
                      } else if (chartConfig.accountGrowth.type === 'line') {
                        return (
                          <LineChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            <ReferenceLine y={currentGoals.totalAccounts} stroke="#10B981" strokeDasharray="5 5" />
                            {projectionLine}
                            <Line type="monotone" dataKey="smb" name="SMB" stroke={chartConfig.accountGrowth.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="enterprise" name="Enterprise" stroke={chartConfig.accountGrowth.colors[1]} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="gailgpt" name="GailGPT" stroke={chartConfig.accountGrowth.colors[2]} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        );
                      } else {
                        return (
                          <AreaChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            <ReferenceLine y={currentGoals.totalAccounts} stroke="#10B981" strokeDasharray="5 5" />
                            {projectionLine}
                            <Area type="monotone" dataKey="smb" name="SMB" fill={chartConfig.accountGrowth.colors[0]} fillOpacity={0.6} stroke={chartConfig.accountGrowth.colors[0]} />
                            <Area type="monotone" dataKey="enterprise" name="Enterprise" fill={chartConfig.accountGrowth.colors[1]} fillOpacity={0.6} stroke={chartConfig.accountGrowth.colors[1]} />
                            <Area type="monotone" dataKey="gailgpt" name="GailGPT" fill={chartConfig.accountGrowth.colors[2]} fillOpacity={0.6} stroke={chartConfig.accountGrowth.colors[2]} />
                          </AreaChart>
                        );
                      }
                    })()
                  ) : (
                    // Show single segment
                    (() => {
                      const dataKey = getAccountDataKey(segmentConfig.accountGrowth);
                      const segmentColor = SEGMENT_OPTIONS.find(s => s.id === segmentConfig.accountGrowth)?.color || '#3B82F6';
                      // Get segment-specific projection
                      const segmentMetricMap = { smb: 'smbAccounts', enterprise: 'enterpriseAccounts', gailgpt: 'gailGptSeats' };
                      const segmentProjection = getCurrentMonthProjection(segmentMetricMap[segmentConfig.accountGrowth]);
                      const projectionLine = segmentProjection > 0 ? (
                        <ReferenceLine y={segmentProjection} stroke="#F59E0B" strokeDasharray="8 4" strokeWidth={2} />
                      ) : null;

                      if (chartConfig.accountGrowth.type === 'bar' || chartConfig.accountGrowth.type === 'stacked') {
                        return (
                          <BarChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            {projectionLine}
                            <Bar dataKey={dataKey} name={SEGMENT_OPTIONS.find(s => s.id === segmentConfig.accountGrowth)?.label} fill={segmentColor} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        );
                      } else if (chartConfig.accountGrowth.type === 'line') {
                        return (
                          <LineChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            {projectionLine}
                            <Line type="monotone" dataKey={dataKey} name={SEGMENT_OPTIONS.find(s => s.id === segmentConfig.accountGrowth)?.label} stroke={segmentColor} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        );
                      } else {
                        return (
                          <AreaChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <defs>
                              <linearGradient id="segmentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={segmentColor} stopOpacity={0.3}/>
                                <stop offset="100%" stopColor={segmentColor} stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip contentStyle={styles.tooltip} />
                            {projectionLine}
                            <Area type="monotone" dataKey={dataKey} name={SEGMENT_OPTIONS.find(s => s.id === segmentConfig.accountGrowth)?.label} fill="url(#segmentGradient)" stroke={segmentColor} strokeWidth={2} />
                          </AreaChart>
                        );
                      }
                    })()
                  )}
                </ResponsiveContainer>
              </div>
              {segmentConfig.accountGrowth === 'total' && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.accountGrowth.colors[0] }}></span> SMB</span>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.accountGrowth.colors[1] }}></span> Enterprise</span>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.accountGrowth.colors[2] }}></span> GailGPT</span>
                  {hasGoalsData && (
                    <span style={styles.legendItem}>
                      <span style={{ width: '12px', height: '2px', backgroundColor: '#F59E0B', borderTop: '2px dashed #F59E0B' }}></span> Goal
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Revenue Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Revenue</span>
                <div style={styles.chartHeaderRight}>
                  <SegmentSelector value={segmentConfig.revenue} onChange={(s) => handleSegmentChange('revenue', s)} />
                  <ChartSettingsButton chartId="revenue" config={chartConfig.revenue} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {segmentConfig.revenue === 'total' ? (
                    // Show both SMB and Enterprise revenue
                    (() => {
                      if (chartConfig.revenue.type === 'stacked') {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, '']} />
                            <Bar dataKey="smbRevenue" name="SMB Revenue" stackId="a" fill={chartConfig.revenue.colors[0]} />
                            <Bar dataKey="enterpriseRevenue" name="Ent. Revenue" stackId="a" fill={chartConfig.revenue.colors[1]} radius={[4, 4, 0, 0]} />
                            {hasGoalsData && (
                              <Line type="monotone" dataKey="goalTotalRevenue" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                            )}
                          </ComposedChart>
                        );
                      } else if (chartConfig.revenue.type === 'bar') {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, '']} />
                            <Bar dataKey="smbRevenue" name="SMB Revenue" fill={chartConfig.revenue.colors[0]} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="enterpriseRevenue" name="Ent. Revenue" fill={chartConfig.revenue.colors[1]} radius={[4, 4, 0, 0]} />
                            {hasGoalsData && (
                              <Line type="monotone" dataKey="goalTotalRevenue" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                            )}
                          </ComposedChart>
                        );
                      } else if (chartConfig.revenue.type === 'line') {
                        return (
                          <LineChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, '']} />
                            <Line type="monotone" dataKey="smbRevenue" name="SMB Revenue" stroke={chartConfig.revenue.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="enterpriseRevenue" name="Ent. Revenue" stroke={chartConfig.revenue.colors[1]} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        );
                      } else {
                        return (
                          <AreaChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, '']} />
                            <Area type="monotone" dataKey="smbRevenue" name="SMB Revenue" fill={chartConfig.revenue.colors[0]} fillOpacity={0.6} stroke={chartConfig.revenue.colors[0]} stackId="1" />
                            <Area type="monotone" dataKey="enterpriseRevenue" name="Ent. Revenue" fill={chartConfig.revenue.colors[1]} fillOpacity={0.6} stroke={chartConfig.revenue.colors[1]} stackId="1" />
                          </AreaChart>
                        );
                      }
                    })()
                  ) : (
                    // Show single segment
                    (() => {
                      const dataKey = getRevenueDataKey(segmentConfig.revenue);
                      const goalDataKey = getGoalRevenueDataKey(segmentConfig.revenue);
                      const segmentColor = SEGMENT_OPTIONS.find(s => s.id === segmentConfig.revenue)?.color || '#10B981';
                      const segmentLabel = SEGMENT_OPTIONS.find(s => s.id === segmentConfig.revenue)?.label || 'Total';

                      if (chartConfig.revenue.type === 'bar' || chartConfig.revenue.type === 'stacked') {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, segmentLabel]} />
                            <Bar dataKey={dataKey} name={`${segmentLabel} Revenue`} fill={segmentColor} radius={[4, 4, 0, 0]} />
                            {hasGoalsData && (
                              <Line type="monotone" dataKey={goalDataKey} name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                            )}
                          </ComposedChart>
                        );
                      } else if (chartConfig.revenue.type === 'line') {
                        return (
                          <LineChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, segmentLabel]} />
                            <Line type="monotone" dataKey={dataKey} name={`${segmentLabel} Revenue`} stroke={segmentColor} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        );
                      } else {
                        return (
                          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={segmentColor} stopOpacity={0.3}/>
                                <stop offset="100%" stopColor={segmentColor} stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${formatNumber(v)}`} />
                            <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${formatNumber(value)}`, segmentLabel]} />
                            <Area type="monotone" dataKey={dataKey} fill="url(#revenueGradient)" stroke={segmentColor} strokeWidth={2} />
                          </ComposedChart>
                        );
                      }
                    })()
                  )}
                </ResponsiveContainer>
              </div>
              {segmentConfig.revenue === 'total' && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.revenue.colors[0] }}></span> SMB</span>
                  <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: chartConfig.revenue.colors[1] }}></span> Enterprise</span>
                  {hasGoalsData && (
                    <span style={styles.legendItem}>
                      <span style={{ width: '12px', height: '2px', backgroundColor: '#F59E0B', borderTop: '2px dashed #F59E0B' }}></span> Goal
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Usage Trends Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Usage Trends (Calls)</span>
                <div style={styles.chartHeaderRight}>
                  <SegmentSelector value={segmentConfig.usage} onChange={(s) => handleSegmentChange('usage', s)} />
                  <ChartSettingsButton chartId="usage" config={chartConfig.usage} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    const usageDataKey = getUsageDataKey(segmentConfig.usage);
                    const goalUsageDataKey = getGoalUsageDataKey(segmentConfig.usage);
                    const segmentColor = segmentConfig.usage === 'total' ? chartConfig.usage.colors[0] : (SEGMENT_OPTIONS.find(s => s.id === segmentConfig.usage)?.color || chartConfig.usage.colors[0]);
                    const segmentLabel = SEGMENT_OPTIONS.find(s => s.id === segmentConfig.usage)?.label || 'Total';

                    if (chartConfig.usage.type === 'bar') {
                      return (
                        <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={formatNumber} />
                          <Tooltip contentStyle={styles.tooltip} formatter={(value, name) => [formatNumber(value), name === 'Goal' ? 'Goal' : `${segmentLabel} Calls`]} />
                          <Bar dataKey={usageDataKey} name={`${segmentLabel} Actual`} fill={segmentColor} radius={[4, 4, 0, 0]} />
                          {hasGoalsData && (
                            <Line type="monotone" dataKey={goalUsageDataKey} name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                          )}
                        </ComposedChart>
                      );
                    } else if (chartConfig.usage.type === 'line') {
                      return (
                        <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={formatNumber} />
                          <Tooltip contentStyle={styles.tooltip} formatter={(value, name) => [formatNumber(value), name === 'Goal' ? 'Goal' : `${segmentLabel} Calls`]} />
                          <Line type="monotone" dataKey={usageDataKey} name={`${segmentLabel} Actual`} stroke={segmentColor} strokeWidth={2} dot={{ fill: segmentColor, r: 3 }} />
                          {hasGoalsData && (
                            <Line type="monotone" dataKey={goalUsageDataKey} name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                          )}
                        </ComposedChart>
                      );
                    } else {
                      return (
                        <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                          <defs>
                            <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={segmentColor} stopOpacity={0.3}/>
                              <stop offset="100%" stopColor={segmentColor} stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={formatNumber} />
                          <Tooltip contentStyle={styles.tooltip} formatter={(value, name) => [formatNumber(value), name === 'Goal' ? 'Goal' : `${segmentLabel} Calls`]} />
                          <Area type="monotone" dataKey={usageDataKey} name={`${segmentLabel} Actual`} fill="url(#usageGradient)" stroke="none" />
                          <Line type="monotone" dataKey={usageDataKey} stroke={segmentColor} strokeWidth={2} dot={{ fill: segmentColor, r: 3 }} />
                          {hasGoalsData && (
                            <Line type="monotone" dataKey={goalUsageDataKey} name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                          )}
                        </ComposedChart>
                      );
                    }
                  })()}
                </ResponsiveContainer>
              </div>
              {hasGoalsData && (
                <div style={styles.legend}>
                  <span style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: chartConfig.usage.colors[0] }}></span> Actual
                  </span>
                  <span style={styles.legendItem}>
                    <span style={{ width: '12px', height: '2px', backgroundColor: '#F59E0B', borderTop: '2px dashed #F59E0B' }}></span> Goal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards (Below charts) */}
          <div style={styles.summaryCardsContainer}>
            {/* Total Accounts - Dark Card */}
            <div style={{ ...styles.summaryCard, ...styles.summaryCardDark }}>
              <div style={styles.summaryCardHeader}>
                <span style={{ ...styles.summaryCardTitle, ...styles.summaryCardTitleLight }}>Total Accounts</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Users size={16} color="#FFFFFF" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, ...styles.summaryCardValueLight }}>{formatNumber(totalAccounts)}</div>
              <div style={{ ...styles.summaryCardSubtext, ...styles.summaryCardSubtextLight }}>
                Active accounts
              </div>
              <div style={styles.breakdown}>
                <div style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>SMB</div>
                  <div style={styles.breakdownValue}>{segments.smbAccounts || 0}</div>
                </div>
                <div style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>Enterprise</div>
                  <div style={styles.breakdownValue}>{segments.enterpriseAccounts || 0}</div>
                </div>
                <div style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>GailGPT</div>
                  <div style={styles.breakdownValue}>{segments.gailGptSeats || 0}</div>
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>Total Revenue</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#D1FAE5' }}>
                  <TrendingUp size={16} color="#10B981" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#10B981' }}>${formatNumber(totalRevenue)}</div>
              <div style={styles.summaryCardSubtext}>
                This {period}
              </div>
              <div style={{ ...styles.breakdown, borderTop: '1px solid #E2E8F0' }}>
                <div style={styles.breakdownItem}>
                  <div style={{ ...styles.breakdownLabel, color: '#64748B' }}>SMB</div>
                  <div style={{ ...styles.breakdownValue, color: '#1E293B' }}>${formatNumber(segments.smbRevenue || 0)}</div>
                </div>
                <div style={styles.breakdownItem}>
                  <div style={{ ...styles.breakdownLabel, color: '#64748B' }}>Enterprise</div>
                  <div style={{ ...styles.breakdownValue, color: '#1E293B' }}>${formatNumber(segments.enterpriseRevenueCustomers || 0)}</div>
                </div>
              </div>
            </div>

            {/* Total Usage Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>Total Usage</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#DBEAFE' }}>
                  <Phone size={16} color="#3B82F6" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#3B82F6' }}>{formatNumber(totalCalls)}</div>
              <div style={styles.summaryCardSubtext}>
                Calls this {period}
              </div>
              <div style={{ ...styles.breakdown, borderTop: '1px solid #E2E8F0' }}>
                <div style={styles.breakdownItem}>
                  <div style={{ ...styles.breakdownLabel, color: '#64748B' }}>SMB</div>
                  <div style={{ ...styles.breakdownValue, color: '#1E293B' }}>{formatNumber(segments.smbCalls || 0)}</div>
                </div>
                <div style={styles.breakdownItem}>
                  <div style={{ ...styles.breakdownLabel, color: '#64748B' }}>Enterprise</div>
                  <div style={{ ...styles.breakdownValue, color: '#1E293B' }}>{formatNumber(segments.enterpriseCalls || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Data View - Using same pattern as Internal/External tabs */
        <DataInputPanel
          customersData2025={customersData2025}
          customersData={customersData}
          updateCustomersMonth2025={updateCustomersMonth2025}
          updateCustomersMonth={updateCustomersMonth}
          goalsData={customersGoalsData}
          updateGoalsMonth={updateGoalsMonth}
        />
      )}

      {/* Edit Data Modal */}
      <EditDataModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        metrics={segments}
        goals={currentGoals}
        projections={projections}
        metricConfigs={metricConfigs}
        onSave={handleSaveFromModal}
        selectedPeriodStart={selectedPeriodStart}
        onPeriodChange={setSelectedPeriodStart}
        saving={saving}
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
