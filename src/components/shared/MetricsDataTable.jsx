import { useState, useRef } from 'react';
import { Download, Upload, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { exportToCsv, parseCsv, formatMonthYear, getMonthsForYear } from '../../utils/csvUtils';

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    marginTop: '24px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  yearNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  yearButton: {
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  yearLabel: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1E293B',
    minWidth: '60px',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  actionButtonPrimary: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderColor: '#1E293B',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #E2E8F0',
    color: '#1E293B',
  },
  tdPeriod: {
    fontWeight: 500,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  editableCell: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  editableCellHover: {
    backgroundColor: '#F1F5F9',
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '2px solid #3B82F6',
    borderRadius: '4px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  emptyRow: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  savingIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#3B82F6',
    fontSize: '12px',
  },
  savedIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10B981',
    fontSize: '12px',
  },
  hiddenInput: {
    display: 'none',
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
  },
};

/**
 * Reusable data table for operational metrics
 * @param {Object[]} data - Array of period data [{periodStart, metric1, metric2, ...}]
 * @param {Object[]} columns - Column definitions [{id, label, format, editable}]
 * @param {Function} onSave - Callback when cell edited (periodStart, metricId, value)
 * @param {Function} onImport - Callback for CSV import (parsedData[])
 * @param {number} selectedYear - Currently displayed year
 * @param {Function} onYearChange - Callback when year navigation changes
 * @param {boolean} canEdit - Whether user can edit data
 * @param {string} tabName - Name of the tab (for export filename)
 */
export default function MetricsDataTable({
  data = [],
  columns = [],
  onSave,
  onImport,
  selectedYear = new Date().getFullYear(),
  onYearChange,
  canEdit = false,
  tabName = 'metrics',
}) {
  const [editingCell, setEditingCell] = useState(null); // {periodStart, columnId}
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState(null);
  const [savedCell, setSavedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const fileInputRef = useRef(null);

  // Get all months for the selected year
  const allMonths = getMonthsForYear(selectedYear);

  // Create a map of existing data by periodStart
  const dataByPeriod = {};
  data.forEach(row => {
    if (row.periodStart) {
      dataByPeriod[row.periodStart] = row;
    }
  });

  // Build rows for all 12 months (with data where available)
  const rows = allMonths.map(periodStart => ({
    periodStart,
    ...dataByPeriod[periodStart],
  }));

  const handleCellClick = (periodStart, columnId, currentValue) => {
    if (!canEdit) return;
    const col = columns.find(c => c.id === columnId);
    if (!col || col.editable === false) return;

    setEditingCell({ periodStart, columnId });
    setEditValue(currentValue ?? '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const { periodStart, columnId } = editingCell;
    const numValue = parseFloat(editValue);
    const finalValue = isNaN(numValue) ? editValue : numValue;

    setEditingCell(null);

    // Only save if value changed
    const existingRow = dataByPeriod[periodStart];
    const existingValue = existingRow?.[columnId];
    if (finalValue === existingValue) return;

    setSavingCell({ periodStart, columnId });
    try {
      await onSave?.(periodStart, columnId, finalValue);
      setSavedCell({ periodStart, columnId });
      setTimeout(() => setSavedCell(null), 2000);
    } finally {
      setSavingCell(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleExport = () => {
    const exportData = rows.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        if (col.id === 'periodStart') {
          exportRow[col.id] = formatMonthYear(row.periodStart);
        } else {
          exportRow[col.id] = row[col.id] ?? '';
        }
      });
      return exportRow;
    });

    exportToCsv(exportData, columns, `${tabName}_${selectedYear}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseCsv(file, columns);
      await onImport?.(parsed);
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import CSV file. Please check the format.');
    }

    // Reset input
    e.target.value = '';
  };

  const formatCellValue = (value, column) => {
    if (value === undefined || value === null || value === '') {
      return <span style={styles.emptyRow}>—</span>;
    }
    if (column.format) {
      return column.format(value);
    }
    return value;
  };

  const getCellKey = (periodStart, columnId) => `${periodStart}-${columnId}`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          Historical Data
          <div style={styles.yearNav}>
            <button
              style={styles.yearButton}
              onClick={() => onYearChange?.(selectedYear - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={styles.yearLabel}>{selectedYear}</span>
            <button
              style={styles.yearButton}
              onClick={() => onYearChange?.(selectedYear + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.actionButton} onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </button>
          {canEdit && (
            <>
              <button
                style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                onClick={handleImportClick}
              >
                <Upload size={16} />
                Import CSV
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

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.id} style={styles.th}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.periodStart}>
                {columns.map(col => {
                  const cellKey = getCellKey(row.periodStart, col.id);
                  const isEditing = editingCell?.periodStart === row.periodStart &&
                                   editingCell?.columnId === col.id;
                  const isSaving = savingCell?.periodStart === row.periodStart &&
                                  savingCell?.columnId === col.id;
                  const isSaved = savedCell?.periodStart === row.periodStart &&
                                 savedCell?.columnId === col.id;
                  const isHovered = hoveredCell === cellKey;
                  const isEditable = canEdit && col.editable !== false && col.id !== 'periodStart';

                  // Period column (first column)
                  if (col.id === 'periodStart') {
                    return (
                      <td key={col.id} style={{ ...styles.td, ...styles.tdPeriod }}>
                        {formatMonthYear(row.periodStart)}
                      </td>
                    );
                  }

                  // Editable cells
                  return (
                    <td
                      key={col.id}
                      style={{
                        ...styles.td,
                        ...(isEditable ? styles.editableCell : {}),
                        ...(isHovered && isEditable ? styles.editableCellHover : {}),
                      }}
                      onClick={() => handleCellClick(row.periodStart, col.id, row[col.id])}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          style={styles.input}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      ) : (
                        <>
                          {formatCellValue(row[col.id], col)}
                          {isSaving && (
                            <span style={styles.savingIndicator}>
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            </span>
                          )}
                          {isSaved && (
                            <span style={styles.savedIndicator}>
                              <Check size={12} />
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
