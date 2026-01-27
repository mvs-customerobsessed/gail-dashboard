import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRole } from '../hooks/useRole';
import { useWBRData } from '../hooks/useWBRData';
import ViewToggle from './shared/ViewToggle';
import WeekNavigator, { getCurrentWeekStart } from './shared/WeekNavigator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Area } from 'recharts';
import { Target, TrendingUp, DollarSign, Users, Calendar, Loader2, Pencil, Settings2 } from 'lucide-react';
import * as hubspotApi from '../services/hubspotApi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

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
  periodButtonHubspot: { backgroundColor: '#FF7A59', color: '#FFFFFF', borderColor: '#FF7A59' },

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

  // Summary cards
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

  // Data Input Panel
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

  // Mode Toggle
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

  // HubSpot section
  hubspotSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #E2E8F0',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  configWarning: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  warningIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '14px',
    color: '#92400E',
  },
  warningCode: {
    backgroundColor: '#FDE68A',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1E293B',
  },
  statSubtext: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid #E2E8F0',
    borderTopColor: '#0062e2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    marginBottom: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  refreshButton: {
    padding: '6px 12px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E2E8F0',
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    marginBottom: '16px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },

  // Loading state
  loadingOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748B' },
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value?.toLocaleString() || '0';
};

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value?.toLocaleString() || '0'}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Chart type options
const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
];

// Color palette
const COLOR_PALETTE = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  '#06B6D4', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7',
];

// Default chart configurations
const defaultChartConfig = {
  pipeline: { type: 'bar', colors: ['#3B82F6'] },
  revenue: { type: 'bar', colors: ['#10B981'] },
  winRate: { type: 'area', colors: ['#F59E0B'] },
};

