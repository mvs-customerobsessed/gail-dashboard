import { useState, useRef, useEffect } from 'react';
import { Download, Upload, ChevronLeft, ChevronRight, Check, Loader2, X } from 'lucide-react';
import { exportToCsv, getMonthsForYear } from '../../utils/csvUtils';

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format month label with year (e.g., "Nov-25", "Dec-25", "Jan-26")
function getMonthLabel(monthIndex, year) {
  const yy = String(year).slice(-2);
  return `${MONTH_ABBREVS[monthIndex]}-${yy}`;
}

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #DADCE0',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #DADCE0',
    backgroundColor: '#F8F9FA',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  toolbarTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#202124',
  },
  yearNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #DADCE0',
    borderRadius: '4px',
    padding: '2px',
  },
  yearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#5F6368',
    transition: 'background-color 0.1s',
  },
  yearButtonHover: {
    backgroundColor: '#F1F3F4',
  },
  yearDisplay: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#202124',
    padding: '0 8px',
    minWidth: '50px',
    textAlign: 'center',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toolbarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #DADCE0',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#5F6368',
    transition: 'all 0.1s',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
  },
  th: {
    padding: '0',
    backgroundColor: '#F8F9FA',
    borderBottom: '1px solid #DADCE0',
    borderRight: '1px solid #E8EAED',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    minWidth: '70px',
  },
  thInner: {
    padding: '8px 10px',
    fontWeight: 500,
    fontSize: '12px',
    color: '#5F6368',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  thFirst: {
    minWidth: '160px',
    backgroundColor: '#F8F9FA',
    position: 'sticky',
    left: 0,
    zIndex: 20,
    textAlign: 'left',
  },
  td: {
    padding: '0',
    borderBottom: '1px solid #E8EAED',
    borderRight: '1px solid #E8EAED',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    minWidth: '70px',
  },
  tdFirst: {
    backgroundColor: '#F8F9FA',
    position: 'sticky',
    left: 0,
    zIndex: 5,
    fontWeight: 500,
    color: '#202124',
    minWidth: '160px',
  },
  metricCell: {
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metricLabel: {
    flex: 1,
  },
  pasteStatus: {
    fontSize: '11px',
    color: '#34A853',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    fontSize: '13px',
    border: 'none',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
    textAlign: 'right',
  },
  inputFocused: {
    boxShadow: 'inset 0 0 0 2px #1A73E8',
  },
  savingIndicator: {
    position: 'absolute',
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    padding: '10px 12px',
    backgroundColor: '#F8F9FA',
    borderTop: '1px solid #DADCE0',
    fontSize: '12px',
    color: '#5F6368',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#FAFAFA',
  },
};

// Parse clipboard row (tab or comma separated)
function parseExcelRow(text) {
  const cleaned = text.replace(/[$%,]/g, '').trim();
  const values = cleaned.split(/\t|,\s*|\s{2,}/).map(v => {
    const num = parseFloat(v.trim());
    return isNaN(num) ? null : num;
  });
  return values;
}

export default function ExcelDataTable({
  data = [],
  columns = [],
  onSave,
  onImport,
  selectedYear = new Date().getFullYear(),
  onYearChange,
  canEdit = false,
  tabName = 'metrics',
}) {
  const [pasteStatus, setPasteStatus] = useState({});
  const [savingCells, setSavingCells] = useState({});
  const [hoveredYearBtn, setHoveredYearBtn] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);
  const [localValues, setLocalValues] = useState({}); // Track local edits: { "metricId-monthIdx": "value" }
  const fileInputRef = useRef(null);
  const inputRefs = useRef({}); // Track input refs for focus management

  // Get months for the selected year
  const monthsForYear = getMonthsForYear(selectedYear);

  // Build data map by periodStart for quick lookup
  const dataByPeriod = {};
  data.forEach(row => {
    if (row.periodStart) {
      dataByPeriod[row.periodStart] = row;
    }
  });

  // Get editable columns (metrics) - exclude periodStart
  const metricColumns = columns.filter(c => c.id !== 'periodStart');

  // Reset local values when year changes or data refreshes
  useEffect(() => {
    setLocalValues({});
  }, [selectedYear, data]);

  // Format number with commas
  const formatWithCommas = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  // Get cell value - prefer local edited value, fall back to database value
  // When focused, show raw number; when not focused, show formatted with commas
  const getCellValue = (metricId, monthIndex, isFocused) => {
    const cellKey = `${metricId}-${monthIndex}`;

    // If focused, show raw number for easy editing
    if (isFocused) {
      if (localValues.hasOwnProperty(cellKey)) {
        return localValues[cellKey];
      }
      const periodStart = monthsForYear[monthIndex];
      const rowData = dataByPeriod[periodStart] || {};
      const dbValue = rowData[metricId];
      if (dbValue === null || dbValue === undefined || dbValue === '') {
        return '';
      }
      return String(dbValue);
    }

    // Not focused - show formatted with commas
    if (localValues.hasOwnProperty(cellKey)) {
      return formatWithCommas(localValues[cellKey]);
    }
    const periodStart = monthsForYear[monthIndex];
    const rowData = dataByPeriod[periodStart] || {};
    const dbValue = rowData[metricId];
    if (dbValue === null || dbValue === undefined || dbValue === '') {
      return '';
    }
    return formatWithCommas(dbValue);
  };

  // Handle paste on any cell - if multiple values, fill across the row
  const handleCellPaste = (e, metricId, startIndex) => {
    if (!canEdit) return;

    const pastedText = e.clipboardData.getData('text');
    const values = parseExcelRow(pastedText);

    if (values.length > 1) {
      e.preventDefault();
      // Fill across from startIndex
      let filledCount = 0;
      const newLocalValues = { ...localValues };

      values.forEach((val, i) => {
        const targetIndex = startIndex + i;
        if (val !== null && targetIndex < 12) {
          const periodStart = monthsForYear[targetIndex];
          const cellKey = `${metricId}-${targetIndex}`;
          newLocalValues[cellKey] = String(val);
          onSave?.(periodStart, metricId, val);
          filledCount++;
        }
      });

      setLocalValues(newLocalValues);
      setPasteStatus({ [metricId]: { success: true, count: filledCount } });
      setTimeout(() => setPasteStatus({}), 2000);
    }
    // If single value, let default paste behavior handle it
  };

  // Handle input change - update local state immediately, save to DB
  const handleInputChange = (e, metricId, monthIndex) => {
    const rawValue = e.target.value;
    // Allow typing numbers, decimals, minus, and empty string
    const cleaned = rawValue.replace(/[^0-9.-]/g, '');

    const cellKey = `${metricId}-${monthIndex}`;

    // Update local state immediately for responsive UI
    setLocalValues(prev => ({ ...prev, [cellKey]: cleaned }));
  };

  // Handle blur - save to database
  const handleInputBlur = async (metricId, monthIndex) => {
    const cellKey = `${metricId}-${monthIndex}`;
    const localValue = localValues[cellKey];

    // Only save if we have a local edit
    if (localValue === undefined) return;

    const periodStart = monthsForYear[monthIndex];
    const val = localValue === '' ? null : parseFloat(localValue);

    setSavingCells(prev => ({ ...prev, [cellKey]: 'saving' }));

    // Check return value - false means save failed
    const success = await onSave?.(periodStart, metricId, val);

    if (success === false) {
      // Show error state
      setSavingCells(prev => ({ ...prev, [cellKey]: 'error' }));
      setTimeout(() => {
        setSavingCells(prev => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 3000); // Show error longer
    } else {
      // Show success state
      setSavingCells(prev => ({ ...prev, [cellKey]: 'saved' }));
      setTimeout(() => {
        setSavingCells(prev => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 1500);
    }
  };

  // Save current cell and move focus to another cell
  const saveAndNavigate = async (currentMetricId, currentMonthIndex, direction) => {
    // Save current cell first
    await handleInputBlur(currentMetricId, currentMonthIndex);

    // Calculate next cell position
    const currentRowIndex = metricColumns.findIndex(m => m.id === currentMetricId);
    let nextRowIndex = currentRowIndex;
    let nextMonthIndex = currentMonthIndex;

    switch (direction) {
      case 'up':
        nextRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
        nextRowIndex = Math.min(metricColumns.length - 1, currentRowIndex + 1);
        break;
      case 'left':
        nextMonthIndex = Math.max(0, currentMonthIndex - 1);
        break;
      case 'right':
      case 'tab':
        nextMonthIndex = currentMonthIndex + 1;
        if (nextMonthIndex >= 12) {
          nextMonthIndex = 0;
          nextRowIndex = Math.min(metricColumns.length - 1, currentRowIndex + 1);
        }
        break;
      case 'enter':
        // Enter moves down
        nextRowIndex = Math.min(metricColumns.length - 1, currentRowIndex + 1);
        break;
    }

    // Focus the next cell
    const nextMetric = metricColumns[nextRowIndex];
    if (nextMetric) {
      const nextCellKey = `${nextMetric.id}-${nextMonthIndex}`;
      const nextInput = inputRefs.current[nextCellKey];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, metricId, monthIndex) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        saveAndNavigate(metricId, monthIndex, 'up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        saveAndNavigate(metricId, monthIndex, 'down');
        break;
      case 'ArrowLeft':
        // Only navigate if cursor is at start of input
        if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
          e.preventDefault();
          saveAndNavigate(metricId, monthIndex, 'left');
        }
        break;
      case 'ArrowRight':
        // Only navigate if cursor is at end of input
        if (e.target.selectionStart === e.target.value.length) {
          e.preventDefault();
          saveAndNavigate(metricId, monthIndex, 'right');
        }
        break;
      case 'Tab':
        e.preventDefault();
        saveAndNavigate(metricId, monthIndex, e.shiftKey ? 'left' : 'tab');
        break;
      case 'Enter':
        e.preventDefault();
        saveAndNavigate(metricId, monthIndex, 'enter');
        break;
    }
  };

  const handleExport = () => {
    const exportRows = metricColumns.map(metric => {
      const row = { Metric: metric.label };
      monthsForYear.forEach((periodStart, idx) => {
        const monthData = dataByPeriod[periodStart] || {};
        const monthKey = getMonthLabel(idx, selectedYear);
        row[monthKey] = monthData[metric.id] ?? '';
      });
      return row;
    });

    const exportColumns = [
      { id: 'Metric', label: 'Metric' },
      ...MONTH_ABBREVS.map((_, idx) => {
        const label = getMonthLabel(idx, selectedYear);
        return { id: label, label };
      })
    ];

    exportToCsv(exportRows, exportColumns, `${tabName}_${selectedYear}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim());
        const newLocalValues = { ...localValues };

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const metricName = values[0];

          const metric = metricColumns.find(c =>
            c.label.toLowerCase() === metricName?.toLowerCase() ||
            c.id.toLowerCase() === metricName?.toLowerCase()
          );

          if (!metric || metric.editable === false) continue;

          headers.forEach((header, colIdx) => {
            if (colIdx === 0) return;

            // Match against month abbreviation (with or without year suffix)
            const headerLower = header.toLowerCase().trim();
            const monthIdx = MONTH_ABBREVS.findIndex(m =>
              headerLower === m.toLowerCase() ||
              headerLower.startsWith(m.toLowerCase() + '-')
            );

            if (monthIdx >= 0 && values[colIdx]) {
              const periodStart = monthsForYear[monthIdx];
              const cleaned = values[colIdx].replace(/[$%,]/g, '').trim();
              const value = parseFloat(cleaned) || 0;
              const cellKey = `${metric.id}-${monthIdx}`;
              newLocalValues[cellKey] = String(value);
              onSave?.(periodStart, metric.id, value);
            }
          });
        }

        setLocalValues(newLocalValues);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
    e.target.value = '';
  };

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.toolbarTitle}>Monthly Data Input — {selectedYear}</span>
          <div style={styles.yearNav}>
            <button
              style={{
                ...styles.yearButton,
                ...(hoveredYearBtn === 'prev' ? styles.yearButtonHover : {}),
              }}
              onClick={() => onYearChange?.(selectedYear - 1)}
              onMouseEnter={() => setHoveredYearBtn('prev')}
              onMouseLeave={() => setHoveredYearBtn(null)}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={styles.yearDisplay}>{selectedYear}</span>
            <button
              style={{
                ...styles.yearButton,
                ...(hoveredYearBtn === 'next' ? styles.yearButtonHover : {}),
              }}
              onClick={() => onYearChange?.(selectedYear + 1)}
              onMouseEnter={() => setHoveredYearBtn('next')}
              onMouseLeave={() => setHoveredYearBtn(null)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div style={styles.toolbarRight}>
          <button style={styles.toolbarButton} onClick={handleExport}>
            <Download size={14} />
            Export
          </button>
          {canEdit && (
            <>
              <button style={styles.toolbarButton} onClick={handleImportClick}>
                <Upload size={14} />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={styles.hiddenInput}
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Table - Metrics as rows, months as columns */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.thFirst }}>
                <div style={{ ...styles.thInner, textAlign: 'left' }}>Metric</div>
              </th>
              {MONTH_ABBREVS.map((_, idx) => (
                <th key={idx} style={styles.th}>
                  <div style={styles.thInner}>{getMonthLabel(idx, selectedYear)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricColumns.map((metric, rowIndex) => (
              <tr key={metric.id} style={rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {/* Metric name cell */}
                <td style={{ ...styles.td, ...styles.tdFirst }}>
                  <div style={styles.metricCell}>
                    <span style={styles.metricLabel}>{metric.label}</span>
                    {pasteStatus[metric.id] && (
                      <span style={styles.pasteStatus}>
                        ✓ {pasteStatus[metric.id].count} values
                      </span>
                    )}
                  </div>
                </td>
                {/* Month data cells - each with its own input */}
                {MONTH_ABBREVS.map((_, colIndex) => {
                  const cellKey = `${metric.id}-${colIndex}`;
                  const savingState = savingCells[cellKey];
                  const isFocused = focusedCell === cellKey;
                  const cellValue = getCellValue(metric.id, colIndex, isFocused);
                  const isEditable = metric.editable !== false && canEdit;

                  return (
                    <td key={colIndex} style={styles.td}>
                      <input
                        ref={(el) => { inputRefs.current[cellKey] = el; }}
                        type="text"
                        inputMode="numeric"
                        style={{
                          ...styles.input,
                          ...(isFocused ? styles.inputFocused : {}),
                          cursor: isEditable ? 'text' : 'default',
                          backgroundColor: rowIndex % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        }}
                        value={cellValue}
                        onChange={(e) => {
                          if (isEditable) {
                            handleInputChange(e, metric.id, colIndex);
                          }
                        }}
                        onBlur={() => handleInputBlur(metric.id, colIndex)}
                        onPaste={(e) => handleCellPaste(e, metric.id, colIndex)}
                        onFocus={() => setFocusedCell(cellKey)}
                        onKeyDown={(e) => handleKeyDown(e, metric.id, colIndex)}
                        disabled={!isEditable}
                        placeholder="—"
                      />
                      {savingState && (
                        <span style={styles.savingIndicator}>
                          {savingState === 'saving' ? (
                            <Loader2 size={12} color="#1A73E8" style={{ animation: 'spin 1s linear infinite' }} />
                          ) : savingState === 'error' ? (
                            <X size={12} color="#EF4444" />
                          ) : (
                            <Check size={12} color="#34A853" />
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {canEdit ? (
          <span>
            <strong>Tip:</strong> Use arrow keys to navigate • Enter to move down • Tab to move right • Paste from Excel fills across
          </span>
        ) : (
          <span>View only — contact admin to edit</span>
        )}
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
