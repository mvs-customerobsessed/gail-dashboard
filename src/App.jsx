import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Users, ThumbsUp, TrendingUp, Calendar, FileText, DollarSign, Settings, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Zap, LogOut, User } from 'lucide-react';
import ReportingTab from './components/ReportingTab';
import SalesTab from './components/SalesTab';
import ActivationTab from './components/ActivationTab';
import { useAuthContext } from './components/auth/AuthProvider';
import { useRole } from './hooks/useRole';
import { useWBRData } from './hooks/useWBRData';

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
  if (value === null || value === undefined) return '—';
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
  if (value === null || value === undefined) return '—';
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

// Main Dashboard Component
export default function WBRDashboard() {
  // Auth and role hooks
  const { user, profile, signOut } = useAuthContext();
  const { canEdit } = useRole();

  // WBR data from Supabase
  const {
    monthlyData2025: monthlyData,
    monthlyData2026Base,
    monthlyData2026Upside,
    setMonthlyData2025: setMonthlyData,
    setMonthlyData2026Base,
    setMonthlyData2026Upside,
    updateMonthData2025: updateMonthData,
    updateMonthData2026Base,
    updateMonthData2026Upside,
    loading: dataLoading,
    showMigrationPrompt,
    migrateLocalData,
    skipMigration,
    saveAllData,
  } = useWBRData();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDataInput, setShowDataInput] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [businessOverviewExpanded, setBusinessOverviewExpanded] = useState(true);
  const [outlook2026Expanded, setOutlook2026Expanded] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

  const quarterlyData = aggregateToQuarters(monthlyData);
  const yearlyData = aggregateToYear(monthlyData);
  const monthlyWithNetNewARR = calculateNetNewARR(monthlyData);

  // Calculate burn multiple for each period
  const monthlyBurnMultiple = monthlyWithNetNewARR.map(m => ({
    ...m,
    burnMultiple: m.netNewARR > 0 ? (parseFloat(m.burn) || 0) / m.netNewARR : null,
  }));

  const quarterlyBurnMultiple = quarterlyData.map((q, qIndex) => {
    const startMonth = qIndex * 3;
    const endMonth = startMonth + 3;
    const quarterNetNewARR = monthlyWithNetNewARR.slice(startMonth, endMonth).reduce((sum, m) => sum + m.netNewARR, 0);
    return {
      ...q,
      netNewARR: quarterNetNewARR,
      burnMultiple: quarterNetNewARR > 0 ? q.burn / quarterNetNewARR : null,
    };
  });

  // Get latest month's ARR for display
  const latestMonthWithRevenue = [...monthlyData].reverse().find(m => getTotalRevenue(m) > 0);
  const currentARR = latestMonthWithRevenue ? calculateARR(getTotalRevenue(latestMonthWithRevenue)) : 0;

  // Calculate yearly burn multiple using starting ARR
  const yearlyNetNewARR = currentARR - STARTING_ARR;
  const yearlyBurnMultiple = yearlyNetNewARR > 0 ? yearlyData.burn / yearlyNetNewARR : null;

  // 2026 Base Case calculations
  const quarterlyData2026Base = aggregateToQuarters(monthlyData2026Base);
  const yearlyData2026Base = aggregateToYear(monthlyData2026Base);
  const latestMonthWithRevenue2026Base = [...monthlyData2026Base].reverse().find(m => getTotalRevenue(m) > 0);
  const currentARR2026Base = latestMonthWithRevenue2026Base ? calculateARR(getTotalRevenue(latestMonthWithRevenue2026Base)) : 0;
  const yearlyNetNewARR2026Base = currentARR2026Base - currentARR;
  const yearlyBurnMultiple2026Base = yearlyNetNewARR2026Base > 0 ? yearlyData2026Base.burn / yearlyNetNewARR2026Base : null;

  // 2026 Upside Case calculations
  const quarterlyData2026Upside = aggregateToQuarters(monthlyData2026Upside);
  const yearlyData2026Upside = aggregateToYear(monthlyData2026Upside);
  const latestMonthWithRevenue2026Upside = [...monthlyData2026Upside].reverse().find(m => getTotalRevenue(m) > 0);
  const currentARR2026Upside = latestMonthWithRevenue2026Upside ? calculateARR(getTotalRevenue(latestMonthWithRevenue2026Upside)) : 0;
  const yearlyNetNewARR2026Upside = currentARR2026Upside - currentARR;
  const yearlyBurnMultiple2026Upside = yearlyNetNewARR2026Upside > 0 ? yearlyData2026Upside.burn / yearlyNetNewARR2026Upside : null;

  // Export data to JSON file (download)
  const exportData = () => {
    const data = {
      monthlyData2025: monthlyData,
      monthlyData2026Base: monthlyData2026Base,
      monthlyData2026Upside: monthlyData2026Upside,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.monthlyData2025) {
          setMonthlyData(data.monthlyData2025);
        }
        if (data.monthlyData2026Base) {
          setMonthlyData2026Base(data.monthlyData2026Base);
        }
        if (data.monthlyData2026Upside) {
          setMonthlyData2026Upside(data.monthlyData2026Upside);
        }
        // Save to Supabase
        await saveAllData();
        alert('Data imported and saved successfully!');
      } catch (err) {
        alert('Error importing data: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Menu structure
  const menuItems = [
    {
      id: 'business-2025',
      label: '2025 Overview',
      icon: BarChart3,
      defaultTab: 'overview',
      children: [
        { id: 'revenueCustomers', label: 'Revenue & Customers', icon: Users },
        { id: 'nps', label: 'NPS', icon: ThumbsUp },
        { id: 'efficiency', label: 'Capital Efficiency', icon: TrendingUp },
      ]
    },
    {
      id: 'outlook2026',
      label: '2026 Outlook',
      icon: Calendar,
      defaultTab: 'outlook2026-base',
      children: [
        { id: 'outlook2026-base', label: 'Base Case', icon: LineChartIcon },
        { id: 'outlook2026-upside', label: 'Upside Case', icon: TrendingUp },
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting',
      icon: FileText,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: DollarSign,
    },
    {
      id: 'activation',
      label: 'Activation',
      icon: Zap,
    }
  ];

  return (
    <div style={styles.appContainer}>
      {/* Side Menu */}
      <aside style={{...styles.sidebar, width: menuCollapsed ? '64px' : '208px'}}>
        {/* Logo Section */}
        <div style={styles.sidebarLogo}>
          {!menuCollapsed ? (
            <>
              <img src="/gail-logo.png" alt="Gail" style={styles.logoImage} />
              <button
                style={{
                  ...styles.collapseButton,
                  padding: '6px',
                  marginLeft: 'auto',
                  width: 'auto',
                }}
                onClick={() => setMenuCollapsed(!menuCollapsed)}
                title="Collapse menu"
              >
                <span style={{fontSize: '16px', color: '#666'}}>←</span>
              </button>
            </>
          ) : (
            <div style={styles.logoCollapsed}>G</div>
          )}
        </div>

        {/* Menu Items */}
        <nav style={styles.sidebarNav}>
          {menuItems.map(item => (
            <div key={item.id}>
              {item.children ? (
                // Parent menu item with children
                <>
                  <button
                    style={{
                      ...styles.sectionHeader,
                      justifyContent: menuCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={() => {
                      if (item.id === 'business-2025') {
                        const newExpanded = !businessOverviewExpanded;
                        setBusinessOverviewExpanded(newExpanded);
                        if (newExpanded) {
                          setOutlook2026Expanded(false);
                          setActiveTab(item.defaultTab || 'overview');
                          setShowDataInput(false);
                        }
                      } else if (item.id === 'outlook2026') {
                        const newExpanded = !outlook2026Expanded;
                        setOutlook2026Expanded(newExpanded);
                        if (newExpanded) {
                          setBusinessOverviewExpanded(false);
                          setActiveTab(item.defaultTab || 'outlook2026-base');
                          setShowDataInput(false);
                        }
                      }
                    }}
                    title={menuCollapsed ? item.label : undefined}
                  >
                    {item.icon && <item.icon size={18} style={styles.menuIcon} />}
                    {!menuCollapsed && (
                      <>
                        <span style={styles.menuLabel}>{item.label}</span>
                        <ChevronDown
                          size={14}
                          style={{
                            ...styles.menuChevron,
                            transform: (item.id === 'business-2025' ? businessOverviewExpanded : outlook2026Expanded) ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </>
                    )}
                  </button>
                  {((item.id === 'business-2025' && businessOverviewExpanded) || (item.id === 'outlook2026' && outlook2026Expanded)) && !menuCollapsed && (
                    <div style={styles.submenuContainer}>
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          style={{
                            ...styles.menuItem,
                            ...(activeTab === child.id ? styles.menuItemActive : {})
                          }}
                          onClick={() => { setActiveTab(child.id); setShowDataInput(false); }}
                        >
                          {child.icon && <child.icon size={16} style={styles.menuIcon} />}
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Direct menu item (no children)
                <button
                  style={{
                    ...styles.menuItem,
                    justifyContent: menuCollapsed ? 'center' : 'flex-start',
                    ...(activeTab === item.id ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab(item.id); setShowDataInput(false); }}
                  title={menuCollapsed ? item.label : undefined}
                >
                  {item.icon && <item.icon size={18} style={styles.menuIcon} />}
                  {!menuCollapsed && <span style={styles.menuLabel}>{item.label}</span>}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div style={styles.sidebarBottom}>
          {canEdit && (
            <button
              style={{
                ...styles.menuItem,
                justifyContent: menuCollapsed ? 'center' : 'flex-start',
                ...(hoveredMenuItem === 'edit-data' && !showDataInput ? styles.menuItemHover : {}),
                ...(showDataInput ? styles.menuItemActive : {})
              }}
              onClick={() => setShowDataInput(!showDataInput)}
              onMouseEnter={() => setHoveredMenuItem('edit-data')}
              onMouseLeave={() => setHoveredMenuItem(null)}
              title={menuCollapsed ? 'Data Entry' : undefined}
            >
              <Settings size={18} style={styles.menuIcon} />
              {!menuCollapsed && <span style={styles.menuLabel}>Data Entry</span>}
            </button>
          )}

          <button
            style={{
              ...styles.menuItem,
              justifyContent: menuCollapsed ? 'center' : 'flex-start',
              ...(hoveredMenuItem === 'help' ? styles.menuItemHover : {})
            }}
            onClick={() => {}}
            onMouseEnter={() => setHoveredMenuItem('help')}
            onMouseLeave={() => setHoveredMenuItem(null)}
            title={menuCollapsed ? 'Help & Support' : undefined}
          >
            <HelpCircle size={18} style={styles.menuIcon} />
            {!menuCollapsed && <span style={styles.menuLabel}>Help & Support</span>}
          </button>

          {/* Data Export/Import */}
          <div style={{ borderTop: '1px solid #E2E8F0', margin: '8px 0', paddingTop: '8px' }}>
            <button
              style={{
                ...styles.menuItem,
                justifyContent: menuCollapsed ? 'center' : 'flex-start',
                ...(hoveredMenuItem === 'export' ? styles.menuItemHover : {})
              }}
              onClick={exportData}
              onMouseEnter={() => setHoveredMenuItem('export')}
              onMouseLeave={() => setHoveredMenuItem(null)}
              title={menuCollapsed ? 'Export Data' : undefined}
            >
              <Download size={18} style={styles.menuIcon} />
              {!menuCollapsed && <span style={styles.menuLabel}>Export Data</span>}
            </button>

            <label
              style={{
                ...styles.menuItem,
                justifyContent: menuCollapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                ...(hoveredMenuItem === 'import' ? styles.menuItemHover : {})
              }}
              onMouseEnter={() => setHoveredMenuItem('import')}
              onMouseLeave={() => setHoveredMenuItem(null)}
              title={menuCollapsed ? 'Import Data' : undefined}
            >
              <Upload size={18} style={styles.menuIcon} />
              {!menuCollapsed && <span style={styles.menuLabel}>Import Data</span>}
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerRight}>
            {dataLoading && <span style={styles.loadingIndicator}>Loading...</span>}
            <div style={styles.userInfo}>
              <User size={16} style={{ marginRight: '6px' }} />
              <span>{profile?.full_name || user?.email}</span>
              {profile?.role && (
                <span style={styles.roleBadge}>{profile.role}</span>
              )}
            </div>
            <button onClick={signOut} style={styles.logoutButton} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Migration Prompt */}
        {showMigrationPrompt && (
          <div style={styles.migrationPrompt}>
            <div style={styles.migrationContent}>
              <h3 style={styles.migrationTitle}>Migrate Local Data</h3>
              <p style={styles.migrationText}>
                We found data saved in your browser. Would you like to migrate it to the cloud so your team can access it?
              </p>
              <div style={styles.migrationButtons}>
                <button onClick={migrateLocalData} style={styles.migrateButton}>
                  Yes, Migrate Data
                </button>
                <button onClick={skipMigration} style={styles.skipButton}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main style={styles.main}>
          {showDataInput ? (
            <DataInputPanel
              monthlyData={
                activeTab === 'outlook2026-base' ? monthlyData2026Base :
                activeTab === 'outlook2026-upside' ? monthlyData2026Upside :
                monthlyData
              }
              updateMonthData={
                activeTab === 'outlook2026-base' ? updateMonthData2026Base :
                activeTab === 'outlook2026-upside' ? updateMonthData2026Upside :
                updateMonthData
              }
              onClose={() => setShowDataInput(false)}
              year={activeTab.startsWith('outlook2026') ? 2026 : 2025}
            />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewSection
                  monthlyData={monthlyData}
                  quarterlyData={quarterlyData}
                  yearlyData={yearlyData}
                  currentARR={currentARR}
                  yearlyBurnMultiple={yearlyBurnMultiple}
                />
              )}
              {activeTab === 'revenueCustomers' && (
                <RevenueCustomersSection
                  monthlyData={monthlyData}
                  quarterlyData={quarterlyData}
                  yearlyData={yearlyData}
                />
              )}
              {activeTab === 'nps' && (
                <NPSSection
                  monthlyData={monthlyData}
                  quarterlyData={quarterlyData}
                  yearlyData={yearlyData}
                />
              )}
              {activeTab === 'efficiency' && (
                <EfficiencySection
                  monthlyData={monthlyData}
                  quarterlyData={quarterlyData}
                  yearlyData={yearlyData}
                  yearlyNetNewARR={yearlyNetNewARR}
                  yearlyBurnMultiple={yearlyBurnMultiple}
                />
              )}
              {activeTab === 'outlook2026-base' && (
                <OverviewSection
                  monthlyData={monthlyData2026Base}
                  quarterlyData={quarterlyData2026Base}
                  yearlyData={yearlyData2026Base}
                  currentARR={currentARR2026Base}
                  yearlyBurnMultiple={yearlyBurnMultiple2026Base}
                  year={2026}
                  scenarioLabel="Base Case"
                />
              )}
              {activeTab === 'outlook2026-upside' && (
                <OverviewSection
                  monthlyData={monthlyData2026Upside}
                  quarterlyData={quarterlyData2026Upside}
                  yearlyData={yearlyData2026Upside}
                  currentARR={currentARR2026Upside}
                  yearlyBurnMultiple={yearlyBurnMultiple2026Upside}
                  year={2026}
                  scenarioLabel="Upside Case"
                />
              )}
              {activeTab === 'reporting' && (
                <ReportingTab />
              )}
              {activeTab === 'sales' && (
                <SalesTab />
              )}
              {activeTab === 'activation' && (
                <ActivationTab />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <span>Gail WBR Dashboard • 2025 Annual Review</span>
        </footer>
      </div>
    </div>
  );
}

// Data Input Panel Component
function DataInputPanel({ monthlyData, updateMonthData, onClose, year = 2025 }) {
  const [pasteStatus, setPasteStatus] = useState({});

  // Parse pasted Excel row (tab or comma separated)
  const parseExcelRow = (text) => {
    const cleaned = text.replace(/[$%,]/g, '').trim();
    const values = cleaned.split(/\t|,\s*|\s{2,}/).map(v => {
      const num = parseFloat(v.trim());
      return isNaN(num) ? null : num;
    });
    return values;
  };

  // Handle paste on any cell - if multiple values, fill across the row
  const handleCellPaste = (e, field, startIndex) => {
    const pastedText = e.clipboardData.getData('text');
    const values = parseExcelRow(pastedText);

    if (values.length > 1) {
      e.preventDefault();
      // Fill across from startIndex
      values.forEach((val, i) => {
        const targetIndex = startIndex + i;
        if (val !== null && targetIndex < 12) {
          updateMonthData(targetIndex, field, val);
        }
      });
      setPasteStatus({ [field]: { success: true, count: Math.min(values.length, 12 - startIndex) } });
      setTimeout(() => setPasteStatus({}), 2000);
    }
    // If single value, let default paste behavior handle it
  };

  // Clear row
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
        <h2 style={styles.dataInputTitle}>Monthly Data Input — {year}</h2>
        <p style={styles.dataInputSubtitle}>
          Type values directly, or copy a row from Excel and paste into any cell — values will fill across automatically.
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
                      ✓ {pasteStatus[metric.key].count} values
                    </span>
                  )}
                </td>
                {MONTHS.map((month, monthIndex) => {
                  const rawValue = metric.key === 'nps' 
                    ? monthlyData[monthIndex].nps 
                    : monthlyData[monthIndex][metric.key];
                  
                  // Format display value with commas
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
                          // Remove commas and non-numeric chars (except minus and decimal)
                          const cleaned = e.target.value.replace(/[^0-9.-]/g, '');
                          const val = metric.key === 'nps' && cleaned === '' 
                            ? null 
                            : cleaned;
                          updateMonthData(monthIndex, metric.key, val);
                        }}
                        onPaste={(e) => handleCellPaste(e, metric.key, monthIndex)}
                        placeholder={metric.key === 'nps' ? '—' : '0'}
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
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.dataInputFooter}>
        <p style={styles.dataInputNote}>
          <strong>Tip:</strong> Paste an Excel row into any cell — values fill across automatically. 
          <span style={styles.noteSeparator}>•</span>
          <strong>Enterprise Accounts</strong> excludes Banco Azteca
        </p>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection({ monthlyData, quarterlyData, yearlyData, currentARR, yearlyBurnMultiple, year = 2025 }) {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewPeriod, setViewPeriod] = useState('month'); // 'month' or 'quarter'
  
  // Use December's values for accounts and NPS
  const decemberData = monthlyData[11] || {}; // December is index 11
  const decemberSMB = parseFloat(decemberData.smbAccounts) || 0;
  const decemberEnterprise = parseFloat(decemberData.enterpriseAccounts) || 0;
  const totalAccounts = decemberSMB + decemberEnterprise + 1; // +1 for Banco Azteca
  const decemberNPS = (decemberData.nps !== null && decemberData.nps !== undefined && decemberData.nps !== '') ? parseFloat(decemberData.nps) : null;

  // Prepare chart data based on selections
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
        const totalRev = (parseFloat(q.smbRevenue) || 0) + (parseFloat(q.enterpriseRevenue) || 0) + (parseFloat(q.bancoAztecaRevenue) || 0);
        const prevQuarterLastMonthRev = i > 0 ? getTotalRevenue(monthlyData[i * 3 - 1]) : 0;
        const quarterNetNewARR = (lastMonthTotalRev - prevQuarterLastMonthRev) * 12;
        return {
          label: q.quarter,
          revenue: totalRev,
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

  // Chart configuration based on selected metric
  const getChartConfig = () => {
    switch (selectedMetric) {
      case 'revenue':
        return {
          title: 'Revenue',
          dataKey: 'revenue',
          color: '#34d399',
          formatter: (v) => formatCurrency(v, true),
          domain: undefined,
        };
      case 'arr':
        return {
          title: 'Annualized Run Rate (ARR)',
          dataKey: 'arr',
          color: '#0062e2',
          formatter: (v) => formatCurrency(v, true),
          domain: undefined,
        };
      case 'accounts':
        return {
          title: 'Total Accounts',
          dataKey: 'accounts',
          color: '#b96acd',
          formatter: (v) => formatNumber(v),
          domain: undefined,
          stacked: true,
        };
      case 'nps':
        return {
          title: 'Net Promoter Score',
          dataKey: 'nps',
          color: '#ffad4d',
          formatter: (v) => v !== null ? v : '—',
          domain: [0, 100],
        };
      case 'burnMultiple':
        return {
          title: 'Burn Multiple',
          dataKey: 'burnMultiple',
          color: '#cb0004',
          formatter: (v) => v !== null ? v.toFixed(2) + 'x' : '—',
          domain: [0, 'auto'],
        };
      default:
        return {};
    }
  };

  const chartConfig = getChartConfig();

  // Card data
  const cards = [
    {
      id: 'revenue',
      title: 'Annual Revenue',
      value: formatCurrency(yearlyData.totalRevenue, true),
      subtitle: '2025 Total',
      accent: '#34d399',
    },
    {
      id: 'arr',
      title: 'ARR',
      value: formatCurrency(currentARR, true),
      subtitle: '2025 EOY',
      accent: '#0062e2',
    },
    {
      id: 'accounts',
      title: 'Total Accounts',
      value: formatNumber(totalAccounts),
      subtitle: `${formatNumber(decemberSMB)} SMB • ${formatNumber(decemberEnterprise)} Ent • 1 BA`,
      accent: '#b96acd',
    },
    {
      id: 'nps',
      title: 'NPS',
      value: decemberNPS !== null ? decemberNPS : '—',
      subtitle: decemberNPS !== null ? (decemberNPS >= 70 ? 'Excellent' : decemberNPS >= 50 ? 'Great' : decemberNPS >= 30 ? 'Good' : 'Needs Work') : '—',
      accent: decemberNPS !== null ? (decemberNPS >= 50 ? '#34d399' : decemberNPS >= 0 ? '#ffad4d' : '#cb0004') : '#9CA3AF',
    },
    {
      id: 'burnMultiple',
      title: 'Burn Multiple',
      value: yearlyBurnMultiple !== null ? yearlyBurnMultiple.toFixed(2) + 'x' : '—',
      subtitle: yearlyBurnMultiple !== null ? (yearlyBurnMultiple <= 1.5 ? 'Great' : yearlyBurnMultiple <= 2.5 ? 'Good' : 'High') : '—',
      accent: yearlyBurnMultiple !== null ? (yearlyBurnMultiple <= 1.5 ? '#34d399' : yearlyBurnMultiple <= 2.5 ? '#ffad4d' : '#cb0004') : '#9CA3AF',
    },
  ];

  return (
    <div>
      <h2 style={styles.sectionTitle}>{year === 2026 ? '2026 Outlook' : '2025 Business Overview'}</h2>
      
      {/* Chart Section */}
      <div style={styles.chartSection}>
        <div style={styles.chartHeaderRow}>
          <h3 style={styles.chartTitle}>{chartConfig.title}</h3>
          <div style={styles.chartToggles}>
            <div style={styles.toggleGroup}>
              <button
                style={{ ...styles.toggleButton, ...(viewPeriod === 'month' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewPeriod('month')}
              >
                Monthly
              </button>
              <button
                style={{ ...styles.toggleButton, ...(viewPeriod === 'quarter' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewPeriod('quarter')}
              >
                Quarterly
              </button>
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
                <Bar dataKey="smbAccounts" name="SMB" stackId="a" fill="#0062e2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="enterpriseAccounts" name="Enterprise" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
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
                <Tooltip 
                  contentStyle={styles.tooltip}
                  formatter={(value) => [chartConfig.formatter(value), chartConfig.title]}
                />
                <Bar 
                  dataKey={chartConfig.dataKey} 
                  fill={chartConfig.color} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {selectedMetric === 'accounts' && (
          <div style={styles.legend}>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#0062e2' }}></span> SMB</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#34d399' }}></span> Enterprise</span>
          </div>
        )}
      </div>

      {/* Clickable Cards Row */}
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

// Revenue & Customers Section (Combined)
function RevenueCustomersSection({ monthlyData, quarterlyData, yearlyData }) {
  const [viewMode, setViewMode] = useState('revenue'); // 'revenue', 'accounts', 'arpa'
  const [viewPeriod, setViewPeriod] = useState('month'); // 'month', 'quarter'
  const [selectedSegments, setSelectedSegments] = useState(['smb', 'enterprise', 'bancoAzteca']); // which segments to show

  // Toggle segment selection
  const toggleSegment = (segment) => {
    setSelectedSegments(prev => {
      if (prev.includes(segment)) {
        // Don't allow deselecting all segments
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== segment);
      } else {
        return [...prev, segment];
      }
    });
  };

  // Select only one segment
  const selectOnlySegment = (segment) => {
    setSelectedSegments([segment]);
  };

  // Select all segments
  const selectAllSegments = () => {
    setSelectedSegments(['smb', 'enterprise', 'bancoAzteca']);
  };

  // Prepare monthly chart data
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
      totalAccounts: smbAcc + entAcc + 1, // +1 for Banco Azteca
      arpaSMB: smbAcc > 0 ? smbRev / smbAcc : 0,
      arpaEnterprise: entAcc > 0 ? entRev / entAcc : 0,
      arpaBancoAzteca: bazRev,
    };
  });

  // Prepare quarterly chart data
  const quarterlyChartData = quarterlyData.map((q, i) => {
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
      totalAccounts: smbAcc + entAcc + 1, // +1 for Banco Azteca
      arpaSMB: smbAcc > 0 ? (smbRev / 3) / smbAcc : 0,
      arpaEnterprise: entAcc > 0 ? (entRev / 3) / entAcc : 0,
      arpaBancoAzteca: bazRev / 3,
    };
  });

  const chartData = viewPeriod === 'month' ? monthlyChartData : quarterlyChartData;

  // Calculate yearly ARPA
  const yearlyARPASMB = yearlyData.smbAccounts > 0 
    ? (yearlyData.smbRevenue / 12) / yearlyData.smbAccounts 
    : 0;
  const yearlyARPAEnterprise = yearlyData.enterpriseAccounts > 0 
    ? (yearlyData.enterpriseRevenue / 12) / yearlyData.enterpriseAccounts 
    : 0;
  const yearlyARPABancoAzteca = yearlyData.bancoAztecaRevenue / 12;

  // Check if showing all segments or filtered
  const showingAll = selectedSegments.length === 3;
  const showingSMB = selectedSegments.includes('smb');
  const showingEnterprise = selectedSegments.includes('enterprise');
  const showingBancoAzteca = selectedSegments.includes('bancoAzteca');

  return (
    <div>
      <h2 style={styles.sectionTitle}>Revenue & Customers</h2>
      
      {/* Main Chart with View Toggle - at top */}
      <div style={styles.chartSection}>
        <div style={styles.chartHeaderRow}>
          <h3 style={styles.chartTitle}>
            {viewMode === 'revenue' ? 'Revenue by Segment' : viewMode === 'accounts' ? 'Accounts by Segment' : 'Average Revenue Per Account (ARPA)'}
          </h3>
          <div style={styles.chartToggles}>
            <div style={styles.toggleGroup}>
              <button
                style={{ ...styles.toggleButton, ...(viewMode === 'revenue' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewMode('revenue')}
              >
                Revenue
              </button>
              <button
                style={{ ...styles.toggleButton, ...(viewMode === 'accounts' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewMode('accounts')}
              >
                Accounts
              </button>
              <button
                style={{ ...styles.toggleButton, ...(viewMode === 'arpa' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewMode('arpa')}
              >
                ARPA
              </button>
            </div>
            <div style={styles.toggleGroup}>
              <button
                style={{ ...styles.toggleButton, ...(viewPeriod === 'month' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewPeriod('month')}
              >
                Monthly
              </button>
              <button
                style={{ ...styles.toggleButton, ...(viewPeriod === 'quarter' ? styles.toggleButtonActive : {}) }}
                onClick={() => setViewPeriod('quarter')}
              >
                Quarterly
              </button>
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
                {showingSMB && <Bar dataKey="smbRevenue" name="SMB" stackId={showingAll ? "a" : undefined} fill="#0062e2" radius={!showingAll || (!showingEnterprise && !showingBancoAzteca) ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="enterpriseRevenue" name="Enterprise" stackId={showingAll ? "a" : undefined} fill="#34d399" radius={!showingAll || !showingBancoAzteca ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingBancoAzteca && <Bar dataKey="bancoAztecaRevenue" name="Banco Azteca" stackId={showingAll ? "a" : undefined} fill="#ffad4d" radius={[4, 4, 0, 0]} />}
              </BarChart>
            ) : viewMode === 'accounts' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <Tooltip contentStyle={styles.tooltip} />
                {showingSMB && <Bar dataKey="smbAccounts" name="SMB" stackId={showingSMB && showingEnterprise ? "a" : undefined} fill="#0062e2" radius={!showingEnterprise ? [4, 4, 0, 0] : [0, 0, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="enterpriseAccounts" name="Enterprise" stackId={showingSMB && showingEnterprise ? "a" : undefined} fill="#34d399" radius={[4, 4, 0, 0]} />}
              </BarChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => formatCurrency(v, true)} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [formatCurrency(value, true), '']} />
                {showingSMB && <Bar dataKey="arpaSMB" name="SMB ARPA" fill="#0062e2" radius={[4, 4, 0, 0]} />}
                {showingEnterprise && <Bar dataKey="arpaEnterprise" name="Enterprise ARPA" fill="#34d399" radius={[4, 4, 0, 0]} />}
                {showingBancoAzteca && <Bar dataKey="arpaBancoAzteca" name="Banco Azteca" fill="#ffad4d" radius={[4, 4, 0, 0]} />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Clickable Segment Filter Legend */}
        <div style={styles.segmentFilterLegend}>
          <button
            style={{
              ...styles.segmentFilterButton,
              opacity: showingSMB ? 1 : 0.4,
            }}
            onClick={() => toggleSegment('smb')}
            onDoubleClick={() => selectOnlySegment('smb')}
          >
            <span style={{ ...styles.segmentFilterDot, backgroundColor: '#0062e2' }}></span>
            SMB
          </button>
          <button
            style={{
              ...styles.segmentFilterButton,
              opacity: showingEnterprise ? 1 : 0.4,
            }}
            onClick={() => toggleSegment('enterprise')}
            onDoubleClick={() => selectOnlySegment('enterprise')}
          >
            <span style={{ ...styles.segmentFilterDot, backgroundColor: '#34d399' }}></span>
            Enterprise
          </button>
          {viewMode !== 'accounts' && (
            <button
              style={{
                ...styles.segmentFilterButton,
                opacity: showingBancoAzteca ? 1 : 0.4,
              }}
              onClick={() => toggleSegment('bancoAzteca')}
              onDoubleClick={() => selectOnlySegment('bancoAzteca')}
            >
              <span style={{ ...styles.segmentFilterDot, backgroundColor: '#ffad4d' }}></span>
              Banco Azteca
            </button>
          )}
          {!showingAll && (
            <button
              style={styles.showAllButton}
              onClick={selectAllSegments}
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Segment Breakdown Cards - below chart */}
      <div style={styles.segmentCardsRow}>
        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#0062e2' }}></span>
            SMB
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Revenue</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.smbRevenue, true)}</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Accounts</span>
              <span style={styles.segmentMetricValue}>{formatNumber(yearlyData.smbAccounts)}</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Avg ARPA</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPASMB, true)}/mo</span>
            </div>
          </div>
        </div>

        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#34d399' }}></span>
            Enterprise
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Revenue</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.enterpriseRevenue, true)}</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Accounts</span>
              <span style={styles.segmentMetricValue}>{formatNumber(yearlyData.enterpriseAccounts)}</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Avg ARPA</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPAEnterprise, true)}/mo</span>
            </div>
          </div>
        </div>

        <div style={styles.segmentCard}>
          <h4 style={styles.segmentCardTitle}>
            <span style={{ ...styles.segmentDot, backgroundColor: '#ffad4d' }}></span>
            Banco Azteca
          </h4>
          <div style={styles.segmentMetrics}>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Revenue</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyData.bancoAztecaRevenue, true)}</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Accounts</span>
              <span style={styles.segmentMetricValue}>1</span>
            </div>
            <div style={styles.segmentMetric}>
              <span style={styles.segmentMetricLabel}>Monthly Rev</span>
              <span style={styles.segmentMetricValue}>{formatCurrency(yearlyARPABancoAzteca, true)}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NPS Section
function NPSSection({ monthlyData, quarterlyData, yearlyData }) {
  const monthlyNPS = monthlyData.map(m => ({
    month: m.month,
    nps: m.nps !== null && m.nps !== '' ? parseFloat(m.nps) : null,
  }));

  return (
    <div>
      <h2 style={styles.sectionTitle}>Net Promoter Score (NPS)</h2>
      
      {/* NPS Trend */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>Monthly NPS</h3>
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={monthlyNPS}>
              <defs>
                <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffad4d" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#ffad4d" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <Tooltip contentStyle={styles.tooltip} formatter={(value) => [value !== null ? value : 'No Data', 'NPS']} />
              <Area type="monotone" dataKey="nps" fill="url(#npsGradient)" stroke="none" connectNulls />
              <Line type="monotone" dataKey="nps" stroke="#ffad4d" strokeWidth={3} dot={{ fill: '#ffad4d', strokeWidth: 2, r: 4 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Capital Efficiency Section
function EfficiencySection({ monthlyData, quarterlyData, yearlyData, yearlyNetNewARR, yearlyBurnMultiple }) {
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

  // Calculate burn multiples for different periods
  const calcPeriodBurnMultiple = (numMonths) => {
    const startIdx = 12 - numMonths;
    const periodMonths = monthlyData.slice(startIdx);
    const totalBurn = periodMonths.reduce((sum, m) => sum + (parseFloat(m.burn) || 0), 0);
    
    // Net New ARR = (last month revenue - first month of period's previous month revenue) * 12
    const lastMonthRev = getTotalRevenue(periodMonths[periodMonths.length - 1]);
    const prevMonthRev = startIdx > 0 ? getTotalRevenue(monthlyData[startIdx - 1]) : 0;
    const netNewARR = (lastMonthRev - prevMonthRev) * 12;
    
    return netNewARR > 0 ? totalBurn / netNewARR : null;
  };

  const burnMultiple12M = yearlyBurnMultiple;
  const burnMultiple6M = calcPeriodBurnMultiple(6);
  const burnMultiple3M = calcPeriodBurnMultiple(3);
  const burnMultiple1M = calcPeriodBurnMultiple(1);

  const monthlyChartData = monthlyData.map((m, i) => {
    const totalRev = getTotalRevenue(m);
    const grossMarginPct = parseFloat(m.grossMarginPct) || 0;
    const grossProfit = totalRev * (grossMarginPct / 100);
    return {
      month: m.month,
      grossMargin: grossMarginPct,
      grossProfit: grossProfit,
      revenue: totalRev,
    };
  });

  return (
    <div>
      <h2 style={styles.sectionTitle}>Capital Efficiency</h2>
      
      {/* Split Charts at Top */}
      <div style={styles.splitChartRow}>
        {/* Gross Margin Chart */}
        <div style={styles.splitChartSection}>
          <h3 style={styles.chartTitle}>Gross Margin %</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0062e2" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#0062e2" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => v + '%'} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [value != null ? value.toFixed(1) + '%' : '—', 'Gross Margin']} />
                <Area type="monotone" dataKey="grossMargin" fill="url(#marginGradient)" stroke="none" />
                <Line type="monotone" dataKey="grossMargin" stroke="#0062e2" strokeWidth={3} dot={{ fill: '#0062e2', strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gross Profit Chart */}
        <div style={styles.splitChartSection}>
          <h3 style={styles.chartTitle}>Gross Profit</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(v) => formatCurrency(v, true)} />
                <Tooltip contentStyle={styles.tooltip} formatter={(value) => [formatCurrency(value, true), 'Gross Profit']} />
                <Bar dataKey="grossProfit" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Burn Multiple Period Cards Below */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>Burn Multiple by Period</h3>
        <div style={styles.burnMultipleCards}>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>12 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple12M) }}>
              {burnMultiple12M !== null ? burnMultiple12M.toFixed(2) + 'x' : '—'}
            </span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple12M) }}>
              {getBurnMultipleLabel(burnMultiple12M)}
            </span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>6 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple6M) }}>
              {burnMultiple6M !== null ? burnMultiple6M.toFixed(2) + 'x' : '—'}
            </span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple6M) }}>
              {getBurnMultipleLabel(burnMultiple6M)}
            </span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>3 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple3M) }}>
              {burnMultiple3M !== null ? burnMultiple3M.toFixed(2) + 'x' : '—'}
            </span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple3M) }}>
              {getBurnMultipleLabel(burnMultiple3M)}
            </span>
          </div>
          <div style={styles.burnMultipleCard}>
            <span style={styles.burnMultiplePeriod}>1 Month</span>
            <span style={{ ...styles.burnMultipleValue, color: getBurnMultipleColor(burnMultiple1M) }}>
              {burnMultiple1M !== null ? burnMultiple1M.toFixed(2) + 'x' : '—'}
            </span>
            <span style={{ ...styles.burnMultipleRating, color: getBurnMultipleColor(burnMultiple1M) }}>
              {getBurnMultipleLabel(burnMultiple1M)}
            </span>
          </div>
        </div>
        <p style={styles.chartNote}>Lower is better. &lt;1x = Amazing, 1-1.5x = Great, 1.5-2x = Good, 2-3x = Mediocre, &gt;3x = Bad</p>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, subtitle, accent }) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricAccent, backgroundColor: accent }}></div>
      <div style={styles.metricContent}>
        <span style={styles.metricTitle}>{title}</span>
        <span style={{ ...styles.metricValue, color: accent }}>{value}</span>
        <span style={styles.metricSubtitle}>{subtitle}</span>
      </div>
    </div>
  );
}

