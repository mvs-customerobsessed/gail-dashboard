import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2, AlertCircle, Circle, Settings, Pause } from 'lucide-react';
import { colors, transitions } from './designTokens';
import MissingFieldsForm from './MissingFieldsForm';

/**
 * ToolCard - Displays tool execution with real-time step progress
 *
 * Unlike ThinkingBlock which shows tools collapsed, ToolCard shows steps
 * expanded by default so users can watch each step complete in real-time.
 *
 * Props:
 * - toolName: string - Display name for the tool (e.g., "Generating COI")
 * - steps: StepState[] - Array of step states
 * - isExpanded?: boolean - Default true (expanded by default)
 * - onRetry?: (stepId: string) => void - Called when user clicks retry on failed step
 *
 * StepState:
 * - id: string
 * - label: string
 * - status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting'
 * - displayValue?: string - Shows extracted value (e.g., "Hartford Insurance")
 * - error?: string - Error message for failed steps
 * - icon?: string - Emoji icon for the step
 */

const styles = {
  container: {
    backgroundColor: '#FAFAF8',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    animation: 'toolCardFadeIn 200ms ease-out',
  },

  // Header - clickable to collapse/expand
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    transition: transitions.fast,
  },

  headerIcon: {
    fontSize: '16px',
    lineHeight: 1,
  },

  headerTitle: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 600,
    color: colors.textPrimary,
  },

  headerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: colors.textSecondary,
  },

  chevron: {
    color: colors.textSecondary,
    transition: 'transform 150ms ease-out',
    flexShrink: 0,
  },

  // Steps container
  stepsContainer: {
    overflow: 'hidden',
    transition: 'max-height 250ms ease-out, opacity 200ms ease-out',
  },

  stepsList: {
    padding: '0 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  // Individual step
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 0',
    minHeight: '32px',
  },

  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    marginTop: '1px',
  },

  stepContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  stepLabel: {
    fontSize: '13px',
    lineHeight: 1.4,
    color: colors.textPrimary,
  },

  stepLabelPending: {
    color: colors.textSecondary,
  },

  stepLabelRunning: {
    color: colors.textPrimary,
    fontWeight: 500,
  },

  stepLabelCompleted: {
    color: colors.textPrimary,
  },

  stepLabelFailed: {
    color: colors.error,
  },

  stepDisplayValue: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },

  stepError: {
    fontSize: '12px',
    color: colors.error,
    marginTop: '2px',
  },

  // Step status icons
  iconPending: {
    color: '#D4D0C8',
  },

  iconRunning: {
    color: '#D4A853', // Warm amber
    animation: 'spin 1s linear infinite',
  },

  iconCompleted: {
    color: colors.success,
  },

  iconFailed: {
    color: colors.error,
  },

  iconWaiting: {
    color: '#6A9FD4', // Gail blue
  },

  // Retry button for failed steps
  retryButton: {
    fontSize: '12px',
    color: colors.gailBlue,
    background: 'none',
    border: 'none',
    padding: '2px 0',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // Result section (for completed tool with output)
  resultSection: {
    borderTop: `1px solid ${colors.border}`,
    padding: '12px 16px',
    backgroundColor: '#F5F3EF',
  },

  resultLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.textSecondary,
    marginBottom: '8px',
  },
};

// Status icons by step status
function StepIcon({ status }) {
  switch (status) {
    case 'pending':
      return <Circle size={14} style={styles.iconPending} />;
    case 'running':
      return <Loader2 size={16} style={styles.iconRunning} />;
    case 'completed':
      return <Check size={16} style={styles.iconCompleted} />;
    case 'failed':
      return <AlertCircle size={16} style={styles.iconFailed} />;
    case 'waiting':
      return <Circle size={14} style={styles.iconWaiting} fill="#6A9FD4" />;
    default:
      return <Circle size={14} style={styles.iconPending} />;
  }
}

// Get label style based on status
function getStepLabelStyle(status) {
  switch (status) {
    case 'pending':
      return { ...styles.stepLabel, ...styles.stepLabelPending };
    case 'running':
      return { ...styles.stepLabel, ...styles.stepLabelRunning };
    case 'completed':
      return { ...styles.stepLabel, ...styles.stepLabelCompleted };
    case 'failed':
      return { ...styles.stepLabel, ...styles.stepLabelFailed };
    case 'waiting':
      return { ...styles.stepLabel, ...styles.stepLabelRunning };
    default:
      return styles.stepLabel;
  }
}

