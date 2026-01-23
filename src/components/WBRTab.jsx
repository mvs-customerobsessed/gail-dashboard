import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';

// Month labels
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// Starting ARR (beginning of 2025)
const STARTING_ARR = 1904593;

// Default empty monthly data structure
const createEmptyMonthlyData = () => MONTHS.map(month => ({
  month,
  smbRevenue: 0,
  enterpriseRevenue: 0,
  bancoAztecaRevenue: 0,
  smbAccounts: 0,
  enterpriseAccounts: 0,
  nps: null,
  burn: 0,
  grossMarginPct: 0,
}));

// Calculate total revenue from segments
const getTotalRevenue = (month) => {
  return (parseFloat(month.smbRevenue) || 0) +
         (parseFloat(month.enterpriseRevenue) || 0) +
         (parseFloat(month.bancoAztecaRevenue) || 0);
};

// Format currency
const formatCurrency = (value, compact = false) => {
  if (value === null || value === undefined) return '-';
  if (compact && Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format number
const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(value);
};

// Calculate ARR from monthly revenue
const calculateARR = (monthlyRevenue) => monthlyRevenue * 12;

// Aggregate monthly data to quarters
const aggregateToQuarters = (monthlyData) => {
  return QUARTERS.map((quarter, qIndex) => {
    const startMonth = qIndex * 3;
    const quarterMonths = monthlyData.slice(startMonth, startMonth + 3);
    const validNps = quarterMonths.filter(m => m.nps !== null && m.nps !== '');

    return {
      quarter,
      smbRevenue: quarterMonths.reduce((sum, m) => sum + (parseFloat(m.smbRevenue) || 0), 0),
      enterpriseRevenue: quarterMonths.reduce((sum, m) => sum + (parseFloat(m.enterpriseRevenue) || 0), 0),
      bancoAztecaRevenue: quarterMonths.reduce((sum, m) => sum + (parseFloat(m.bancoAztecaRevenue) || 0), 0),
      smbAccounts: quarterMonths[2]?.smbAccounts || quarterMonths[1]?.smbAccounts || quarterMonths[0]?.smbAccounts || 0,
      enterpriseAccounts: quarterMonths[2]?.enterpriseAccounts || quarterMonths[1]?.enterpriseAccounts || quarterMonths[0]?.enterpriseAccounts || 0,
      nps: validNps.length > 0 ? Math.round(validNps.reduce((sum, m) => sum + parseFloat(m.nps), 0) / validNps.length) : null,
      burn: quarterMonths.reduce((sum, m) => sum + (parseFloat(m.burn) || 0), 0),
      grossMarginPct: quarterMonths.filter(m => m.grossMarginPct).length > 0
        ? quarterMonths.reduce((sum, m) => sum + (parseFloat(m.grossMarginPct) || 0), 0) / quarterMonths.filter(m => m.grossMarginPct).length
        : 0,
    };
  });
};

// Aggregate to yearly
const aggregateToYear = (monthlyData) => {
  const validNps = monthlyData.filter(m => m.nps !== null && m.nps !== '');
  const validMargins = monthlyData.filter(m => m.grossMarginPct);

  const smbRevenue = monthlyData.reduce((sum, m) => sum + (parseFloat(m.smbRevenue) || 0), 0);
  const enterpriseRevenue = monthlyData.reduce((sum, m) => sum + (parseFloat(m.enterpriseRevenue) || 0), 0);
  const bancoAztecaRevenue = monthlyData.reduce((sum, m) => sum + (parseFloat(m.bancoAztecaRevenue) || 0), 0);

  return {
    smbRevenue,
    enterpriseRevenue,
    bancoAztecaRevenue,
    totalRevenue: smbRevenue + enterpriseRevenue + bancoAztecaRevenue,
    smbAccounts: Math.max(...monthlyData.map(m => parseFloat(m.smbAccounts) || 0)),
    enterpriseAccounts: Math.max(...monthlyData.map(m => parseFloat(m.enterpriseAccounts) || 0)),
    nps: validNps.length > 0 ? Math.round(validNps.reduce((sum, m) => sum + parseFloat(m.nps), 0) / validNps.length) : null,
    burn: monthlyData.reduce((sum, m) => sum + (parseFloat(m.burn) || 0), 0),
    grossMarginPct: validMargins.length > 0
      ? validMargins.reduce((sum, m) => sum + (parseFloat(m.grossMarginPct) || 0), 0) / validMargins.length
      : 0,
  };
};

// Calculate Net New ARR
const calculateNetNewARR = (monthlyData) => {
  return monthlyData.map((month, index) => {
    const currentRevenue = getTotalRevenue(month);
    if (index === 0) {
      return { ...month, netNewARR: calculateARR(currentRevenue) };
    }
    const prevRevenue = getTotalRevenue(monthlyData[index - 1]);
    const prevARR = calculateARR(prevRevenue);
    const currARR = calculateARR(currentRevenue);
    return { ...month, netNewARR: currARR - prevARR };
  });
};

// Styles matching the main dashboard
const styles = {
  container: {
    padding: '24px 32px',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  yearBadge: {
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#3B82F6',
  },
  dataButton: {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    backgroundColor: 'white',
    color: '#0F172A',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '20px',
  },
  overviewCardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
  },
  chartToggles: {
    display: 'flex',
    gap: '12px',
  },
  toggleGroup: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    padding: '3px',
  },
  toggleButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    color: '#0F172A',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  chartContainer: {
    width: '100%',
    marginTop: '16px',
  },
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '12px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748B',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  segmentCardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  segmentCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
  },
  segmentCardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  segmentDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
  },
  segmentMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  segmentMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentMetricLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  segmentMetricValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  segmentFilterLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  segmentFilterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    transition: 'opacity 0.2s',
  },
  segmentFilterDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  showAllButton: {
    padding: '4px 10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#F1F5F9',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    transition: 'all 0.2s',
  },
  burnMultipleCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  burnMultipleCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  burnMultiplePeriod: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  burnMultipleValue: {
    fontSize: '32px',
    fontWeight: 700,
  },
  burnMultipleRating: {
    fontSize: '13px',
    fontWeight: 600,
  },
  splitChartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    marginBottom: '24px',
  },
  splitChartSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
  },
  chartNote: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '12px',
    textAlign: 'center',
  },
  metricCardClickable: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '2px solid #E2E8F0',
    display: 'flex',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  metricAccentHorizontal: {
    width: '4px',
  },
  metricContentHorizontal: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  metricTitleHorizontal: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  metricValueHorizontal: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metricSubtitleHorizontal: {
    fontSize: '11px',
    color: '#94A3B8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
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
};

