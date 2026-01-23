import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as hubspotApi from '../services/hubspotApi';

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  wideGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginBottom: '24px',
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
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1E293B',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '4px',
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
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #F1F5F9',
  },
  activityIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: '14px',
    color: '#1E293B',
    fontWeight: 500,
    marginBottom: '2px',
  },
  activityMeta: {
    fontSize: '12px',
    color: '#94A3B8',
  },
};

// Filter bar styles
const filterStyles = {
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    cursor: 'pointer',
    minWidth: '150px',
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#64748B',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
};

// Pipeline stage colors
const STAGE_COLORS = [
  '#0062e2',
  '#3b82f6',
  '#60a5fa',
  '#34d399',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#ef4444',
];

// Activity type config
const ACTIVITY_CONFIG = {
  call: { icon: '📞', color: '#DBEAFE', label: 'Call' },
  email: { icon: '📧', color: '#FEF3C7', label: 'Email' },
  meeting: { icon: '📅', color: '#D1FAE5', label: 'Meeting' },
  task: { icon: '✓', color: '#F3E8FF', label: 'Task' },
};

// Format currency
function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format relative time
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// Date filtering utilities
function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today, end: now };
    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { start: startOfWeek, end: now };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: now };
    }
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      const startOfQuarter = new Date(now.getFullYear(), quarterStart, 1);
      return { start: startOfQuarter, end: now };
    }
    default:
      return null;
  }
}

// Filter deals based on filter criteria
function filterDeals(deals, filters) {
  return deals.filter(deal => {
    const props = deal.properties;

    // Pipeline filter
    if (filters.pipeline !== 'all') {
      if (props.pipeline !== filters.pipeline) return false;
    }

    // Time period filter
    if (filters.timePeriod !== 'all') {
      const dateRange = getDateRange(filters.timePeriod);
      if (dateRange) {
        const dateValue = props[filters.dateField];
        if (!dateValue) return false;
        const dealDate = new Date(dateValue);
        if (dealDate < dateRange.start || dealDate > dateRange.end) return false;
      }
    }

    // Deal status filter (by stage)
    if (filters.dealStatus.length > 0) {
      if (!filters.dealStatus.includes(props.dealstage)) return false;
    }

    return true;
  });
}

// Recalculate pipeline data from filtered deals
function aggregateFilteredDealsByStage(filteredDeals, stageLookup, stageOrder) {
  const stageAggregation = {};

  filteredDeals.forEach(deal => {
    const stageId = deal.properties.dealstage;
    const amount = parseFloat(deal.properties.amount) || 0;

    if (!stageAggregation[stageId]) {
      stageAggregation[stageId] = {
        stageId,
        stageName: stageLookup[stageId]?.label || stageId,
        pipelineName: stageLookup[stageId]?.pipelineName || 'Unknown',
        dealCount: 0,
        totalValue: 0,
        order: stageOrder[stageId] || 999,
      };
    }

    stageAggregation[stageId].dealCount += 1;
    stageAggregation[stageId].totalValue += amount;
  });

  return Object.values(stageAggregation).sort((a, b) => a.order - b.order);
}

