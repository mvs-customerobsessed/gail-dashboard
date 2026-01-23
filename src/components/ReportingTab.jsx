import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as metabaseApi from '../services/metabaseApi';

// Custom bar shape that only rounds top corners if this is the topmost segment
const RoundedTopBarShape = (props) => {
  const { x, y, width, height, fill, stackedData, dataKey } = props;
  if (!height || height <= 0) return null;

  // Check if this bar segment is at the top of its stack
  let isTop = true;
  if (stackedData && dataKey) {
    const allKeys = stackedData.map(d => d.key);
    const currentKeyIndex = allKeys.indexOf(dataKey);
    const dataPoint = props.payload;

    // Check if any key after this one has a non-zero value
    for (let i = currentKeyIndex + 1; i < allKeys.length; i++) {
      if (dataPoint && dataPoint[allKeys[i]] > 0) {
        isTop = false;
        break;
      }
    }
  }

  if (!isTop) {
    // Regular rectangle for non-top bars
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  }

  // Rounded top corners for top bar
  const r = Math.min(6, height / 2, width / 2);
  return (
    <path
      d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
      fill={fill}
    />
  );
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '4px',
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
  loadingSpinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid #E2E8F0',
    borderTopColor: '#0062e2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: '13px',
    padding: '12px',
    backgroundColor: '#FEF2F2',
    borderRadius: '6px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94A3B8',
  },
  selectContainer: {
    marginBottom: '24px',
  },
  urlInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    cursor: 'pointer',
    minWidth: '250px',
  },
  addQuestionButton: {
    padding: '10px 20px',
    backgroundColor: '#0062e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlsRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  autoRefreshToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748B',
  },
  toggle: {
    width: '40px',
    height: '22px',
    borderRadius: '11px',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toggleActive: {
    backgroundColor: '#0062e2',
  },
  toggleKnob: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'white',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  toggleKnobActive: {
    left: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#F8FAFC',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E2E8F0',
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
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
  statusChecking: {
    backgroundColor: '#F59E0B',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Default chart color palette
const DEFAULT_COLOR_PALETTE = ['#0062e2', '#34d399', '#ffad4d', '#a78bfa', '#f472b6', '#22d3d8', '#fb923c', '#84cc16'];

// Collapsible Legend Component
function CollapsibleLegend({ items, colors }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#64748B',
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '10px',
        }}>▼</span>
        {isOpen ? 'Hide' : 'Show'} Legend ({items.length} items)
      </button>
      {isOpen && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '6px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          {items.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: colors[item],
                borderRadius: '2px',
              }} />
              <span style={{ fontSize: '12px', color: '#64748B' }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Per-chart color storage key (now stores individual bar colors)
const CHART_COLORS_KEY = 'gail-reporting-chart-bar-colors';

// Available colors for the picker
const AVAILABLE_COLORS = [
  { name: 'Green', color: '#10B981' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Blue', color: '#0062e2' },
  { name: 'Yellow', color: '#F59E0B' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Gray', color: '#6B7280' },
  { name: 'Indigo', color: '#6366F1' },
];

// Get saved chart bar colors from localStorage
function getChartBarColors() {
  try {
    const saved = localStorage.getItem(CHART_COLORS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Save individual bar color to localStorage
function saveBarColor(questionId, barName, color) {
  const allColors = getChartBarColors();
  if (!allColors[questionId]) {
    allColors[questionId] = {};
  }
  allColors[questionId][barName] = color;
  localStorage.setItem(CHART_COLORS_KEY, JSON.stringify(allColors));
}

// Question Card Component
function QuestionCard({ question, onRemove, colorPalette }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [barColors, setBarColors] = useState(() => {
    const saved = getChartBarColors();
    return saved[question.id] || {};
  });

  // Get color for a specific bar (custom or from default palette)
  const getBarColor = (barName, index) => {
    if (barColors[barName]) {
      return barColors[barName];
    }
    return (colorPalette || DEFAULT_COLOR_PALETTE)[index % (colorPalette || DEFAULT_COLOR_PALETTE).length];
  };

  const handleBarColorChange = (barName, color) => {
    setBarColors(prev => ({ ...prev, [barName]: color }));
    saveBarColor(question.id, barName, color);
  };

  const handleResetColors = () => {
    setBarColors({});
    const allColors = getChartBarColors();
    delete allColors[question.id];
    localStorage.setItem(CHART_COLORS_KEY, JSON.stringify(allColors));
    setShowColorPicker(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build parameters array from URL parameters and question's parameter definitions
      const params = [];
      if (question.parameters && question.urlParameters) {
        for (const param of question.parameters) {
          const urlValue = question.urlParameters[param.slug];
          if (urlValue !== undefined) {
            params.push({
              type: param.type,
              target: param.target,
              value: urlValue,
            });
          }
        }
      }

      const results = await metabaseApi.runQuestion(question.id, params);
      // Check if the query returned an error status
      if (results.status === 'failed' || results.error) {
        throw new Error(results.error || 'Query failed');
      }
      const transformed = metabaseApi.transformResultsForChart(results);
      setData(transformed);
      setLastUpdated(new Date());
    } catch (err) {
      // Provide more helpful error messages
      let errorMsg = err.message;
      if (errorMsg.includes('500')) {
        errorMsg = 'This question failed to run. It may require parameters or the underlying data source may be unavailable.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [question.id, question.parameters, question.urlParameters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div style={styles.emptyState}>No data available</div>;
    }

    // Get visualization settings from Metabase question
    const vizSettings = question.visualization_settings || {};
    const dimensions = vizSettings['graph.dimensions'] || [];
    const metrics = vizSettings['graph.metrics'] || [];
    const isStacked = vizSettings['stackable.stack_type'] === 'stacked';

    const keys = Object.keys(data[0]);

    // Find numeric keys for Y-axis (exclude string/text columns)
    const numericKeys = keys.filter(key => {
      const sampleValue = data.find(row => row[key] !== null)?.[key];
      return typeof sampleValue === 'number';
    });

    // Use Metabase settings if available, otherwise auto-detect
    let xKey = dimensions[0] || keys.find(key => {
      const sampleValue = data[0][key];
      return typeof sampleValue === 'string';
    }) || keys[0];

    const groupByKey = dimensions[1]; // Second dimension is typically the grouping key
    const yKey = metrics[0] || numericKeys[0] || keys.find(k => k !== xKey);

    // If we have a groupBy dimension, pivot the data for stacked chart
    if (groupByKey && yKey) {
      // Get unique x-axis values and group values
      const xValues = [...new Set(data.map(row => row[xKey]))];
      const groupValues = [...new Set(data.map(row => row[groupByKey]))].filter(Boolean);

      // Pivot data: each row is an x-value with columns for each group
      const pivotedData = xValues.map(xVal => {
        const row = { [xKey]: xVal };
        groupValues.forEach(groupVal => {
          const match = data.find(d => d[xKey] === xVal && d[groupByKey] === groupVal);
          row[groupVal] = match ? match[yKey] : 0;
        });
        return row;
      });

      // Generate colors for each group (using custom bar colors if set)
      const groupColors = {};
      groupValues.forEach((group, index) => {
        groupColors[group] = getBarColor(group, index);
      });

      return (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pivotedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                  return `$${value}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '12px',
                }}
                formatter={(value) => [`$${value?.toLocaleString() || 0}`, '']}
              />
              {groupValues.map((group) => (
                <Bar
                  key={group}
                  dataKey={group}
                  stackId={isStacked ? 'stack' : undefined}
                  fill={groupColors[group]}
                  name={group}
                  shape={(shapeProps) => <RoundedTopBarShape {...shapeProps} stackedData={groupValues.map(g => ({ key: g }))} />}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <CollapsibleLegend items={groupValues} colors={groupColors} />
        </>
      );
    }

    // Fallback: simple chart without grouping
    const yKeys = numericKeys.length > 0 ? numericKeys : keys.filter(k => k !== xKey);

    // If still too complex, show table
    if (data.length > 500) {
      return renderTable();
    }

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '12px',
            }}
          />
          {yKeys.slice(0, 4).map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={getBarColor(key, index)}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = () => {
    if (!data || data.length === 0) {
      return <div style={styles.emptyState}>No data available</div>;
    }

    const keys = Object.keys(data[0]);

    return (
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {keys.map(key => (
                <th key={key} style={styles.tableHeader}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 50).map((row, index) => (
              <tr key={index}>
                {keys.map(key => (
                  <td key={key} style={styles.tableCell}>
                    {typeof row[key] === 'number'
                      ? row[key].toLocaleString()
                      : row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 50 && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            Showing 50 of {data.length} rows
          </div>
        )}
      </div>
    );
  };

  // Choose visualization based on question display type
  const displayType = question.display || 'table';

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>{question.name}</div>
          {lastUpdated && (
            <div style={styles.cardSubtitle}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Color picker button */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...styles.refreshButton,
                backgroundColor: Object.keys(barColors).length > 0 ? '#0062e2' : '#F1F5F9',
                color: Object.keys(barColors).length > 0 ? '#fff' : '#64748B',
              }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Change bar colors"
            >
              🎨
            </button>
            {showColorPicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '220px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '12px' }}>
                  Bar Colors
                </div>
                {data && data.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Get unique bar names from data */}
                    {(() => {
                      const keys = Object.keys(data[0]);
                      const numericKeys = keys.filter(key => {
                        const val = data.find(row => row[key] !== null)?.[key];
                        return typeof val === 'number';
                      });
                      // If there's a groupBy, get group values instead
                      const vizSettings = question.visualization_settings || {};
                      const dimensions = vizSettings['graph.dimensions'] || [];
                      const groupByKey = dimensions[1];

                      let barNames = numericKeys;
                      if (groupByKey) {
                        barNames = [...new Set(data.map(row => row[groupByKey]))].filter(Boolean);
                      }

                      return barNames.slice(0, 8).map((barName, index) => (
                        <div key={barName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {barName}
                          </span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {AVAILABLE_COLORS.map(({ name, color }) => (
                              <button
                                key={color}
                                onClick={() => handleBarColorChange(barName, color)}
                                title={name}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '3px',
                                  backgroundColor: color,
                                  border: (barColors[barName] === color || (!barColors[barName] && getBarColor(barName, index) === color))
                                    ? '2px solid #1F2937'
                                    : '1px solid #E5E7EB',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    {Object.keys(barColors).length > 0 && (
                      <button
                        onClick={handleResetColors}
                        style={{
                          marginTop: '8px',
                          padding: '6px 8px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#64748B',
                        }}
                      >
                        Reset all colors
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Load data first to customize colors
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            style={styles.refreshButton}
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? <span style={styles.loadingSpinner}></span> : '↻'} Refresh
          </button>
          {onRemove && (
            <button
              style={{ ...styles.refreshButton, color: '#DC2626' }}
              onClick={() => onRemove(question.id)}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && !data && (
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Loading...</div>
        </div>
      )}

      {error && <div style={styles.errorMessage}>{error}</div>}

      {!loading && !error && (
        displayType === 'table' ? renderTable() : renderChart()
      )}
    </div>
  );
}

/**
 * Parse a Metabase URL to extract the question/card ID and parameters
 * Supports formats like:
 * - https://lula.metabaseapp.com/question/123
 * - https://lula.metabaseapp.com/question/123-question-name
 * - https://lula.metabaseapp.com/question/123?param1=value1&param2=value2
 * - https://lula.metabaseapp.com/card/123
 */
function parseMetabaseUrl(url) {
  const patterns = [
    /\/question\/(\d+)/,
    /\/card\/(\d+)/,
  ];

  let questionId = null;
  let parameters = {};

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      questionId = parseInt(match[1], 10);
      break;
    }
  }

  // Also accept just a number
  if (!questionId) {
    const numMatch = url.trim().match(/^(\d+)$/);
    if (numMatch) {
      questionId = parseInt(numMatch[1], 10);
    }
  }

  // Extract URL parameters if present
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      parameters[key] = value;
    });
  } catch {
    // Not a valid URL, ignore parameters
  }

  return { questionId, parameters };
}

const STORAGE_KEY = 'gail-reporting-questions';

// Main ReportingTab Component
export default function ReportingTab() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [savedUrls, setSavedUrls] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [urlInput, setUrlInput] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputError, setInputError] = useState(null);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Save URLs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedUrls));
  }, [savedUrls]);

  // Check connection and load saved questions on mount
  useEffect(() => {
    async function initialize() {
      if (!metabaseApi.isConfigured()) {
        setConnectionStatus('unconfigured');
        setLoading(false);
        return;
      }

      try {
        const result = await metabaseApi.testConnection();
        if (result.success) {
          setConnectionStatus('connected');

          // Load saved questions from localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const urls = JSON.parse(saved);
            for (const urlData of urls) {
              try {
                const question = await metabaseApi.getQuestion(urlData.questionId);
                question.urlParameters = urlData.parameters;
                setSelectedQuestions(prev => {
                  if (prev.find(q => q.id === question.id)) return prev;
                  return [...prev, question];
                });
              } catch {
                // Skip questions that fail to load
              }
            }
          }
        } else {
          setConnectionStatus('disconnected');
          setError(result.error);
        }
      } catch (err) {
        setConnectionStatus('disconnected');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh by updating selectedQuestions state
      setSelectedQuestions(prev => [...prev]);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleAddQuestion = async () => {
    if (!urlInput.trim()) return;

    setInputError(null);
    setAddingQuestion(true);

    const { questionId, parameters } = parseMetabaseUrl(urlInput);
    if (!questionId) {
      setInputError('Invalid URL. Please paste a Metabase question URL (e.g., https://lula.metabaseapp.com/question/123)');
      setAddingQuestion(false);
      return;
    }

    // Check if already added
    if (selectedQuestions.find(q => q.id === questionId)) {
      setInputError('This question is already added');
      setAddingQuestion(false);
      return;
    }

    try {
      // Fetch the question details from Metabase
      const question = await metabaseApi.getQuestion(questionId);
      // Store the URL parameters with the question for use when running
      question.urlParameters = parameters;
      setSelectedQuestions(prev => [...prev, question]);
      // Save to localStorage for persistence
      setSavedUrls(prev => [...prev, { questionId, parameters }]);
      setUrlInput('');
    } catch (err) {
      setInputError(`Failed to load question: ${err.message}`);
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddQuestion();
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
    // Remove from localStorage
    setSavedUrls(prev => prev.filter(u => u.questionId !== questionId));
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: styles.statusChecking, text: 'Checking connection...' },
      connected: { color: styles.statusConnected, text: 'Connected to Metabase' },
      disconnected: { color: styles.statusDisconnected, text: 'Disconnected' },
      unconfigured: { color: styles.statusDisconnected, text: 'Not configured' },
    };

    const config = statusConfig[connectionStatus];

    return (
      <div style={styles.connectionStatus}>
        <div style={{ ...styles.statusDot, ...config.color }}></div>
        <span>{config.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Connecting to Metabase...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Real-Time Reporting</h1>
        <p style={styles.subtitle}>
          Live data from Metabase • {renderConnectionStatus()}
        </p>
      </div>

      {connectionStatus === 'unconfigured' && (
        <div style={styles.configWarning}>
          <span style={styles.warningIcon}>⚠️</span>
          <div style={styles.warningText}>
            <strong>Metabase not configured.</strong> Add your Metabase credentials to{' '}
            <code style={styles.warningCode}>.env.local</code>:
            <pre style={{ marginTop: '8px', fontSize: '12px' }}>
{`VITE_METABASE_URL=https://your-metabase-instance.com
VITE_METABASE_API_KEY=your-api-key`}
            </pre>
          </div>
        </div>
      )}

      {connectionStatus === 'disconnected' && error && (
        <div style={styles.configWarning}>
          <span style={styles.warningIcon}>⚠️</span>
          <div style={styles.warningText}>
            <strong>Connection failed:</strong> {error}
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <>
          <div style={styles.controlsRow}>
            <div style={{ flex: 1, maxWidth: '500px' }}>
              <input
                type="text"
                style={{
                  ...styles.urlInput,
                  ...(inputError ? { borderColor: '#EF4444' } : {}),
                }}
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setInputError(null); }}
                onKeyPress={handleKeyPress}
                placeholder="Paste Metabase question URL (e.g., https://lula.metabaseapp.com/question/123)"
                disabled={addingQuestion}
              />
              {inputError && (
                <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                  {inputError}
                </div>
              )}
            </div>

            <button
              style={{
                ...styles.addQuestionButton,
                opacity: urlInput.trim() && !addingQuestion ? 1 : 0.5,
                cursor: urlInput.trim() && !addingQuestion ? 'pointer' : 'not-allowed',
              }}
              onClick={handleAddQuestion}
              disabled={!urlInput.trim() || addingQuestion}
            >
              {addingQuestion ? 'Adding...' : '+ Add to Dashboard'}
            </button>

            <div style={styles.autoRefreshToggle}>
              <div
                style={{
                  ...styles.toggle,
                  ...(autoRefresh ? styles.toggleActive : {}),
                }}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <div style={{
                  ...styles.toggleKnob,
                  ...(autoRefresh ? styles.toggleKnobActive : {}),
                }}></div>
              </div>
              <span>Auto-refresh (1 min)</span>
            </div>
          </div>

          {selectedQuestions.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#1E293B', marginBottom: '8px' }}>
                  No reports added yet
                </div>
                <div style={{ fontSize: '14px', color: '#64748B' }}>
                  Paste a Metabase question URL above to display it here
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.grid}>
              {selectedQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onRemove={handleRemoveQuestion}
                  colorPalette={DEFAULT_COLOR_PALETTE}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