// Clickable Metric Card for Overview
function MetricCardClickable({ title, value, subtitle, accent, isSelected, onClick }) {
  return (
    <div
      style={{
        ...styles.metricCardClickable,
        ...(isSelected ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : {}),
      }}
      onClick={onClick}
    >
      <div style={{ ...styles.metricAccentHorizontal, backgroundColor: accent }}></div>
      <div style={styles.metricContentHorizontal}>
        <span style={styles.metricTitleHorizontal}>{title}</span>
        <span style={{ ...styles.metricValueHorizontal, color: accent }}>{value}</span>
        <span style={styles.metricSubtitleHorizontal}>{subtitle}</span>
      </div>
    </div>
  );
}

// Data Input Panel Component
function DataInputPanel({ monthlyData, updateMonthData }) {
  const [pasteStatus, setPasteStatus] = useState({});

  const parseExcelRow = (text) => {
    const cleaned = text.replace(/[$%,]/g, '').trim();
    const values = cleaned.split(/\t|,\s*|\s{2,}/).map(v => {
      const num = parseFloat(v.trim());
      return isNaN(num) ? null : num;
    });
    return values;
  };

  const handleCellPaste = (e, field, startIndex) => {
    const pastedText = e.clipboardData.getData('text');
    const values = parseExcelRow(pastedText);

    if (values.length > 1) {
      e.preventDefault();
      values.forEach((val, i) => {
        const targetIndex = startIndex + i;
        if (val !== null && targetIndex < 12) {
          updateMonthData(targetIndex, field, val);
        }
      });
      setPasteStatus({ [field]: { success: true, count: Math.min(values.length, 12 - startIndex) } });
      setTimeout(() => setPasteStatus({}), 2000);
    }
  };

  const handleClearRow = (field) => {
    MONTHS.forEach((_, index) => {
      updateMonthData(index, field, field === 'nps' ? null : 0);
    });
  };

  const metrics = [
    { key: 'smbRevenue', label: 'SMB Revenue', format: 'currency' },
    { key: 'enterpriseRevenue', label: 'Enterprise Revenue', format: 'currency' },
    { key: 'bancoAztecaRevenue', label: 'Banco Azteca Revenue', format: 'currency' },
    { key: 'smbAccounts', label: 'SMB Accounts', format: 'number' },
    { key: 'enterpriseAccounts', label: 'Enterprise Accounts', format: 'number' },
    { key: 'nps', label: 'NPS Score', format: 'nps' },
    { key: 'burn', label: 'Cash Burn', format: 'currency' },
    { key: 'grossMarginPct', label: 'Gross Margin %', format: 'percent' },
  ];

  return (
    <div style={styles.dataInputPanel}>
      <div style={styles.dataInputHeader}>
        <h2 style={styles.dataInputTitle}>Monthly Data Input - 2025</h2>
        <p style={styles.dataInputSubtitle}>
          Type values directly, or copy a row from Excel and paste into any cell - values will fill across automatically.
        </p>
      </div>

      <div style={styles.gridTableWrapper}>
        <table style={styles.gridTable}>
          <thead>
            <tr>
              <th style={styles.gridHeaderMetric}>Metric</th>
              {MONTHS.map(month => (
                <th key={month} style={styles.gridHeaderMonth}>{month}</th>
              ))}
              <th style={styles.gridHeaderAction}></th>
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
                  const rawValue = metric.key === 'nps'
                    ? monthlyData[monthIndex].nps
                    : monthlyData[monthIndex][metric.key];

                  const displayValue = (rawValue !== null && rawValue !== undefined && rawValue !== '' && rawValue !== 0)
                    ? (metric.format === 'percent'
                        ? String(rawValue)
                        : Number(rawValue).toLocaleString('en-US'))
                    : '';

                  return (
                    <td key={month} style={styles.gridInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        style={styles.gridInput}
                        value={displayValue}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9.-]/g, '');
                          const val = metric.key === 'nps' && cleaned === ''
                            ? null
                            : cleaned;
                          updateMonthData(monthIndex, metric.key, val);
                        }}
                        onPaste={(e) => handleCellPaste(e, metric.key, monthIndex)}
                        placeholder={metric.key === 'nps' ? '-' : '0'}
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
                    x
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
          <strong>Enterprise Accounts</strong> excludes Banco Azteca
        </p>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection({ monthlyData, quarterlyData, yearlyData, currentARR, yearlyBurnMultiple }) {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewPeriod, setViewPeriod] = useState('month');

  const decemberData = monthlyData[11] || {};
  const decemberSMB = parseFloat(decemberData.smbAccounts) || 0;
  const decemberEnterprise = parseFloat(decemberData.enterpriseAccounts) || 0;
  const totalAccounts = decemberSMB + decemberEnterprise + 1;
  const decemberNPS = (decemberData.nps !== null && decemberData.nps !== undefined && decemberData.nps !== '') ? parseFloat(decemberData.nps) : null;

  const getChartData = () => {
    if (viewPeriod === 'month') {
      return monthlyData.map((m, i) => {
        const totalRev = getTotalRevenue(m);
        const prevTotalRev = i > 0 ? getTotalRevenue(monthlyData[i-1]) : 0;
        return {
          label: m.month,
          revenue: totalRev,
          arr: totalRev * 12,
          accounts: (parseFloat(m.smbAccounts) || 0) + (parseFloat(m.enterpriseAccounts) || 0),
          smbAccounts: parseFloat(m.smbAccounts) || 0,
          enterpriseAccounts: parseFloat(m.enterpriseAccounts) || 0,
          nps: m.nps !== null && m.nps !== '' ? parseFloat(m.nps) : null,
          burnMultiple: totalRev > prevTotalRev && parseFloat(m.burn) > 0
            ? parseFloat(m.burn) / ((totalRev - prevTotalRev) * 12)
            : null,
        };
      });
    } else {
      return quarterlyData.map((q, i) => {
        const lastMonthData = monthlyData[(i + 1) * 3 - 1];
        const lastMonthTotalRev = getTotalRevenue(lastMonthData);
        const prevQuarterLastMonthRev = i > 0 ? getTotalRevenue(monthlyData[i * 3 - 1]) : 0;
        const quarterNetNewARR = (lastMonthTotalRev - prevQuarterLastMonthRev) * 12;
        return {
          label: q.quarter,
          revenue: (parseFloat(q.smbRevenue) || 0) + (parseFloat(q.enterpriseRevenue) || 0) + (parseFloat(q.bancoAztecaRevenue) || 0),
          arr: lastMonthTotalRev * 12,
          accounts: (parseFloat(q.smbAccounts) || 0) + (parseFloat(q.enterpriseAccounts) || 0),
          smbAccounts: parseFloat(q.smbAccounts) || 0,
          enterpriseAccounts: parseFloat(q.enterpriseAccounts) || 0,
          nps: q.nps,
          burnMultiple: quarterNetNewARR > 0 ? q.burn / quarterNetNewARR : null,
        };
      });
    }
  };

  const chartData = getChartData();

  const getChartConfig = () => {
    switch (selectedMetric) {
      case 'revenue':
        return { title: 'Revenue', dataKey: 'revenue', color: '#10B981', formatter: (v) => formatCurrency(v, true) };
      case 'arr':
        return { title: 'Annualized Run Rate (ARR)', dataKey: 'arr', color: '#3B82F6', formatter: (v) => formatCurrency(v, true) };
      case 'accounts':
        return { title: 'Total Accounts', dataKey: 'accounts', color: '#8B5CF6', formatter: (v) => formatNumber(v), stacked: true };
      case 'nps':
        return { title: 'Net Promoter Score', dataKey: 'nps', color: '#F59E0B', formatter: (v) => v !== null ? v : '-', domain: [-100, 100] };
      case 'burnMultiple':
        return { title: 'Burn Multiple', dataKey: 'burnMultiple', color: '#EF4444', formatter: (v) => v !== null ? v.toFixed(2) + 'x' : '-', domain: [0, 'auto'] };
      default:
        return { title: 'Revenue', dataKey: 'revenue', color: '#10B981', formatter: (v) => formatCurrency(v, true) };
    }
  };

  const chartConfig = getChartConfig();

  const cards = [
    { id: 'revenue', title: 'Annual Revenue', value: formatCurrency(yearlyData.totalRevenue, true), subtitle: '2025 Total', accent: '#10B981' },
    { id: 'arr', title: 'ARR', value: formatCurrency(currentARR, true), subtitle: '2025 EOY', accent: '#3B82F6' },
    { id: 'accounts', title: 'Total Accounts', value: formatNumber(totalAccounts), subtitle: `${formatNumber(decemberSMB)} SMB | ${formatNumber(decemberEnterprise)} Ent | 1 BA`, accent: '#8B5CF6' },
    { id: 'nps', title: 'NPS', value: decemberNPS !== null ? decemberNPS : '-', subtitle: decemberNPS !== null ? (decemberNPS >= 70 ? 'Excellent' : decemberNPS >= 50 ? 'Great' : decemberNPS >= 30 ? 'Good' : 'Needs Work') : '-', accent: decemberNPS !== null ? (decemberNPS >= 50 ? '#10B981' : decemberNPS >= 0 ? '#F59E0B' : '#EF4444') : '#9CA3AF' },
    { id: 'burnMultiple', title: 'Burn Multiple', value: yearlyBurnMultiple !== null ? yearlyBurnMultiple.toFixed(2) + 'x' : '-', subtitle: yearlyBurnMultiple !== null ? (yearlyBurnMultiple <= 1.5 ? 'Great' : yearlyBurnMultiple <= 2.5 ? 'Good' : 'High') : '-', accent: yearlyBurnMultiple !== null ? (yearlyBurnMultiple <= 1.5 ? '#10B981' : yearlyBurnMultiple <= 2.5 ? '#F59E0B' : '#EF4444') : '#9CA3AF' },
  ];

  return (
    <div>
      <h2 style={styles.sectionTitle}>2025 Business Overview</h2>

      <div style={styles.chartSection}>
        <div style={styles.chartHeaderRow}>
          <h3 style={styles.chartTitle}>{chartConfig.title}</h3>
          <div style={styles.chartToggles}>
            <div style={styles.toggleGroup}>
              <button style={{ ...styles.toggleButton, ...(viewPeriod === 'month' ? styles.toggleButtonActive : {}) }} onClick={() => setViewPeriod('month')}>Monthly</button>
              <button style={{ ...styles.toggleButton, ...(viewPeriod === 'quarter' ? styles.toggleButtonActive : {}) }} onClick={() => setViewPeriod('quarter')}>Quarterly</button>
            </div>
          </div>
        </div>
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={280}>
            {selectedMetric === 'accounts' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <Tooltip contentStyle={styles.tooltip} />
                <Bar dataKey="smbAccounts" name="SMB" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="enterpriseAccounts" name="Enterprise" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={selectedMetric === 'revenue' || selectedMetric === 'arr' ? (v) => formatCurrency(v, true) : selectedMetric === 'burnMultiple' ? (v) => v + 'x' : undefined}
                  domain={chartConfig.domain}
                />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [chartConfig.formatter(value), chartConfig.title]} />
                <Bar dataKey={chartConfig.dataKey} fill={chartConfig.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {selectedMetric === 'accounts' && (
          <div style={styles.legend}>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#3B82F6' }}></span> SMB</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#10B981' }}></span> Enterprise</span>
          </div>
        )}
      </div>

      <div style={styles.overviewCardsRow}>
        {cards.map(card => (
          <MetricCardClickable
            key={card.id}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            accent={card.accent}
            isSelected={selectedMetric === card.id}
            onClick={() => setSelectedMetric(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Revenue & Customers Section
function RevenueCustomersSection({ monthlyData, quarterlyData, yearlyData }) {
  const [viewMode, setViewMode] = useState('revenue');
  const [viewPeriod, setViewPeriod] = useState('month');
  const [selectedSegments, setSelectedSegments] = useState(['smb', 'enterprise', 'bancoAzteca']);

  const toggleSegment = (segment) => {
    setSelectedSegments(prev => {
      if (prev.includes(segment)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== segment);
      } else {
        return [...prev, segment];
      }
    });
  };

  const selectAllSegments = () => {
    setSelectedSegments(['smb', 'enterprise', 'bancoAzteca']);
  };

  const monthlyChartData = monthlyData.map(m => {
    const smbRev = parseFloat(m.smbRevenue) || 0;
    const entRev = parseFloat(m.enterpriseRevenue) || 0;
    const bazRev = parseFloat(m.bancoAztecaRevenue) || 0;
    const smbAcc = parseFloat(m.smbAccounts) || 0;
    const entAcc = parseFloat(m.enterpriseAccounts) || 0;
    return {
      label: m.month,
      smbRevenue: smbRev,
      enterpriseRevenue: entRev,
      bancoAztecaRevenue: bazRev,
      totalRevenue: smbRev + entRev + bazRev,
      smbAccounts: smbAcc,
      enterpriseAccounts: entAcc,
      bancoAztecaAccounts: 1,
      totalAccounts: smbAcc + entAcc + 1,
      arpaSMB: smbAcc > 0 ? smbRev / smbAcc : 0,
      arpaEnterprise: entAcc > 0 ? entRev / entAcc : 0,
      arpaBancoAzteca: bazRev,
    };
  });

  const quarterlyChartData = quarterlyData.map((q) => {
    const smbRev = parseFloat(q.smbRevenue) || 0;
    const entRev = parseFloat(q.enterpriseRevenue) || 0;
    const bazRev = parseFloat(q.bancoAztecaRevenue) || 0;
    const smbAcc = parseFloat(q.smbAccounts) || 0;
    const entAcc = parseFloat(q.enterpriseAccounts) || 0;
    return {
      label: q.quarter,
      smbRevenue: smbRev,
      enterpriseRevenue: entRev,
      bancoAztecaRevenue: bazRev,
      totalRevenue: smbRev + entRev + bazRev,
      smbAccounts: smbAcc,
      enterpriseAccounts: entAcc,
      bancoAztecaAccounts: 1,
      totalAccounts: smbAcc + entAcc + 1,
      arpaSMB: smbAcc > 0 ? (smbRev / 3) / smbAcc : 0,
      arpaEnterprise: entAcc > 0 ? (entRev / 3) / entAcc : 0,
      arpaBancoAzteca: bazRev / 3,
    };
  });

  const chartData = viewPeriod === 'month' ? monthlyChartData : quarterlyChartData;

  const yearlyARPASMB = yearlyData.smbAccounts > 0 ? (yearlyData.smbRevenue / 12) / yearlyData.smbAccounts : 0;
  const yearlyARPAEnterprise = yearlyData.enterpriseAccounts > 0 ? (yearlyData.enterpriseRevenue / 12) / yearlyData.enterpriseAccounts : 0;
  const yearlyARPABancoAzteca = yearlyData.bancoAztecaRevenue / 12;

  const showingAll = selectedSegments.length === 3;
  const showingSMB = selectedSegments.includes('smb');
  const showingEnterprise = selectedSegments.includes('enterprise');
  const showingBancoAzteca = selectedSegments.includes('bancoAzteca');

  return (
    <div>
      <h2 style={styles.sectionTitle}>Revenue & Customers</h2>

      <div style={styles.chartSection}>
        <div style={styles.chartHeaderRow}>
          <h3 style={styles.chartTitle}>
            {viewMode === 'revenue' ? 'Revenue by Segment' : viewMode === 'accounts' ? 'Accounts by Segment' : 'Average Revenue Per Account (ARPA)'}
          </h3>
          <div style={styles.chartToggles}>
            <div style={styles.toggleGroup}>
              <button style={{ ...styles.toggleButton, ...(viewMode === 'revenue' ? styles.toggleButtonActive : {}) }} onClick={() => setViewMode('revenue')}>Revenue</button>
              <button style={{ ...styles.toggleButton, ...(viewMode === 'accounts' ? styles.toggleButtonActive : {}) }} onClick={() => setViewMode('accounts')}>Accounts</button>
              <button style={{ ...styles.toggleButton, ...(viewMode === 'arpa' ? styles.toggleButtonActive : {}) }} onClick={() => setViewMode('arpa')}>ARPA</button>
            </div>
            <div style={styles.toggleGroup}>
              <button style={{ ...styles.toggleButton, ...(viewPeriod === 'month' ? styles.toggleButtonActive : {}) }} onClick={() => setViewPeriod('month')}>Monthly</button>
              <button style={{ ...styles.toggleButton, ...(viewPeriod === 'quarter' ? styles.toggleButtonActive : {}) }} onClick={() => setViewPeriod('quarter')}>Quarterly</button>
            </div>
          </div>
        </div>
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            {viewMode === 'revenue' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => formatCurrency(v, true)} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [formatCurrency(value, true), '']} />
                {showingSMB && <Bar dataKey="smbRevenue" name="SMB" stackId={showingAll ? "a" : undefined} fill="#3B82F6" radius={!showingAll || (!showingEnterprise && !showingBancoAzteca) ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="enterpriseRevenue" name="Enterprise" stackId={showingAll ? "a" : undefined} fill="#10B981" radius={!showingAll || !showingBancoAzteca ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingBancoAzteca && <Bar dataKey="bancoAztecaRevenue" name="Banco Azteca" stackId={showingAll ? "a" : undefined} fill="#F59E0B" radius={[4, 4, 0, 0]} />}
              </BarChart>
            ) : viewMode === 'accounts' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <Tooltip contentStyle={styles.tooltip} />
                {showingSMB && <Bar dataKey="smbAccounts" name="SMB" stackId={showingSMB && showingEnterprise ? "a" : undefined} fill="#3B82F6" radius={!showingEnterprise ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="enterpriseAccounts" name="Enterprise" stackId={showingSMB && showingEnterprise ? "a" : undefined} fill="#10B981" radius={[4, 4, 0, 0]} />}
              </BarChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => formatCurrency(v, true)} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [formatCurrency(value, true), '']} />
                {showingSMB && <Bar dataKey="arpaSMB" name="SMB ARPA" fill="#3B82F6" radius={[4, 4, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="arpaEnterprise" name="Enterprise ARPA" fill="#10B981" radius={[4, 4, 0, 0]} />}
                {showingBancoAzteca && <Bar dataKey="arpaBancoAzteca" name="Banco Azteca" fill="#F59E0B" radius={[4, 4, 0, 0]} />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div style={styles.segmentFilterLegend}>
          <button style={{ ...styles.segmentFilterButton, opacity: showingSMB ? 1 : 0.4 }} onClick={() => toggleSegment('smb')}>
            <span style={{ ...styles.segmentFilterDot, backgroundColor: '#3B82F6' }}></span> SMB
          </button>
          <button style={{ ...styles.segmentFilterButton, opacity: showingEnterprise ? 1 : 0.4 }} onClick={() => toggleSegment('enterprise')}>
            <span style={{ ...styles.segmentFilterDot, backgroundColor: '#10B981' }}></span> Enterprise
          </button>
          {viewMode !== 'accounts' && (
            <button style={{ ...styles.segmentFilterButton, opacity: showingBancoAzteca ? 1 : 0.4 }} onClick={() => toggleSegment('bancoAzteca')}>
              <span style={{ ...styles.segmentFilterDot, backgroundColor: '#F59E0B' }}></span> Banco Azteca
            </button>
          )}
          {!showingAll && (
            <button style={styles.showAllButton} onClick={selectAllSegments}>Show All</button>
          )}
        </div>
      </div>

      <div style={styles.segmentCardsRow}>
        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#3B82F6' }}></span> SMB
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Revenue</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.smbRevenue, true)}</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Accounts</span><span style={styles.segmentMetricValue}>{formatNumber(yearlyData.smbAccounts)}</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Avg ARPA</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPASMB, true)}/mo</span></div>
          </div>
        </div>

        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#10B981' }}></span> Enterprise
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Revenue</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.enterpriseRevenue, true)}</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Accounts</span><span style={styles.segmentMetricValue}>{formatNumber(yearlyData.enterpriseAccounts)}</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Avg ARPA</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPAEnterprise, true)}/mo</span></div>
          </div>
        </div>

        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#F59E0B' }}></span> Banco Azteca
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Revenue</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.bancoAztecaRevenue, true)}</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Accounts</span><span style={styles.segmentMetricValue}>1</span></div>
            <div style={styles.segmentMetric}><span style={styles.segmentMetricLabel}>Monthly Rev</span><span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPABancoAzteca, true)}/mo</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NPS Section