// Pipeline stage colors for HubSpot
const STAGE_COLORS = [
  '#0062e2', '#3b82f6', '#60a5fa', '#34d399', '#10b981', '#f59e0b', '#f97316', '#ef4444',
];

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
  salesData2025,
  salesData,
  updateSalesMonth2025,
  updateSalesMonth,
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
    return dataYear === 2025 ? updateSalesMonth2025 : updateSalesMonth;
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
    { key: 'pipelineAdded', label: 'Pipeline Added ($)', format: 'currency' },
    { key: 'totalPipeline', label: 'Total Pipeline ($)', format: 'currency' },
    { key: 'dealsClosed', label: 'Deals Closed', format: 'number' },
    { key: 'revenueClosed', label: 'Revenue Closed ($)', format: 'currency' },
    { key: 'winRate', label: 'Win Rate (%)', format: 'percent' },
    { key: 'meetingsBooked', label: 'Meetings Booked', format: 'number' },
    { key: 'qualifiedLeads', label: 'Qualified Leads', format: 'number' },
    { key: 'avgDealSize', label: 'Avg Deal Size ($)', format: 'currency' },
  ];

  const getCurrentData = () => {
    if (dataMode === 'goals') return goalsData;
    return dataYear === 2025 ? salesData2025 : salesData;
  };
  const currentData = getCurrentData();

  return (
    <div style={styles.dataInputPanel}>
      <div style={styles.dataInputHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.dataInputTitle}>Sales Data Input - {dataYear}</h2>
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

// HubSpot Pipeline Chart Component
function HubSpotPipelineChart({ data, loading, onRefresh }) {
  if (loading) {
    return (
      <div style={styles.emptyState}>
        <span style={styles.loadingSpinner}></span>
        <div style={{ marginTop: '12px' }}>Loading pipeline...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div style={styles.emptyState}>No pipeline data available</div>;
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>HubSpot Deal Pipeline</div>
          <div style={styles.cardSubtitle}>Deals by stage (live data)</div>
        </div>
        <button style={styles.refreshButton} onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={formatCurrency} />
          <YAxis type="category" dataKey="stageName" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} width={100} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={(value) => [formatCurrency(value), 'Value']}
          />
          <Bar dataKey="totalValue" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// HubSpot Recent Deals Component
function HubSpotRecentDeals({ deals, loading, onRefresh }) {
  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Recent Deals</div>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Recent Deals</div>
          <div style={styles.cardSubtitle}>Latest from HubSpot</div>
        </div>
        <button style={styles.refreshButton} onClick={onRefresh}>↻</button>
      </div>
      {deals.length === 0 ? (
        <div style={styles.emptyState}>No deals found</div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Deal</th>
                <th style={styles.tableHeader}>Amount</th>
                <th style={styles.tableHeader}>Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 8).map(deal => (
                <tr key={deal.id}>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: 500 }}>{deal.properties.dealname || 'Unnamed'}</div>
                  </td>
                  <td style={styles.tableCell}>
                    {deal.properties.amount ? formatCurrency(parseFloat(deal.properties.amount)) : '-'}
                  </td>
                  <td style={styles.tableCell}>{formatDate(deal.properties.closedate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SalesTab() {
  const { canEdit } = useRole();
  const [view, setView] = useState('charts');
  const [period, setPeriod] = useState('month');
  const [chartConfig, setChartConfig] = useState(defaultChartConfig);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getCurrentWeekStart());

  // HubSpot state
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [hubspotLoading, setHubspotLoading] = useState(true);
  const [hubspotError, setHubspotError] = useState(null);
  const [hubspotPipelineData, setHubspotPipelineData] = useState([]);
  const [hubspotDeals, setHubspotDeals] = useState([]);
  const [hubspotStats, setHubspotStats] = useState(null);

  const handleChartConfigChange = (chartId, newConfig) => {
    setChartConfig(prev => ({ ...prev, [chartId]: newConfig }));
  };

  // Use the unified WBR data hook
  const {
    salesData2025,
    salesData,
    salesGoalsData,
    updateSalesMonth2025,
    updateSalesMonth,
    updateSalesGoalsMonth,
    loading,
  } = useWBRData();

  // Get current month's data for summary metrics
  const currentMonth = new Date().getMonth();
  const currentMetrics = salesData[currentMonth] || {};

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
    { id: 'hubspot', label: 'HubSpot' },
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
      const sourceData = year === 2025 ? salesData2025 : salesData;
      const sourceGoals = year === 2026 ? salesGoalsData : null;

      const actual = sourceData?.[monthIndex] || {};
      const goal = sourceGoals?.[monthIndex] || {};

      const monthAbbr = MONTHS[monthIndex];
      const yearShort = String(year).slice(-2);
      const periodLabel = `${monthAbbr}-${yearShort}`;

      return {
        period: periodLabel,
        pipelineAdded: actual.pipelineAdded || 0,
        totalPipeline: actual.totalPipeline || 0,
        dealsClosed: actual.dealsClosed || 0,
        revenueClosed: actual.revenueClosed || 0,
        winRate: actual.winRate || 0,
        meetingsBooked: actual.meetingsBooked || 0,
        goalPipelineAdded: goal.pipelineAdded || null,
        goalTotalPipeline: goal.totalPipeline || null,
        goalRevenueClosed: goal.revenueClosed || null,
        goalWinRate: goal.winRate || null,
      };
    });
  }, [salesData, salesData2025, salesGoalsData]);

  // Check if we have any goals data
  const hasGoalsData = useMemo(() => {
    return salesGoalsData.some(g =>
      g.pipelineAdded > 0 || g.totalPipeline > 0 || g.revenueClosed > 0 || g.winRate > 0
    );
  }, [salesGoalsData]);

  // HubSpot data fetching
  const fetchHubspotData = useCallback(async () => {
    if (!hubspotApi.isConfigured()) {
      setHubspotConnected(false);
      setHubspotError('HubSpot not configured. Add VITE_HUBSPOT_ACCESS_TOKEN to your .env file.');
      setHubspotLoading(false);
      return;
    }

    setHubspotLoading(true);
    setHubspotError(null);
    try {
      const result = await hubspotApi.testConnection();
      if (result.success) {
        setHubspotConnected(true);
        setHubspotError(null);

        const [pipelineResult, contactsData, companiesData] = await Promise.all([
          hubspotApi.getDealsByStage(),
          hubspotApi.getContacts(1),
          hubspotApi.getCompanies(1),
        ]);

        const { stages, deals: dealsList } = pipelineResult;

        let totalPipelineValue = 0;
        let dealsThisMonth = 0;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const deal of dealsList) {
          const amount = parseFloat(deal.properties?.amount) || 0;
          totalPipelineValue += amount;
          const created = new Date(deal.properties?.createdate);
          if (created >= startOfMonth) dealsThisMonth++;
        }

        setHubspotStats({
          totalDeals: dealsList.length,
          totalPipelineValue,
          dealsThisMonth,
          totalContacts: contactsData.total || 0,
          totalCompanies: companiesData.total || 0,
        });
        setHubspotPipelineData(stages);
        setHubspotDeals(dealsList);
      } else {
        setHubspotConnected(false);
        setHubspotError(result.error || 'Connection test failed. Check your HubSpot token.');
      }
    } catch (err) {
      console.error('HubSpot error:', err);
      setHubspotConnected(false);
      setHubspotError(err.message || 'Failed to connect to HubSpot.');
    } finally {
      setHubspotLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubspotData();
  }, [fetchHubspotData]);

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
                style={{
                  ...styles.periodButton,
                  ...(period === p.id
                    ? (p.id === 'hubspot' ? styles.periodButtonHubspot : styles.periodButtonActive)
                    : {}),
                }}
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
      {view === 'data' ? (
        /* Data View */
        <DataInputPanel
          salesData2025={salesData2025}
          salesData={salesData}
          updateSalesMonth2025={updateSalesMonth2025}
          updateSalesMonth={updateSalesMonth}
          goalsData={salesGoalsData}
          updateGoalsMonth={updateSalesGoalsMonth}
        />
      ) : period === 'hubspot' ? (
        /* HubSpot View */
        <div style={styles.mainLayout}>
          {hubspotConnected ? (
            <>
              <div style={styles.connectionStatus}>
                <div style={{ ...styles.statusDot, ...styles.statusConnected }}></div>
                <span>Connected to HubSpot</span>
              </div>

              {/* HubSpot Stats */}
              {hubspotStats && (
                <div style={styles.grid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Pipeline Value</div>
                    <div style={styles.statValue}>{formatCurrency(hubspotStats.totalPipelineValue)}</div>
                    <div style={styles.statSubtext}>{hubspotStats.totalDeals} deals</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>This Month</div>
                    <div style={styles.statValue}>{hubspotStats.dealsThisMonth}</div>
                    <div style={styles.statSubtext}>New deals</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Contacts</div>
                    <div style={styles.statValue}>{formatNumber(hubspotStats.totalContacts)}</div>
                    <div style={styles.statSubtext}>In CRM</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Companies</div>
                    <div style={styles.statValue}>{formatNumber(hubspotStats.totalCompanies)}</div>
                    <div style={styles.statSubtext}>In CRM</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <HubSpotPipelineChart data={hubspotPipelineData} loading={hubspotLoading} onRefresh={fetchHubspotData} />
                <HubSpotRecentDeals deals={hubspotDeals} loading={hubspotLoading} onRefresh={fetchHubspotData} />
              </div>
            </>
          ) : hubspotLoading ? (
            <div style={styles.loadingOverlay}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '8px' }}>Connecting to HubSpot...</span>
            </div>
          ) : (
            <div style={styles.configWarning}>
              <span style={styles.warningIcon}>⚠️</span>
              <div style={styles.warningText}>
                <strong>HubSpot Connection Issue</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                  {hubspotError || 'Unable to connect to HubSpot. Check your configuration.'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Charts View */
        <div style={styles.mainLayout}>
          {/* Charts Grid */}
          <div style={styles.chartsGrid}>
            {/* Pipeline Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Pipeline Added</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="pipeline" config={chartConfig.pipeline} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.pipeline.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Bar dataKey="pipelineAdded" name="Pipeline Added" fill={chartConfig.pipeline.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalPipelineAdded" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.pipeline.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Line type="monotone" dataKey="pipelineAdded" name="Pipeline Added" stroke={chartConfig.pipeline.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalPipelineAdded" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.pipeline.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.pipeline.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Area type="monotone" dataKey="pipelineAdded" name="Pipeline Added" fill="url(#pipelineGradient)" stroke={chartConfig.pipeline.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalPipelineAdded" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Revenue Closed</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="revenue" config={chartConfig.revenue} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.revenue.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Bar dataKey="revenueClosed" name="Revenue" fill={chartConfig.revenue.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalRevenueClosed" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.revenue.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Line type="monotone" dataKey="revenueClosed" name="Revenue" stroke={chartConfig.revenue.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalRevenueClosed" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.revenue.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.revenue.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${formatNumber(v)}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`$${formatNumber(v)}`, '']} />
                      <Area type="monotone" dataKey="revenueClosed" name="Revenue" fill="url(#revenueGradient)" stroke={chartConfig.revenue.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalRevenueClosed" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win Rate Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <span style={styles.chartTitle}>Win Rate (%)</span>
                <div style={styles.chartHeaderRight}>
                  <ChartSettingsButton chartId="winRate" config={chartConfig.winRate} onConfigChange={handleChartConfigChange} />
                </div>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartConfig.winRate.type === 'bar' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`${v}%`, '']} />
                      <Bar dataKey="winRate" name="Win Rate" fill={chartConfig.winRate.colors[0]} radius={[4, 4, 0, 0]} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalWinRate" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : chartConfig.winRate.type === 'line' ? (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`${v}%`, '']} />
                      <Line type="monotone" dataKey="winRate" name="Win Rate" stroke={chartConfig.winRate.colors[0]} strokeWidth={2} dot={{ r: 3 }} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalWinRate" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.winRate.colors[0]} stopOpacity={0.3}/>
                          <stop offset="100%" stopColor={chartConfig.winRate.colors[0]} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(v) => [`${v}%`, '']} />
                      <Area type="monotone" dataKey="winRate" name="Win Rate" fill="url(#winRateGradient)" stroke={chartConfig.winRate.colors[0]} strokeWidth={2} />
                      {hasGoalsData && (
                        <Line type="monotone" dataKey="goalWinRate" name="Goal" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={styles.summaryCardsContainer}>
            {/* Total Pipeline Card */}
            <div style={{ ...styles.summaryCard, ...styles.summaryCardDark }}>
              <div style={styles.summaryCardHeader}>
                <span style={{ ...styles.summaryCardTitle, ...styles.summaryCardTitleLight }}>Total Pipeline</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <DollarSign size={16} color="#FFFFFF" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, ...styles.summaryCardValueLight }}>
                {formatCurrency(currentMetrics.totalPipeline || 0)}
              </div>
              <div style={{ ...styles.summaryCardSubtext, ...styles.summaryCardSubtextLight }}>
                Active deals
              </div>
              <div style={styles.breakdown}>
                <div style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>Added</div>
                  <div style={styles.breakdownValue}>{formatCurrency(currentMetrics.pipelineAdded || 0)}</div>
                </div>
                <div style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>Deals</div>
                  <div style={styles.breakdownValue}>{currentMetrics.dealsClosed || 0}</div>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>Revenue Closed</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#D1FAE5' }}>
                  <TrendingUp size={16} color="#10B981" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#10B981' }}>
                {formatCurrency(currentMetrics.revenueClosed || 0)}
              </div>
              <div style={styles.summaryCardSubtext}>
                This {period}
              </div>
            </div>

            {/* Meetings Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <span style={styles.summaryCardTitle}>Meetings Booked</span>
                <div style={{ ...styles.summaryCardIcon, backgroundColor: '#DBEAFE' }}>
                  <Calendar size={16} color="#3B82F6" />
                </div>
              </div>
              <div style={{ ...styles.summaryCardValue, color: '#3B82F6' }}>
                {formatNumber(currentMetrics.meetingsBooked || 0)}
              </div>
              <div style={styles.summaryCardSubtext}>
                This {period}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
