import { useState } from 'react';
import { FileText, Download, X, Maximize2, Minimize2 } from 'lucide-react';
import { colors, transitions, borderRadius, typography } from './designTokens';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.background,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: colors.backgroundInput,
    borderBottom: `1px solid ${colors.border}`,
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    backgroundColor: colors.backgroundInput,
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: transitions.fast,
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    padding: '8px 16px',
    backgroundColor: colors.backgroundInput,
    borderBottom: `1px solid ${colors.border}`,
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: colors.backgroundSidebar,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: colors.textSecondary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: transitions.fast,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.textOnPrimary,
  },
  tabClose: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    marginLeft: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '48px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: colors.backgroundSidebar,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    color: colors.textSecondary,
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: colors.textSecondary,
    maxWidth: '280px',
    lineHeight: 1.5,
  },
  documentPreview: {
    backgroundColor: colors.backgroundInput,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  documentHeader: {
    padding: '16px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
  },
  documentType: {
    fontSize: '12px',
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSidebar,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  documentContent: {
    padding: '24px',
    minHeight: '400px',
  },
  acordForm: {
    fontFamily: typography.fontFamily,
    fontSize: '12px',
    lineHeight: 1.4,
  },
  acordHeader: {
    textAlign: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: `2px solid ${colors.textPrimary}`,
  },
  acordLogo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: '4px',
  },
  acordFormTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.textPrimary,
  },
  acordSection: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: colors.backgroundSidebar,
    borderRadius: '8px',
  },
  acordSectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  acordField: {
    display: 'flex',
    marginBottom: '6px',
  },
  acordFieldLabel: {
    width: '140px',
    fontSize: '11px',
    color: colors.textSecondary,
  },
  acordFieldValue: {
    flex: 1,
    fontSize: '12px',
    color: colors.textPrimary,
    fontWeight: 500,
  },
  pdfViewer: {
    width: '100%',
    height: '600px',
    border: 'none',
    borderRadius: '8px',
  },
  tablePreview: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeader: {
    backgroundColor: colors.backgroundSidebar,
    borderBottom: `2px solid ${colors.border}`,
  },
  tableCell: {
    padding: '12px',
    borderBottom: `1px solid ${colors.border}`,
    textAlign: 'left',
  },
  tableCellHeader: {
    fontWeight: 600,
    color: colors.textPrimary,
  },
};

