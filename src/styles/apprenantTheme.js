/**
 * 🎨 THÈME INTERFACE APPRENANT
 * Palette moderne Gris & Bleu minimaliste premium
 */

export const apprenantTheme = {
  // Couleurs principales
  colors: {
    primary: '#1E293B',      // Slate foncé
    secondary: '#3B82F6',    // Bleu
    accent: '#10B981',       // Vert succès
    error: '#EF4444',        // Rouge
    warning: '#F59E0B',      // Orange
    
    // Textes
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgTertiary: '#F1F5F9',
    bgApp: '#F8FAFC',  // Background principal uniforme de l'app
    
    // Borders
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)',
    secondary: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    card: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
  },

  // Ombres
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    hover: '0 20px 40px -10px rgba(59, 130, 246, 0.3)',
  },

  // Border radius
  radius: {
    sm: '0.375rem',    // 6px
    base: '0.5rem',    // 8px
    md: '0.75rem',     // 12px
    lg: '1rem',        // 16px
    xl: '1.25rem',     // 20px
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: 'all 0.15s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },

  // Spacing responsive
  spacing: {
    xs: 'clamp(8px, 2vw, 12px)',
    sm: 'clamp(12px, 2.5vw, 16px)',
    md: 'clamp(16px, 3vw, 24px)',
    lg: 'clamp(24px, 4vw, 32px)',
    xl: 'clamp(32px, 5vw, 48px)',
  },

  // Typography responsive
  fontSize: {
    xs: 'clamp(11px, 2vw, 12px)',
    sm: 'clamp(13px, 2.5vw, 14px)',
    base: 'clamp(14px, 3vw, 16px)',
    lg: 'clamp(16px, 3.5vw, 18px)',
    xl: 'clamp(18px, 4vw, 20px)',
    '2xl': 'clamp(20px, 4.5vw, 24px)',
    '3xl': 'clamp(24px, 5vw, 28px)',
    '4xl': 'clamp(28px, 6vw, 36px)',
  },
};

// Helper pour créer des styles de boutons
export const buttonStyles = {
  primary: {
    base: {
      background: apprenantTheme.gradients.secondary,
      color: apprenantTheme.colors.textInverse,
      border: 'none',
      padding: 'clamp(12px, 2.5vw, 14px) clamp(20px, 4vw, 24px)',
      borderRadius: apprenantTheme.radius.md,
      fontSize: apprenantTheme.fontSize.base,
      fontWeight: '600',
      cursor: 'pointer',
      transition: apprenantTheme.transitions.base,
    },
    hover: {
      transform: 'scale(1.02)',
      boxShadow: apprenantTheme.shadows.hover,
    },
  },

  secondary: {
    base: {
      background: apprenantTheme.colors.bgPrimary,
      color: apprenantTheme.colors.textSecondary,
      border: `2px solid ${apprenantTheme.colors.border}`,
      padding: 'clamp(12px, 2.5vw, 14px) clamp(20px, 4vw, 24px)',
      borderRadius: apprenantTheme.radius.md,
      fontSize: apprenantTheme.fontSize.base,
      fontWeight: '600',
      cursor: 'pointer',
      transition: apprenantTheme.transitions.base,
    },
    hover: {
      borderColor: apprenantTheme.colors.secondary,
      color: apprenantTheme.colors.secondary,
    },
  },

  success: {
    base: {
      background: apprenantTheme.gradients.success,
      color: apprenantTheme.colors.textInverse,
      border: 'none',
      padding: 'clamp(12px, 2.5vw, 14px) clamp(20px, 4vw, 24px)',
      borderRadius: apprenantTheme.radius.md,
      fontSize: apprenantTheme.fontSize.base,
      fontWeight: '600',
      cursor: 'pointer',
      transition: apprenantTheme.transitions.base,
    },
    hover: {
      transform: 'scale(1.02)',
      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
    },
  },
};

// Helper pour créer des styles de cards
export const cardStyles = {
  base: {
    background: apprenantTheme.colors.bgPrimary,
    borderRadius: apprenantTheme.radius.xl,
    padding: apprenantTheme.spacing.lg,
    boxShadow: apprenantTheme.shadows.md,
    border: `2px solid transparent`,
    transition: apprenantTheme.transitions.slow,
  },
  hover: {
    transform: 'translateY(-4px)',
    boxShadow: apprenantTheme.shadows.xl,
    borderColor: apprenantTheme.colors.secondary,
  },
};