// Filter Bar Component
function FilterBar({ filters, onFilterChange, availablePipelines, availableStages, loading }) {
  const hasActiveFilters = filters.pipeline !== 'all' ||
    filters.timePeriod !== 'all' ||
    filters.dealStatus.length > 0;

  const handleClearFilters = () => {
    onFilterChange({
      pipeline: 'all',
      timePeriod: 'all',
      dateField: 'createdate',
      dealStatus: [],
    });
  };

  return (
    <div style={filterStyles.filterBar}>
      {/* Pipeline Filter */}
      <div style={filterStyles.filterGroup}>
        <label style={filterStyles.filterLabel}>Pipeline</label>
        <select
          style={filterStyles.select}
          value={filters.pipeline}
          onChange={(e) => onFilterChange({ ...filters, pipeline: e.target.value })}
          disabled={loading}
        >
          <option value="all">All Pipelines</option>
          {availablePipelines.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Time Period Filter */}
      <div style={filterStyles.filterGroup}>
        <label style={filterStyles.filterLabel}>Time Period</label>
        <select
          style={filterStyles.select}
          value={filters.timePeriod}
          onChange={(e) => onFilterChange({ ...filters, timePeriod: e.target.value })}
          disabled={loading}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Date Field Selector */}
      <div style={filterStyles.filterGroup}>
        <label style={filterStyles.filterLabel}>Date Type</label>
        <select
          style={filterStyles.select}
          value={filters.dateField}
          onChange={(e) => onFilterChange({ ...filters, dateField: e.target.value })}
          disabled={loading}
        >
          <option value="createdate">Create Date</option>
          <option value="closedate">Close Date</option>
        </select>
      </div>

      {/* Deal Status Filter */}
      <div style={filterStyles.filterGroup}>
        <label style={filterStyles.filterLabel}>Deal Stage</label>
        <select
          style={filterStyles.select}
          value={filters.dealStatus[0] || ''}
          onChange={(e) => onFilterChange({
            ...filters,
            dealStatus: e.target.value ? [e.target.value] : []
          })}
          disabled={loading}
        >
          <option value="">All Stages</option>
          {availableStages.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          style={filterStyles.clearButton}
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// Pipeline Chart Component
function PipelineChart({ data, loading, onRefresh }) {
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
          <div style={styles.cardTitle}>Deal Pipeline</div>
          <div style={styles.cardSubtitle}>Deals by stage</div>
        </div>
        <button style={styles.refreshButton} onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="stageName"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '12px',
            }}
            formatter={(value, name) => [formatCurrency(value), 'Value']}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="totalValue" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
        {data.map((stage, index) => (
          <div key={stage.stageId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length],
            }} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {stage.stageName}: {stage.dealCount} deals
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats Cards Component
function StatsCards({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div style={styles.grid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statLabel}>Loading...</div>
            <div style={styles.statValue}>-</div>
          </div>
        ))}
      </div>
    );
  }

  const pipelineValue = stats.totalPipelineValue || 0;
  const totalDeals = stats.totalDeals || 0;
  const dealsThisMonth = stats.dealsThisMonth || 0;
  const totalContacts = stats.totalContacts || 0;
  const totalCompanies = stats.totalCompanies || 0;

  return (
    <div style={styles.grid}>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Total Pipeline Value</div>
        <div style={styles.statValue}>{formatCurrency(pipelineValue)}</div>
        <div style={styles.statSubtext}>{totalDeals} active deals</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Deals This Month</div>
        <div style={styles.statValue}>{dealsThisMonth}</div>
        <div style={styles.statSubtext}>New deals created</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Total Contacts</div>
        <div style={styles.statValue}>{totalContacts.toLocaleString()}</div>
        <div style={styles.statSubtext}>In CRM</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Total Companies</div>
        <div style={styles.statValue}>{totalCompanies.toLocaleString()}</div>
        <div style={styles.statSubtext}>In CRM</div>
      </div>
    </div>
  );
}