// Render ACORD form preview
function AcordFormPreview({ artifact }) {
  const content = artifact.content || {};
  const formType = artifact.artifact_type || 'acord_25';

  return (
    <div style={styles.acordForm}>
      <div style={styles.acordHeader}>
        <div style={styles.acordLogo}>ACORD</div>
        <div style={styles.acordFormTitle}>
          {formType === 'acord_25' && 'CERTIFICATE OF LIABILITY INSURANCE'}
          {formType === 'acord_24' && 'CERTIFICATE OF PROPERTY INSURANCE'}
          {formType === 'acord_27' && 'EVIDENCE OF PROPERTY INSURANCE'}
          {formType === 'acord_28' && 'EVIDENCE OF COMMERCIAL PROPERTY INSURANCE'}
        </div>
      </div>

      {content.producer && (
        <div style={styles.acordSection}>
          <div style={styles.acordSectionTitle}>Producer</div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Name:</span>
            <span style={styles.acordFieldValue}>{content.producer.name}</span>
          </div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Address:</span>
            <span style={styles.acordFieldValue}>{content.producer.address}</span>
          </div>
          {content.producer.phone && (
            <div style={styles.acordField}>
              <span style={styles.acordFieldLabel}>Phone:</span>
              <span style={styles.acordFieldValue}>{content.producer.phone}</span>
            </div>
          )}
        </div>
      )}

      {content.insured && (
        <div style={styles.acordSection}>
          <div style={styles.acordSectionTitle}>Insured</div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Name:</span>
            <span style={styles.acordFieldValue}>{content.insured.name}</span>
          </div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Address:</span>
            <span style={styles.acordFieldValue}>{content.insured.address}</span>
          </div>
        </div>
      )}

      {content.coverages && (
        <div style={styles.acordSection}>
          <div style={styles.acordSectionTitle}>Coverages</div>
          {content.coverages.map((coverage, idx) => (
            <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: idx < content.coverages.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>{coverage.type}</div>
              <div style={styles.acordField}>
                <span style={styles.acordFieldLabel}>Policy Number:</span>
                <span style={styles.acordFieldValue}>{coverage.policyNumber}</span>
              </div>
              <div style={styles.acordField}>
                <span style={styles.acordFieldLabel}>Effective:</span>
                <span style={styles.acordFieldValue}>{coverage.effectiveDate} - {coverage.expirationDate}</span>
              </div>
              {coverage.limits && Object.entries(coverage.limits).map(([key, value]) => (
                <div key={key} style={styles.acordField}>
                  <span style={styles.acordFieldLabel}>{key}:</span>
                  <span style={styles.acordFieldValue}>{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {content.certificateHolder && (
        <div style={styles.acordSection}>
          <div style={styles.acordSectionTitle}>Certificate Holder</div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Name:</span>
            <span style={styles.acordFieldValue}>{content.certificateHolder.name}</span>
          </div>
          <div style={styles.acordField}>
            <span style={styles.acordFieldLabel}>Address:</span>
            <span style={styles.acordFieldValue}>{content.certificateHolder.address}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Render table preview
function TablePreview({ artifact }) {
  const content = artifact.content || {};
  const headers = content.headers || [];
  const rows = content.rows || [];

  return (
    <table style={styles.tablePreview}>
      <thead style={styles.tableHeader}>
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} style={{ ...styles.tableCell, ...styles.tableCellHeader }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} style={styles.tableCell}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Render document/text preview
function DocumentPreview({ artifact }) {
  const content = artifact.content || '';

  return (
    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6, color: colors.textPrimary }}>
      {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
    </div>
  );
}

export default function ArtifactPanel({ artifacts = [], currentArtifact = null, onClose }) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine saved artifacts with current streaming artifact
  const allArtifacts = currentArtifact
    ? [...artifacts.filter(a => a.id !== currentArtifact.id), currentArtifact]
    : artifacts;

  const activeArtifact = allArtifacts[activeTabIndex];

  const handleDownload = () => {
    if (!activeArtifact) return;

    // Create download based on artifact type
    const content = JSON.stringify(activeArtifact.content, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title || 'artifact'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderArtifactContent = (artifact) => {
    if (!artifact) return null;

    const type = artifact.artifact_type || artifact.type;

    switch (type) {
      case 'acord_25':
      case 'acord_24':
      case 'acord_27':
      case 'acord_28':
      case 'acord_form':
        return <AcordFormPreview artifact={artifact} />;

      case 'table':
      case 'comparison_table':
        return <TablePreview artifact={artifact} />;

      case 'pdf':
        return (
          <iframe
            src={artifact.storage_path || artifact.content?.url}
            style={styles.pdfViewer}
            title={artifact.title}
          />
        );

      default:
        return <DocumentPreview artifact={artifact} />;
    }
  };

  // Don't render empty state - parent should not render this panel if no artifacts
  if (allArtifacts.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>
          <FileText size={16} />
          Artifacts ({allArtifacts.length})
        </span>
        <div style={styles.headerActions}>
          <button
            style={styles.actionButton}
            onClick={handleDownload}
            title="Download"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryLight;
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.backgroundInput;
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            <Download size={16} />
          </button>
          <button
            style={styles.actionButton}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryLight;
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.backgroundInput;
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {onClose && (
            <button
              style={styles.actionButton}
              onClick={onClose}
              title="Close panel"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryLight;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.backgroundInput;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs for multiple artifacts */}
      {allArtifacts.length > 1 && (
        <div style={styles.tabsContainer}>
          {allArtifacts.map((artifact, idx) => (
            <button
              key={artifact.id || idx}
              style={{
                ...styles.tab,
                ...(idx === activeTabIndex ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTabIndex(idx)}
            >
              <FileText size={12} />
              {artifact.title || `Artifact ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Artifact content */}
      <div style={styles.content}>
        <div style={styles.documentPreview}>
          <div style={styles.documentHeader}>
            <span style={styles.documentTitle}>
              {activeArtifact?.title || 'Document'}
            </span>
            <span style={styles.documentType}>
              {(activeArtifact?.artifact_type || activeArtifact?.type || 'document').replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <div style={styles.documentContent}>
            {renderArtifactContent(activeArtifact)}
          </div>
        </div>
      </div>
    </div>
  );
}
