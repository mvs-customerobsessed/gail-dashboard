import { BarChart3, Table2 } from 'lucide-react';

const styles = {
  container: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
    color: '#64748B',
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

/**
 * Toggle between Charts and Data views
 * @param {string} value - Current view: 'charts' or 'data'
 * @param {Function} onChange - Callback when view changes
 */
export default function ViewToggle({ value, onChange }) {
  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          ...(value === 'charts' ? styles.buttonActive : {}),
        }}
        onClick={() => onChange('charts')}
      >
        <BarChart3 size={16} />
        Charts
      </button>
      <button
        style={{
          ...styles.button,
          ...(value === 'data' ? styles.buttonActive : {}),
        }}
        onClick={() => onChange('data')}
      >
        <Table2 size={16} />
        Data
      </button>
    </div>
  );
}
