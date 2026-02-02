// GailGPT Design Tokens
// Central source of truth for UI styling
// Based on warm, cream-colored palette specification

export const colors = {
  // Backgrounds - Warm cream tones
  background: '#FAF9F7',        // soft off-white canvas
  backgroundSidebar: '#F5F0E3', // soft cream for sidebar
  backgroundInput: '#FDFCFA',   // input field background (slight cream, not pure white)
  backgroundCode: '#F5F3EF',    // soft warm gray for code

  // Message styling
  userBubble: '#F0EAE0',        // warm beige for user messages
  // Gail messages: NO bubble - render on main background

  // Accents - Soft Cornflower (warmer blue)
  primary: '#6A9FD4',           // Soft Cornflower - interactive elements
  primaryLight: '#DEEAF5',      // Pale Cornflower - hover states
  primaryFocusRing: 'rgba(106, 159, 212, 0.3)', // focus ring at 30%

  // Text - Warm tones
  textPrimary: '#2D2A26',       // warm charcoal (not pure black)
  textSecondary: '#7A756D',     // warm gray
  textOnPrimary: '#FFFFFF',     // text on primary buttons

  // Borders - Subtle warm
  border: '#E8E4DC',            // subtle warm border
  borderSubtle: '#EBE7DF',      // very subtle warm border

  // States - Muted, soft colors
  error: '#C97373',             // dusty rose
  errorBg: '#FDF5F5',           // soft error background
  success: '#5A9A6E',           // soft sage
  successBg: '#F5FBF7',         // soft success background
  warning: '#D4A853',           // soft amber

  // Send button states
  sendButtonActive: '#6A9FD4',  // Soft Cornflower when has content
  sendButtonInactive: '#C4BFB6', // warm gray when empty
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  fontFamilyBrand: "'Monument Grotesk', sans-serif", // Headlines, empty state

  body: {
    size: '16px',
    weight: 400,
    lineHeight: 1.6,
  },
  small: {
    size: '14px',
    weight: 400,
  },
  xs: {
    size: '12px',
    weight: 400,
  },
  heading: {
    size: '18px',
    weight: 600,
    lineHeight: 1.4,
  },
};

export const spacing = {
  messagePadding: '24px',       // between messages
  containerPadding: '48px',     // generous padding from edges
  inputPadding: '16px',
};

export const borderRadius = {
  messageBubble: '20px',        // user message bubbles
  input: '24px',                // input field
  sendButton: '50%',            // circular
  card: '16px',
  small: '8px',
  code: '8px',
};

export const transitions = {
  fast: '150ms ease-out',
  normal: '200ms ease-out',
};

export const layout = {
  maxContentWidth: '768px',     // centered conversation area
  sidebarWidth: '280px',
  gailIconSize: '22px',         // small Gail icon next to messages
  avatarSize: '28px',
};

export const shadows = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
  focus: '0 0 0 3px rgba(106, 159, 212, 0.3)', // Soft Cornflower focus ring
  card: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
};

// Convenience style objects for common patterns
export const commonStyles = {
  focusRing: {
    outline: 'none',
    boxShadow: shadows.focus,
  },
  transition: {
    transition: transitions.fast,
  },
};