function NPSSection({ monthlyData }) {
  const monthlyNPS = monthlyData.map(m => ({
    month: m.month,
    nps: m.nps !== null && m.nps !== '' ? parseFloat(m.nps) : null,
  }));

  return (
    <div>
      <h2 style={styles.sectionTitle}>Net Promoter Score (NPS)</h2>

      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>Monthly NPS</h3>
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={monthlyNPS}>
              <defs>
                <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis domain={[-100, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <Tooltip contentStyle={styles.tooltip} formatter={(value) => [value !== null ? value : 'No Data', 'NPS']} />
              <Area type="monotone" dataKey="nps" fill="url(#npsGradient)" stroke="none" connectNulls />
              <Line type="monotone" dataKey="nps" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Capital Efficiency Section
function EfficiencySection({ monthlyData, yearlyData, yearlyBurnMultiple }) {
  const getBurnMultipleColor = (bm) => {
    if (bm === null) return '#9CA3AF';
    if (bm <= 1) return '#10B981';
    if (bm <= 1.5) return '#34D399';
    if (bm <= 2) return '#F59E0B';
    if (bm <= 3) return '#FB923C';
    return '#EF4444';
  };

  const getBurnMultipleLabel = (bm) => {
    if (bm === null) return 'N/A';
    if (bm <= 1) return 'Amazing';
    if (bm <= 1.5) return 'Great';
    if (bm <= 2) return 'Good';
    if (bm <= 3) return 'Mediocre';
    return 'Bad';
  };

  const calcPeriodBurnMultiple = (numMonths) => {
    const startIdx = 12 - numMonths;
    const periodMonths = monthlyData.slice(startIdx);
    const totalBurn = periodMonths.reduce((sum, m) => sum + (parseFloat(m.burn) || 0), 0);
    const lastMonthRev = getTotalRevenue(periodMonths[periodMonths.length - 1]);
    const prevMonthRev = startIdx > 0 ? getTotalRevenue(monthlyData[startIdx - 1]) : 0;
    const netNewARR = (lastMonthRev - prevMonthRev) * 12;
    return netNewARR > 0 ? totalBurn / netNewARR : null;
  };

  const burnMultiple12M = yearlyBurnMultiple;
  const burnMultiple6M = calcPeriodBurnMultiple(6);
  const burnMultiple3M = calcPeriodBurnMultiple(3);
  const burnMultiple1M = calcPeriodBurnMultiple(1);

  const monthlyChartData = monthlyData.map((m) => {
    const totalRev = getTotalRevenue(m);
    const grossMarginPct = parseFloat(m.grossMarginPct) || 0;
    const grossProfit = totalRev * (grossMarginPct / 100);
    return { month: m.month, grossMargin: grossMarginPct, grossProfit: grossProfit, revenue: totalRev };
  });

  return (
    <div>
      <h2 style={styles.sectionTitle}>Capital Efficiency</h2>

      <div style={styles.splitChartRow}>
        <div style={styles.splitChartSection}>
          <h3 style={styles.chartTitle}>Gross Margin %</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => v + '%'} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [value != null ? value.toFixed(1) + '%' : '-', 'Gross Margin']} />
                <Area type="monotone" dataKey="grossMargin" fill="url(#marginGradient)" stroke="none" />
                <Line type="monotone" dataKey="grossMargin" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.splitChartSection}>
          <h3 style={styles.chartTitle}>Gross Profit</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => formatCurrency(v, true)} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [formatCurrency(value, true), 'Gross Profit']} />
                <Bar dataKey="grossProfit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>Burn Multiple by Period</h3>
        <div style={styles.burnMultipleCards}>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>12 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple12M) }}>{burnMultiple12M !== null ? burnMultiple12M.toFixed(2) + 'x' : '-'}</span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple12M) }}>{getBurnMultipleLabel(burnMultiple12M)}</span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>6 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple6M) }}>{burnMultiple6M !== null ? burnMultiple6M.toFixed(2) + 'x' : '-'}</span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple6M) }}>{getBurnMultipleLabel(burnMultiple6M)}</span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>3 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple3M) }}>{burnMultiple3M !== null ? burnMultiple3M.toFixed(2) + 'x' : '-'}</span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple3M) }}>{getBurnMultipleLabel(burnMultiple3M)}</span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>1 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple1M) }}>{burnMultiple1M !== null ? burnMultiple1M.toFixed(2) + 'x' : '-'}</span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple1M) }}>{getBurnMultipleLabel(burnMultiple1M)}</span>
          </div>
        </div>
        <p style={styles.chartNote}>Lower is better. &lt;1x = Amazing, 1-1.5x = Great, 1.5-2x = Good, 2-3x = Mediocre, &gt;3x = Bad</p>
      </div>
    </div>
  );
}