// Compact Metric Card for Overview sidebar
function MetricCardCompact({ title, value, subtitle, accent }) {
  return (
    <div style={styles.metricCardCompact}>
      <div style={{ ...styles.metricAccentCompact, backgroundColor: accent }}></div>
      <div style={styles.metricContentCompact}>
        <span style={styles.metricTitleCompact}>{title}</span>
        <span style={{ ...styles.metricValueCompact, color: accent }}>{value}</span>
        <span style={styles.metricSubtitleCompact}>{subtitle}</span>
      </div>
    </div>
  );
}

// Horizontal Metric Card for Overview row
function MetricCardHorizontal({ title, value, subtitle, accent }) {
  return (
    <div style={styles.metricCardHorizontal}>
      <div style={{ ...styles.metricAccentHorizontal, backgroundColor: accent }}></div>
      <div style={styles.metricContentHorizontal}>
        <span style={styles.metricTitleHorizontal}>{title}</span>
        <span style={{ ...styles.metricValueHorizontal, color: accent }}>{value}</span>
        <span style={styles.metricSubtitleHorizontal}>{subtitle}</span>
      </div>
    </div>
  );
}

// Clickable Metric Card for Overview
function MetricCardClickable({ title, value, subtitle, accent, isSelected, onClick }) {
  return (
    <div
      style={{
        ...styles.metricCardClickable,
        ...(isSelected ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : {}),
        outline: 'none',
      }}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
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

// Styles
const styles = {
  container: {
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    color: '#1E293B',
  },
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'ABC Monument Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#F8FAFC',
  },
  sidebar: {
    backgroundColor: '#FFFFFF',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    borderRight: '1px solid #e5e5e5',
    zIndex: 1000,
    padding: '20px 16px',
  },
  sidebarLogo: {
    padding: '0 0 20px 0',
    marginBottom: '20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '32px',
  },
  logoImage: {
    maxWidth: '80px',
    height: 'auto',
  },
  logoCollapsed: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0062e2',
    letterSpacing: '0.1em',
  },
  sidebarNav: {
    flex: 1,
    padding: '0',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderLeft: '3px solid transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    borderRadius: '0 6px 6px 0',
    marginLeft: '-3px',
  },
  menuItemHover: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
    color: '#0062e2',
    fontWeight: 500,
    borderLeftColor: '#0062e2',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    marginTop: '4px',
    marginBottom: '2px',
  },
  menuItemParent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    borderRadius: '0',
  },
  menuIcon: {
    flexShrink: 0,
    color: 'inherit',
    opacity: 0.7,
  },
  menuLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
  },
  menuChevron: {
    fontSize: '10px',
    transition: 'transform 0.2s',
  },
  submenuContainer: {
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '2px',
    marginBottom: '4px',
    marginLeft: '0',
  },
  submenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px 10px 44px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '15px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    borderRadius: '0',
  },
  submenuItemActive: {
    color: '#1a1a1a',
    backgroundColor: 'transparent',
    fontWeight: 500,
  },
  sidebarBottom: {
    borderTop: '1px solid #e5e5e5',
    padding: '16px 0 0 0',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  collapseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    outline: 'none',
    borderRadius: '6px',
  },
  mainArea: {
    flex: 1,
    marginLeft: '208px',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: 'white',
    borderBottom: '1px solid #E2E8F0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#4B5563',
  },
  roleBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logoutButton: {
    padding: '8px',
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  migrationPrompt: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  migrationContent: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  migrationTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1F2937',
  },
  migrationText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  migrationButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  migrateButton: {
    padding: '10px 20px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  skipButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#6B7280',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#0062e2',
  },
  logoSubtext: {
    fontSize: '11px',
    color: '#94A3B8',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  yearBadge: {
    padding: '6px 12px',
    backgroundColor: '#1E293B',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94A3B8',
  },
  dataButton: {
    padding: '8px 16px',
    backgroundColor: '#0062e2',
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
    padding: '12px 32px',
    backgroundColor: 'white',
    borderBottom: '1px solid #E2E8F0',
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
    backgroundColor: '#EFF6FF',
    color: '#0062e2',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '32px',
    backgroundColor: '#F8FAFC',
  },
  footer: {
    textAlign: 'center',
    padding: '24px',
    color: '#94A3B8',
    fontSize: '12px',
    borderTop: '1px solid #E2E8F0',
    marginTop: '40px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '24px',
    letterSpacing: '-0.02em',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    outline: 'none',
  },
  metricAccent: {
    width: '4px',
  },
  metricContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  metricTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  metricSubtitle: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  metricCardCompact: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    display: 'flex',
  },
  metricAccentCompact: {
    width: '4px',
  },
  metricContentCompact: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  metricTitleCompact: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px',
  },
  metricValueCompact: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '2px',
  },
  metricSubtitleCompact: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  overviewCardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCardHorizontal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    display: 'flex',
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
  metricCardClickable: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '2px solid #E2E8F0',
    display: 'flex',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
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
  overviewCardsRowFour: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  arpaSummary: {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E2E8F0',
  },
  arpaSummaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  arpaSummaryLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 500,
  },
  arpaSummaryValue: {
    fontSize: '18px',
    fontWeight: 700,
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
    cursor: 'pointer',
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
  chartSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '20px',
  },
  chartContainer: {
    width: '100%',
    marginTop: '16px',
  },
  chartNote: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '12px',
    textAlign: 'center',
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
  summaryTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  summaryHeader: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
    fontWeight: 600,
    color: '#475569',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  summaryCell: {
    padding: '14px 16px',
    borderBottom: '1px solid #E2E8F0',
    color: '#334155',
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
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '8px',
  },
  dataInputSubtitle: {
    fontSize: '14px',
    color: '#64748B',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px 8px',
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
    fontWeight: 600,
    color: '#475569',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableRowOdd: {
    backgroundColor: 'white',
  },
  tableCell: {
    padding: '8px',
    borderBottom: '1px solid #E2E8F0',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0F172A',
    backgroundColor: 'white',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    minWidth: '80px',
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
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'none',
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
  npsScale: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  npsScaleItem: {
    flex: '1',
    minWidth: '120px',
    padding: '12px 16px',
    borderRadius: '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    textAlign: 'center',
  },
  npsScaleLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  npsScaleDesc: {
    display: 'block',
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
  },
};
