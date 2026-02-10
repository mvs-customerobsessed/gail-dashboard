import { Download, Mail, Edit3, ExternalLink } from 'lucide-react';
import { colors } from './designTokens';

/**
 * CoiPreview - Inline preview of a generated Certificate of Insurance
 *
 * Shows a compact preview of the COI with quick actions, designed to be
 * rendered inline within the chat or as part of ToolCard result.
 */

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#F8F7F5',
    borderBottom: `1px solid ${colors.border}`,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },

  formType: {
    fontSize: '12px',
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSidebar,
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 500,
  },

  preview: {
    padding: '16px',
  },

  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },

  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  previewLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },

  previewValue: {
    fontSize: '13px',
    color: colors.textPrimary,
    fontWeight: 500,
  },

  previewValueSecondary: {
    fontSize: '12px',
    color: colors.textSecondary,
  },

  coveragesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  coverageTag: {
    padding: '4px 8px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },

  limitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${colors.border}`,
    fontSize: '13px',
  },

  limitLabel: {
    color: colors.textSecondary,
  },

  limitValue: {
    color: colors.textPrimary,
    fontWeight: 500,
  },

  actions: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#FAFAFA',
    borderTop: `1px solid ${colors.border}`,
  },

  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textPrimary,
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
  },

  primaryButton: {
    backgroundColor: '#6A9FD4',
    borderColor: '#6A9FD4',
    color: '#FFFFFF',
  },

  observations: {
    padding: '12px 16px',
    backgroundColor: '#FFFBEB',
    borderTop: `1px solid #FDE68A`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  observation: {
    fontSize: '12px',
    color: '#92400E',
    lineHeight: 1.4,
  },
};

export default function CoiPreview({ artifact, observations = [], onDownload, onEmail, onEdit }) {
  if (!artifact?.content) return null;

  const content = artifact.content;
  const formType = content.formType || artifact.artifact_type || 'ACORD_25';

  // Get coverage summary
  const coverages = content.coverages || [];
  const coverageTypes = coverages.map(c => {
    if (c.type.includes('General')) return 'GL';
    if (c.type.includes('Auto')) return 'Auto';
    if (c.type.includes('Umbrella')) return 'Umbrella';
    if (c.type.includes('Workers')) return 'WC';
    return c.type;
  });

  // Get key limits
  const glCoverage = coverages.find(c => c.type.includes('General'));
  const keyLimits = [];
  if (glCoverage?.limits) {
    if (glCoverage.limits.each_occurrence || glCoverage.limits['Each Occurrence']) {
      keyLimits.push({
        label: 'Each Occurrence',
        value: glCoverage.limits.each_occurrence || glCoverage.limits['Each Occurrence'],
      });
    }
    if (glCoverage.limits.general_aggregate || glCoverage.limits['General Aggregate']) {
      keyLimits.push({
        label: 'General Aggregate',
        value: glCoverage.limits.general_aggregate || glCoverage.limits['General Aggregate'],
      });
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.statusBadge}>
            ✓ Ready
          </span>
          <span style={styles.formType}>
            {formType.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Preview content */}
      <div style={styles.preview}>
        <div style={styles.previewGrid}>
          {/* Insured */}
          <div style={styles.previewSection}>
            <span style={styles.previewLabel}>Insured</span>
            <span style={styles.previewValue}>{content.insured?.name || 'N/A'}</span>
            <span style={styles.previewValueSecondary}>{content.insured?.address || ''}</span>
          </div>

          {/* Certificate Holder */}
          <div style={styles.previewSection}>
            <span style={styles.previewLabel}>Certificate Holder</span>
            <span style={styles.previewValue}>{content.certificateHolder?.name || 'N/A'}</span>
            <span style={styles.previewValueSecondary}>{content.certificateHolder?.address || ''}</span>
          </div>

          {/* Carrier */}
          <div style={styles.previewSection}>
            <span style={styles.previewLabel}>Carrier</span>
            <span style={styles.previewValue}>
              {content.insurers?.[0]?.name || 'N/A'}
            </span>
          </div>

          {/* Coverages */}
          <div style={styles.previewSection}>
            <span style={styles.previewLabel}>Coverages</span>
            <div style={styles.coveragesList}>
              {coverageTypes.map((type, idx) => (
                <span key={idx} style={styles.coverageTag}>{type}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Limits */}
        {keyLimits.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {keyLimits.map((limit, idx) => (
              <div key={idx} style={styles.limitRow}>
                <span style={styles.limitLabel}>{limit.label}</span>
                <span style={styles.limitValue}>{limit.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observations/Warnings */}
      {observations.length > 0 && (
        <div style={styles.observations}>
          {observations.map((obs, idx) => (
            <div key={idx} style={styles.observation}>{obs}</div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={{ ...styles.actionButton, ...styles.primaryButton }}
          onClick={onDownload}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Download size={14} />
          Download
        </button>
        <button
          style={styles.actionButton}
          onClick={onEmail}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.borderColor = colors.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          <Mail size={14} />
          Email to holder
        </button>
        <button
          style={styles.actionButton}
          onClick={onEdit}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.borderColor = colors.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          <Edit3 size={14} />
          Make changes
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline preview for showing within ToolCard result
 */
export function CoiPreviewCompact({ artifact }) {
  if (!artifact?.content) return null;

  const content = artifact.content;
  const formType = content.formType || artifact.artifact_type || 'ACORD_25';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        backgroundColor: '#EEF2FF',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}>
        📄
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: colors.textPrimary,
          marginBottom: '2px',
        }}>
          {formType.replace('_', ' ')}
        </div>
        <div style={{
          fontSize: '12px',
          color: colors.textSecondary,
        }}>
          {content.insured?.name || 'Certificate'}
        </div>
      </div>
      <ExternalLink size={16} style={{ color: colors.textSecondary }} />
    </div>
  );
}