// Calculate overall progress
function getProgressSummary(steps) {
  if (!steps || steps.length === 0) return { completed: 0, total: 0, status: 'pending' };

  const completed = steps.filter(s => s.status === 'completed').length;
  const failed = steps.filter(s => s.status === 'failed').length;
  const running = steps.filter(s => s.status === 'running').length;
  const waiting = steps.filter(s => s.status === 'waiting').length;

  let status = 'pending';
  if (failed > 0) status = 'failed';
  else if (completed === steps.length) status = 'completed';
  else if (running > 0) status = 'running';
  else if (waiting > 0) status = 'waiting';
  else if (completed > 0) status = 'running';

  return { completed, total: steps.length, status };
}

export default function ToolCard({
  toolName = 'Processing',
  steps = [],
  isExpanded: defaultExpanded = true,
  onRetry,
  result,
  children,
  formSchema,
  onFormSubmit,
  isFormSubmitting = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const progress = getProgressSummary(steps);

  // Format the header status text
  const getStatusText = () => {
    if (progress.status === 'completed') return 'Done';
    if (progress.status === 'failed') return 'Failed';
    if (progress.status === 'waiting') return 'Waiting for input';
    if (progress.status === 'running') return `${progress.completed}/${progress.total}`;
    return '';
  };

  return (
    <div style={styles.container}>
      {/* Header - always visible */}
      <button
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F3EF'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={styles.headerIcon}>
          {progress.status === 'completed' ? <Check size={16} style={{ color: colors.success }} /> :
           progress.status === 'failed' ? <AlertCircle size={16} style={{ color: colors.error }} /> :
           progress.status === 'waiting' ? <Pause size={16} style={{ color: '#6A9FD4' }} /> :
           <Settings size={16} style={{ color: colors.textSecondary }} />}
        </span>

        <span style={styles.headerTitle}>{toolName}</span>

        <span style={styles.headerStatus}>
          {getStatusText()}
          {progress.status === 'running' && (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </span>

        {isExpanded ? (
          <ChevronDown size={16} style={styles.chevron} />
        ) : (
          <ChevronRight size={16} style={styles.chevron} />
        )}
      </button>

      {/* Steps - expandable */}
      <div
        style={{
          ...styles.stepsContainer,
          maxHeight: isExpanded ? `${steps.length * 60 + 100}px` : '0',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div style={styles.stepsList}>
          {steps.map((step, index) => (
            <div key={step.id || index} style={styles.step}>
              {/* Step indicator - status only, no step-type icons */}
              <div style={styles.stepIndicator}>
                <StepIcon status={step.status} />
              </div>

              {/* Step content */}
              <div style={styles.stepContent}>
                <span style={getStepLabelStyle(step.status)}>
                  {step.label}
                </span>

                {/* Display value for completed steps */}
                {step.displayValue && step.status === 'completed' && (
                  <span style={styles.stepDisplayValue}>
                    {step.displayValue}
                  </span>
                )}

                {/* Error message for failed steps */}
                {step.error && step.status === 'failed' && (
                  <div>
                    <span style={styles.stepError}>{step.error}</span>
                    {onRetry && (
                      <button
                        style={styles.retryButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(step.id);
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Optional children (e.g., clarification questions) */}
        {children}

        {/* Missing fields form when step is waiting */}
        {console.log('📋 ToolCard render:', { formSchema: !!formSchema, status: progress.status, hasOnFormSubmit: !!onFormSubmit })}
        {formSchema && progress.status === 'waiting' && onFormSubmit && (
          <MissingFieldsForm
            formSchema={formSchema}
            onSubmit={onFormSubmit}
            isSubmitting={isFormSubmitting}
          />
        )}
      </div>

      {/* Result section for completed tools */}
      {result && progress.status === 'completed' && (
        <div style={styles.resultSection}>
          {result}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes toolCardFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Utility: Create step objects for COI workflow
 */
export const COI_WORKFLOW_STEPS = [
  { id: 'parse_document', label: 'Reading policy document' },
  { id: 'identify_carrier', label: 'Identifying insurance carrier' },
  { id: 'detect_coverage', label: 'Detecting coverage types' },
  { id: 'select_form', label: 'Selecting ACORD form' },
  { id: 'extract_dates', label: 'Extracting policy dates' },
  { id: 'extract_limits', label: 'Extracting coverage limits' },
  { id: 'check_missing', label: 'Checking for missing information' },
  { id: 'generate_cert', label: 'Generating certificate' },
];

/**
 * Create initial step state from step definitions
 */
export function createStepState(stepDefinitions, currentStepId = null) {
  return stepDefinitions.map((step, index) => {
    let status = 'pending';

    if (currentStepId) {
      const currentIndex = stepDefinitions.findIndex(s => s.id === currentStepId);
      if (index < currentIndex) status = 'completed';
      else if (index === currentIndex) status = 'running';
    }

    return {
      ...step,
      status,
      displayValue: null,
      error: null,
    };
  });
}