// Recent Deals Table Component
function RecentDeals({ deals, loading, onRefresh }) {
  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Recent Deals</div>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Loading deals...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Recent Deals</div>
          <div style={styles.cardSubtitle}>Latest deal activity</div>
        </div>
        <button style={styles.refreshButton} onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>
      {deals.length === 0 ? (
        <div style={styles.emptyState}>No deals found</div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Deal Name</th>
                <th style={styles.tableHeader}>Amount</th>
                <th style={styles.tableHeader}>Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 10).map(deal => (
                <tr key={deal.id}>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: 500 }}>{deal.properties.dealname || 'Unnamed Deal'}</div>
                  </td>
                  <td style={styles.tableCell}>
                    {deal.properties.amount ? formatCurrency(parseFloat(deal.properties.amount)) : '-'}
                  </td>
                  <td style={styles.tableCell}>
                    {formatDate(deal.properties.closedate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Activities Feed Component
function ActivitiesFeed({ activities, loading, onRefresh }) {
  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Recent Activity</div>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Loading activities...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Recent Activity</div>
          <div style={styles.cardSubtitle}>Calls, emails, meetings & tasks</div>
        </div>
        <button style={styles.refreshButton} onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>
      {activities.length === 0 ? (
        <div style={styles.emptyState}>No recent activities</div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {activities.slice(0, 15).map((activity, index) => {
            const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.task;
            const title = activity.properties.hs_call_title ||
              activity.properties.hs_email_subject ||
              activity.properties.hs_meeting_title ||
              activity.properties.hs_task_subject ||
              `${config.label}`;
            const timestamp = activity.properties.hs_timestamp ||
              activity.properties.hs_meeting_start_time ||
              activity.createdAt;

            return (
              <div key={activity.id || index} style={styles.activityItem}>
                <div style={{ ...styles.activityIcon, backgroundColor: config.color }}>
                  {config.icon}
                </div>
                <div style={styles.activityContent}>
                  <div style={styles.activityTitle}>{title}</div>
                  <div style={styles.activityMeta}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: config.color,
                      color: '#1E293B',
                      marginRight: '8px',
                    }}>
                      {config.label}
                    </span>
                    {formatRelativeTime(timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main SalesTab Component
export default function SalesTab() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pipelineData, setPipelineData] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    pipeline: 'all',
    timePeriod: 'all',
    dateField: 'createdate',
    dealStatus: [],
  });
  const [availablePipelines, setAvailablePipelines] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);
  const [stageLookup, setStageLookup] = useState({});
  const [stageOrder, setStageOrder] = useState({});

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data from HubSpot
      const [pipelineResult, contactsData, companiesData, activitiesData] = await Promise.all([
        hubspotApi.getDealsByStage(),
        hubspotApi.getContacts(1),
        hubspotApi.getCompanies(1),
        hubspotApi.getActivities(20),
      ]);

      // Extract data from the enhanced result
      const {
        stages,
        pipelines,
        allStages,
        stageLookup: lookup,
        stageOrder: order,
        deals: dealsList
      } = pipelineResult;

      // Store pipeline metadata for filters
      setAvailablePipelines(pipelines);
      setAvailableStages(allStages);
      setStageLookup(lookup);
      setStageOrder(order);

      // Calculate stats from the deals we fetched
      let totalPipelineValue = 0;
      let dealsThisMonth = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      for (const deal of dealsList) {
        // Sum up the pipeline value
        const amountStr = deal.properties?.amount;
        if (amountStr) {
          const amount = parseFloat(amountStr);
          if (!isNaN(amount)) {
            totalPipelineValue += amount;
          }
        }

        // Count deals created this month
        const createDateStr = deal.properties?.createdate;
        if (createDateStr) {
          const created = new Date(createDateStr);
          if (created >= startOfMonth) {
            dealsThisMonth++;
          }
        }
      }

      const statsData = {
        totalDeals: dealsList.length,
        totalPipelineValue,
        dealsThisMonth,
        totalContacts: contactsData.total || 0,
        totalCompanies: companiesData.total || 0,
      };

      setStats(statsData);
      setPipelineData(stages);
      setDeals(dealsList);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute filtered data when filters or raw data changes
  const filteredDeals = useMemo(() => {
    if (!deals.length) return [];
    return filterDeals(deals, filters);
  }, [deals, filters]);

  const filteredPipelineData = useMemo(() => {
    if (!filteredDeals.length) return [];
    return aggregateFilteredDealsByStage(filteredDeals, stageLookup, stageOrder);
  }, [filteredDeals, stageLookup, stageOrder]);

  const filteredStats = useMemo(() => {
    if (!filteredDeals.length || !stats) return stats;

    let totalPipelineValue = 0;
    let dealsThisMonth = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const deal of filteredDeals) {
      const amount = parseFloat(deal.properties?.amount) || 0;
      totalPipelineValue += amount;

      const created = new Date(deal.properties?.createdate);
      if (created >= startOfMonth) dealsThisMonth++;
    }

    return {
      ...stats,
      totalDeals: filteredDeals.length,
      totalPipelineValue,
      dealsThisMonth,
    };
  }, [filteredDeals, stats]);

  useEffect(() => {
    async function initialize() {
      if (!hubspotApi.isConfigured()) {
        setConnectionStatus('unconfigured');
        setLoading(false);
        return;
      }

      try {
        const result = await hubspotApi.testConnection();
        if (result.success) {
          setConnectionStatus('connected');
          await fetchAllData();
        } else {
          setConnectionStatus('disconnected');
          setError(result.error);
          setLoading(false);
        }
      } catch (err) {
        setConnectionStatus('disconnected');
        setError(err.message);
        setLoading(false);
      }
    }

    initialize();
  }, [fetchAllData]);

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: styles.statusChecking, text: 'Checking connection...' },
      connected: { color: styles.statusConnected, text: 'Connected to HubSpot' },
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

  if (connectionStatus === 'checking') {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <span style={styles.loadingSpinner}></span>
          <div style={{ marginTop: '12px' }}>Connecting to HubSpot...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Sales Dashboard</h1>
        <div style={styles.subtitle}>
          HubSpot CRM Data • {renderConnectionStatus()}
        </div>
      </div>

      {connectionStatus === 'unconfigured' && (
        <div style={styles.configWarning}>
          <span style={styles.warningIcon}>⚠️</span>
          <div style={styles.warningText}>
            <strong>HubSpot not configured.</strong> Add your HubSpot Private App token to{' '}
            <code style={styles.warningCode}>.env.local</code>:
            <pre style={{ marginTop: '8px', fontSize: '12px' }}>
{`VITE_HUBSPOT_ACCESS_TOKEN=your-private-app-token`}
            </pre>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Create a Private App in HubSpot: Settings → Integrations → Private Apps
            </p>
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
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            availablePipelines={availablePipelines}
            availableStages={availableStages}
            loading={loading}
          />

          <StatsCards stats={filteredStats || {}} loading={loading} />

          <PipelineChart
            data={filteredPipelineData}
            loading={loading}
            onRefresh={fetchAllData}
          />

          <div style={styles.wideGrid}>
            <RecentDeals
              deals={filteredDeals}
              loading={loading}
              onRefresh={fetchAllData}
            />
            <ActivitiesFeed
              activities={activities}
              loading={loading}
              onRefresh={fetchAllData}
            />
          </div>
        </>
      )}
    </div>
  );
}
