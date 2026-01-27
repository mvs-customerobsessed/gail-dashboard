import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Loader2, Info, Upload, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1E293B',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#64748B',
    transition: 'all 0.2s',
  },
  periodSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  periodLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
  },
  periodSelect: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
  },
  currentButton: {
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputGroupFull: {
    gridColumn: '1 / -1',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: '11px',
    color: '#94A3B8',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocused: {
    borderColor: '#3B82F6',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748B',
  },
  footerActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#64748B',
  },
  saveButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#1E293B',
    cursor: 'pointer',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
    cursor: 'not-allowed',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #E2E8F0',
  },
  tab: {
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#1E293B',
    borderBottomColor: '#3B82F6',
  },
  projectionsSection: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #E2E8F0',
  },
  projectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  projectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  projectionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  projectionTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  projectionTh: {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 500,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  projectionTd: {
    padding: '6px 8px',
    borderBottom: '1px solid #F1F5F9',
  },
  projectionInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    outline: 'none',
    textAlign: 'right',
  },
  uploadArea: {
    border: '2px dashed #E2E8F0',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    cursor: 'pointer',
    marginTop: '16px',
  },
  uploadText: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '8px',
  },
  uploadSubtext: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
  },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Modal for editing metrics for a specific period
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Object} metrics - Current metric values
 * @param {Object} goals - Current goal values
 * @param {Object} projections - Monthly projections {metricId: [Jan, Feb, ...Dec]}
 * @param {Array} metricConfigs - Configuration for each metric [{id, title, color}]
 * @param {Function} onSave - Callback to save changes (metrics, goals, projections)
 * @param {string} selectedPeriodStart - Currently selected period (ISO date string)
 * @param {Function} onPeriodChange - Callback when period changes
 * @param {boolean} saving - Whether save is in progress
 */
