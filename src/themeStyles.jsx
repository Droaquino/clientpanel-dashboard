// Dynamic theme styles helper
import { themes } from './useTheme'

export const getCardStyle = (theme, baseStyle = {}) => {
  const colors = themes[theme]
  return {
    background: colors.cardBg,
    backgroundImage: colors.cardGradient,
    border: `0.5px solid ${colors.border}`,
    borderRadius: 14,
    boxShadow: theme === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.4)'
      : '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    ...baseStyle
  }
}

export const getInputStyle = (theme, baseStyle = {}) => {
  const colors = themes[theme]
  return {
    width: '100%',
    padding: '7px 12px',
    fontSize: 13,
    border: `0.5px solid ${colors.inputBorder}`,
    borderRadius: 8,
    background: colors.inputBg,
    backgroundImage: theme === 'dark'
      ? 'linear-gradient(135deg, rgba(30,30,30,0.5) 0%, rgba(25,25,25,0.5) 100%)'
      : 'linear-gradient(135deg, #fafbfa 0%, #f5f9f7 100%)',
    color: colors.text,
    outline: 'none',
    transition: 'all 0.2s ease',
    ...baseStyle
  }
}

export const getLabelStyle = (theme, baseStyle = {}) => {
  const colors = themes[theme]
  return {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    display: 'block',
    fontWeight: 500,
    ...baseStyle
  }
}

export const getButtonStyle = (theme, variant = 'secondary', baseStyle = {}) => {
  const colors = themes[theme]
  const isDark = theme === 'dark'

  const variants = {
    primary: {
      background: '#163828',
      color: '#fff',
      border: `1px solid #163828`,
      hoverBg: isDark ? '#1a4d2e' : '#0f2419',
      hoverBorder: isDark ? '#1a4d2e' : '#0f2419',
    },
    secondary: {
      background: colors.cardBg,
      color: colors.text,
      border: `0.5px solid ${colors.border}`,
      hoverBg: isDark ? 'rgba(255,255,255,.08)' : '#f5f5f5',
      hoverBorder: colors.border,
    },
    danger: {
      background: '#fff',
      color: '#A32D2D',
      border: '0.5px solid #f5c6c6',
      hoverBg: isDark ? 'rgba(255,0,0,.1)' : '#FCEBEB',
      hoverBorder: '#f5c6c6',
    }
  }

  const style = variants[variant] || variants.secondary

  return {
    fontSize: 12,
    padding: '6px 13px',
    border: style.border,
    borderRadius: 8,
    cursor: 'pointer',
    background: style.background,
    color: style.color,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    ...baseStyle
  }
}

export const getHoverStyle = (isHovered, theme, isDark = false) => {
  if (isDark === true || theme === 'dark') {
    return {
      backgroundColor: isHovered ? 'rgba(255,255,255,.08)' : 'transparent',
      transition: 'all 0.2s ease',
    }
  }
  return {
    filter: isHovered ? 'brightness(0.95)' : 'brightness(1)',
    transition: 'all 0.2s ease',
  }
}
