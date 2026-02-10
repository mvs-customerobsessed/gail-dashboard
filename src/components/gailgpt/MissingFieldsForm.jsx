import { useState } from 'react';
import { FileCheck, Building2, MapPin, ChevronDown } from 'lucide-react';
import { colors, transitions, borderRadius, shadows } from './designTokens';

/**
 * MissingFieldsForm - Interactive form for collecting missing COI information
 *
 * Renders inline in ToolCard when certificate holder info is needed.
 * Groups fields by section (certificate_holder, description).
 */

const styles = {
  container: {
    padding: '16px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: '#FFFFFF',
  },

  header: {
    marginBottom: '16px',
  },

  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '4px',
  },

  description: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  section: {
    marginBottom: '16px',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.textSecondary,
    marginBottom: '12px',
  },

  field: {
    marginBottom: '12px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textPrimary,
    marginBottom: '6px',
  },

  required: {
    color: colors.error,
    marginLeft: '2px',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.small,
    backgroundColor: colors.backgroundInput,
    color: colors.textPrimary,
    transition: transitions.fast,
    outline: 'none',
    boxSizing: 'border-box',
  },

  inputFocus: {
    borderColor: colors.primary,
    boxShadow: shadows.focus,
  },

  textarea: {
    resize: 'vertical',
    minHeight: '72px',
    lineHeight: 1.5,
  },

  select: {
    appearance: 'none',
    backgroundImage: 'none',
    paddingRight: '36px',
    cursor: 'pointer',
  },

  selectWrapper: {
    position: 'relative',
  },

  selectIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: colors.textSecondary,
  },

  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 0',
  },

  checkboxInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: colors.primary,
    marginTop: '1px',
    flexShrink: 0,
  },

  checkboxLabel: {
    fontSize: '14px',
    color: colors.textPrimary,
    cursor: 'pointer',
    lineHeight: 1.4,
  },

  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: transitions.fast,
    marginTop: '8px',
  },

  submitButtonHover: {
    backgroundColor: '#5A8FC4',
  },

  submitButtonDisabled: {
    backgroundColor: colors.sendButtonInactive,
    cursor: 'not-allowed',
  },

  error: {
    fontSize: '12px',
    color: colors.error,
    marginTop: '4px',
  },

  conditionalField: {
    marginLeft: '28px',
    marginTop: '8px',
    paddingLeft: '12px',
    borderLeft: `2px solid ${colors.border}`,
  },
};

// Section icons
const sectionIcons = {
  certificate_holder: Building2,
  description: MapPin,
};

// Section display names
const sectionTitles = {
  certificate_holder: 'Certificate Holder',
  description: 'Additional Details',
};

export default function MissingFieldsForm({
  formSchema,
  onSubmit,
  isSubmitting = false,
}) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Handle input change
  const handleChange = (fieldId, value) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    formSchema.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !values[field.id]?.toString().trim()) {
          newErrors[field.id] = `${field.label} is required`;
        }
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  // Check if form is valid (all required fields filled)
  const isValid = formSchema.sections.every(section =>
    section.fields.every(field =>
      !field.required || values[field.id]?.toString().trim()
    )
  );

  // Check if additional insured is checked (for conditional field)
  const isAdditionalInsured = values['is_additional_insured'];

  // Render a single field based on type
  const renderField = (field, isConditional = false) => {
    const containerStyle = isConditional
      ? { ...styles.field, ...styles.conditionalField }
      : styles.field;

    // Skip AI type if not additional insured
    if (field.id === 'additional_insured_type' && !isAdditionalInsured) {
      return null;
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.id} style={containerStyle}>
          <label style={styles.checkboxContainer}>
            <input
              type="checkbox"
              style={styles.checkboxInput}
              checked={values[field.id] || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
            />
            <span style={styles.checkboxLabel}>{field.label}</span>
          </label>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.id} style={containerStyle}>
          <label style={styles.label}>
            {field.label}
            {field.required && <span style={styles.required}>*</span>}
          </label>
          <div style={styles.selectWrapper}>
            <select
              style={{
                ...styles.input,
                ...styles.select,
                ...(focusedField === field.id ? styles.inputFocus : {}),
              }}
              value={values[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              onFocus={() => setFocusedField(field.id)}
              onBlur={() => setFocusedField(null)}
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={styles.selectIcon} />
          </div>
          {errors[field.id] && (
            <div style={styles.error}>{errors[field.id]}</div>
          )}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} style={containerStyle}>
          <label style={styles.label}>
            {field.label}
            {field.required && <span style={styles.required}>*</span>}
          </label>
          <textarea
            style={{
              ...styles.input,
              ...styles.textarea,
              ...(focusedField === field.id ? styles.inputFocus : {}),
            }}
            placeholder={field.placeholder}
            value={values[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onFocus={() => setFocusedField(field.id)}
            onBlur={() => setFocusedField(null)}
          />
          {errors[field.id] && (
            <div style={styles.error}>{errors[field.id]}</div>
          )}
        </div>
      );
    }

    // Default: text input
    return (
      <div key={field.id} style={containerStyle}>
        <label style={styles.label}>
          {field.label}
          {field.required && <span style={styles.required}>*</span>}
        </label>
        <input
          type="text"
          style={{
            ...styles.input,
            ...(focusedField === field.id ? styles.inputFocus : {}),
          }}
          placeholder={field.placeholder}
          value={values[field.id] || ''}
          onChange={(e) => handleChange(field.id, e.target.value)}
          onFocus={() => setFocusedField(field.id)}
          onBlur={() => setFocusedField(null)}
        />
        {errors[field.id] && (
          <div style={styles.error}>{errors[field.id]}</div>
        )}
      </div>
    );
  };

  return (
    <form style={styles.container} onSubmit={handleSubmit}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>{formSchema.title}</div>
        <div style={styles.description}>{formSchema.description}</div>
      </div>

      {/* Sections */}
      {formSchema.sections.map(section => {
        const SectionIcon = sectionIcons[section.id] || Building2;
        return (
          <div key={section.id} style={styles.section}>
            <div style={styles.sectionTitle}>
              <SectionIcon size={14} />
              {sectionTitles[section.id] || section.title}
            </div>

            {section.fields.map(field => {
              // Render AI type as conditional under checkbox
              if (field.id === 'additional_insured_type') {
                return renderField(field, true);
              }
              return renderField(field);
            })}
          </div>
        );
      })}

      {/* Submit Button */}
      <button
        type="submit"
        style={{
          ...styles.submitButton,
          ...(isHovered && isValid && !isSubmitting ? styles.submitButtonHover : {}),
          ...(!isValid || isSubmitting ? styles.submitButtonDisabled : {}),
        }}
        disabled={!isValid || isSubmitting}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FileCheck size={18} />
        {isSubmitting ? 'Generating...' : (formSchema.submitButton?.label || 'Generate COI')}
      </button>
    </form>
  );
}