export default function EditDataModal({
  isOpen,
  onClose,
  metrics = {},
  goals = {},
  projections = {},
  metricConfigs = [],
  onSave,
  selectedPeriodStart,
  onPeriodChange,
  saving = false,
}) {
  const [activeTab, setActiveTab] = useState('actuals'); // 'actuals' or 'projections'
  const [localMetrics, setLocalMetrics] = useState({});
  const [localGoals, setLocalGoals] = useState({});
  const [localProjections, setLocalProjections] = useState({});
  const [showProjections, setShowProjections] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);

  // Parse the selected date
  const selectedDate = selectedPeriodStart ? new Date(selectedPeriodStart) : new Date();
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  // Sync local state when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      setLocalMetrics({ ...metrics });
      setLocalGoals({ ...goals });
      setLocalProjections({ ...projections });
      setIsDirty(false);
      setActiveTab('actuals');
    }
  }, [isOpen, metrics, goals, projections]);

  if (!isOpen) return null;

  const handleMetricChange = (metricId, value) => {
    setLocalMetrics(prev => ({ ...prev, [metricId]: parseFloat(value) || 0 }));
    setIsDirty(true);
  };

  const handleGoalChange = (metricId, value) => {
    setLocalGoals(prev => ({ ...prev, [metricId]: parseFloat(value) || 0 }));
    setIsDirty(true);
  };

  const handleProjectionChange = (metricId, monthIndex, value) => {
    setLocalProjections(prev => {
      const current = prev[metricId] || Array(12).fill(0);
      const updated = [...current];
      updated[monthIndex] = parseFloat(value) || 0;
      return { ...prev, [metricId]: updated };
    });
    setIsDirty(true);
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const monthHeaders = headers.slice(1); // First column is metric name

        const newProjections = { ...localProjections };

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const metricName = values[0]?.toLowerCase();

          // Find matching metric config
          const config = metricConfigs.find(c =>
            c.title.toLowerCase() === metricName ||
            c.id.toLowerCase() === metricName
          );

          if (config) {
            const monthlyValues = values.slice(1).map(v => parseFloat(v) || 0);
            // Ensure we have 12 values
            while (monthlyValues.length < 12) monthlyValues.push(0);
            newProjections[config.id] = monthlyValues.slice(0, 12);
          }
        }

        setLocalProjections(newProjections);
        setIsDirty(true);
      } catch (err) {
        console.error('Error parsing CSV:', err);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleMonthChange = (month) => {
    const newDate = new Date(selectedYear, month, 1);
    const isoDate = newDate.toISOString().split('T')[0];
    onPeriodChange?.(isoDate);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(year, selectedMonth, 1);
    const isoDate = newDate.toISOString().split('T')[0];
    onPeriodChange?.(isoDate);
  };

  const handleGoToCurrentPeriod = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const isoDate = currentMonth.toISOString().split('T')[0];
    onPeriodChange?.(isoDate);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(localMetrics, localGoals, localProjections);
    }
    setIsDirty(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Generate year options (5 years back, 2 years forward)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    years.push(y);
  }

  // Group metrics by category if they have a category property
  const groupedMetrics = metricConfigs.reduce((acc, config) => {
    const category = config.category || 'Metrics';
    if (!acc[category]) acc[category] = [];
    acc[category].push(config);
    return acc;
  }, {});

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Customer Data</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.periodSelector}>
          <Calendar size={16} color="#64748B" />
          <span style={styles.periodLabel}>Period:</span>
          <div style={styles.periodSelect}>
            <select
              style={styles.select}
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select
              style={styles.select}
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button style={styles.currentButton} onClick={handleGoToCurrentPeriod}>
            Go to Current Period
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'actuals' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('actuals')}
          >
            Current Period
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'projections' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('projections')}
          >
            <TrendingUp size={14} style={{ marginRight: '6px' }} />
            Annual Projections
          </button>
        </div>

        <div style={styles.content}>
          {activeTab === 'actuals' ? (
            /* Actuals Tab Content */
            <>
              {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                <div key={category} style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <span
                      style={{
                        ...styles.sectionDot,
                        backgroundColor: categoryMetrics[0]?.color || '#64748B',
                      }}
                    />
                    {category}
                  </div>
                  <div style={styles.grid}>
                    {categoryMetrics.map(config => (
                      <div key={config.id} style={styles.inputGroup}>
                        <label style={styles.label}>{config.title}</label>
                        <div style={styles.inputRow}>
                          <div style={styles.inputWrapper}>
                            <div style={styles.inputLabel}>Actual</div>
                            <input
                              type="number"
                              style={styles.input}
                              value={localMetrics[config.id] ?? ''}
                              onChange={(e) => handleMetricChange(config.id, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div style={styles.inputWrapper}>
                            <div style={styles.inputLabel}>Goal</div>
                            <input
                              type="number"
                              style={styles.input}
                              value={localGoals[config.id] ?? ''}
                              onChange={(e) => handleGoalChange(config.id, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Projections Tab Content */
            <>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                  Set monthly targets for {selectedYear}. These projections will appear as goal lines on your charts.
                </p>

                {/* CSV Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  style={{ display: 'none' }}
                />
                <div
                  style={styles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} color="#64748B" />
                  <div style={styles.uploadText}>Click to upload CSV</div>
                  <div style={styles.uploadSubtext}>Format: Metric, Jan, Feb, Mar, ... Dec</div>
                </div>
              </div>

              {/* Projection Tables by Category */}
              {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                <div key={category} style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <span
                      style={{
                        ...styles.sectionDot,
                        backgroundColor: categoryMetrics[0]?.color || '#64748B',
                      }}
                    />
                    {category}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.projectionTable}>
                      <thead>
                        <tr>
                          <th style={{ ...styles.projectionTh, minWidth: '120px' }}>Metric</th>
                          {MONTHS.map((month, idx) => (
                            <th key={idx} style={{ ...styles.projectionTh, minWidth: '60px', textAlign: 'center' }}>
                              {month.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {categoryMetrics.map(config => (
                          <tr key={config.id}>
                            <td style={{ ...styles.projectionTd, fontWeight: 500, color: '#1E293B' }}>
                              {config.title}
                            </td>
                            {MONTHS.map((_, monthIdx) => (
                              <td key={monthIdx} style={styles.projectionTd}>
                                <input
                                  type="number"
                                  style={styles.projectionInput}
                                  value={localProjections[config.id]?.[monthIdx] ?? ''}
                                  onChange={(e) => handleProjectionChange(config.id, monthIdx, e.target.value)}
                                  placeholder="0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.tip}>
            <Info size={14} />
            <span>Changes are saved to the selected period</span>
          </div>
          <div style={styles.footerActions}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              style={{
                ...styles.saveButton,
                ...(saving || !isDirty ? styles.saveButtonDisabled : {}),
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
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
