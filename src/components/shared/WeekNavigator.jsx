import { ChevronLeft, ChevronRight } from 'lucide-react';

const styles = {
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  weekNavButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  weekNavButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  weekLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    minWidth: '180px',
    textAlign: 'center',
  },
  todayButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    cursor: 'pointer',
    marginLeft: '8px',
  },
};

// Week navigation helper functions
export function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day;
  const sunday = new Date(now);
  sunday.setDate(diff);
  return sunday.toISOString().split('T')[0];
}

export function getWeekLabel(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  return `Week of ${month} ${day}, '${year}`;
}

export function getPrevWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

export function getNextWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

export function isCurrentWeek(dateStr) {
  return dateStr === getCurrentWeekStart();
}

/**
 * Week navigation component for WBR
 * @param {string} selectedWeekStart - Currently selected week start date (YYYY-MM-DD)
 * @param {function} onWeekChange - Callback when week changes
 */
export default function WeekNavigator({ selectedWeekStart, onWeekChange }) {
  const handlePrevWeek = () => {
    onWeekChange(getPrevWeek(selectedWeekStart));
  };

  const handleNextWeek = () => {
    if (!isCurrentWeek(selectedWeekStart)) {
      onWeekChange(getNextWeek(selectedWeekStart));
    }
  };

  const handleToday = () => {
    onWeekChange(getCurrentWeekStart());
  };

  return (
    <div style={styles.weekNav}>
      <button
        style={styles.weekNavButton}
        onClick={handlePrevWeek}
        title="Previous week"
      >
        <ChevronLeft size={16} />
      </button>
      <span style={styles.weekLabel}>{getWeekLabel(selectedWeekStart)}</span>
      <button
        style={{
          ...styles.weekNavButton,
          ...(isCurrentWeek(selectedWeekStart) ? styles.weekNavButtonDisabled : {}),
        }}
        onClick={handleNextWeek}
        disabled={isCurrentWeek(selectedWeekStart)}
        title="Next week"
      >
        <ChevronRight size={16} />
      </button>
      {!isCurrentWeek(selectedWeekStart) && (
        <button
          style={styles.todayButton}
          onClick={handleToday}
        >
          Today
        </button>
      )}
    </div>
  );
}