// Main WBR Tab Component
export default function WBRTab() {
  const [activeSection, setActiveSection] = useState('overview');
  const [showDataInput, setShowDataInput] = useState(false);
  const [monthlyData, setMonthlyData] = useState(() => {
    const saved = localStorage.getItem('gail-wbr-data-2025-v2');
    return saved ? JSON.parse(saved) : createEmptyMonthlyData();
  });

  useEffect(() => {
    localStorage.setItem('gail-wbr-data-2025-v2', JSON.stringify(monthlyData));
  }, [monthlyData]);

  const quarterlyData = aggregateToQuarters(monthlyData);
  const yearlyData = aggregateToYear(monthlyData);
  const monthlyWithNetNewARR = calculateNetNewARR(monthlyData);

  const latestMonthWithRevenue = [...monthlyData].reverse().find(m => getTotalRevenue(m) > 0);
  const currentARR = latestMonthWithRevenue ? calculateARR(getTotalRevenue(latestMonthWithRevenue)) : 0;

  const yearlyNetNewARR = currentARR - STARTING_ARR;
  const yearlyBurnMultiple = yearlyNetNewARR > 0 ? yearlyData.burn / yearlyNetNewARR : null;

  const updateMonthData = (monthIndex, field, value) => {
    setMonthlyData(prev => {
      const updated = [...prev];
      updated[monthIndex] = { ...updated[monthIndex], [field]: value };
      return updated;
    });
  };

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'revenueCustomers', label: 'Revenue & Customers' },
    { id: 'nps', label: 'NPS' },
    { id: 'efficiency', label: 'Capital Efficiency' },
  ];

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={styles.header}>
          <h1 style={styles.title}>Weekly Business Review</h1>
          <p style={styles.subtitle}>FY 2025 Performance Metrics</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.yearBadge}>FY 2025</span>
          <button style={styles.dataButton} onClick={() => setShowDataInput(!showDataInput)}>
            {showDataInput ? 'Back to Dashboard' : 'Edit Data'}
          </button>
        </div>
      </div>

      {!showDataInput && (
        <nav style={styles.nav}>
          {sections.map(section => (
            <button
              key={section.id}
              style={{ ...styles.navButton, ...(activeSection === section.id ? styles.navButtonActive : {}) }}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      )}

      {showDataInput ? (
        <DataInputPanel monthlyData={monthlyData} updateMonthData={updateMonthData} />
      ) : (
        <>
          {activeSection === 'overview' && (
            <OverviewSection
              monthlyData={monthlyData}
              quarterlyData={quarterlyData}
              yearlyData={yearlyData}
              currentARR={currentARR}
              yearlyBurnMultiple={yearlyBurnMultiple}
            />
          )}
          {activeSection === 'revenueCustomers' && (
            <RevenueCustomersSection
              monthlyData={monthlyData}
              quarterlyData={quarterlyData}
              yearlyData={yearlyData}
            />
          )}
          {activeSection === 'nps' && (
            <NPSSection monthlyData={monthlyData} />
          )}
          {activeSection === 'efficiency' && (
            <EfficiencySection
              monthlyData={monthlyData}
              yearlyData={yearlyData}
              yearlyBurnMultiple={yearlyBurnMultiple}
            />
          )}
        </>
      )}
    </div>
  );
}
