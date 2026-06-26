import { createContext, useContext, useState, useEffect } from 'react'

// Create Theme Context
const ThemeContext = createContext()

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Initialize from localStorage
    try {
      const saved = localStorage.getItem('theme')
      return saved ? JSON.parse(saved) : 'light'
    } catch {
      return 'light'
    }
  })

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme))
  }, [theme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// useTheme Hook
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme colors object
export const themes = {
  light: {
    background: '#f0f2f0',
    cardBg: '#fff',
    text: '#111',
    textSecondary: '#555',
    textTertiary: '#888',
    border: '#e2e8e4',
    borderLight: '#f0f0f0',
    sidebarBg: '#163828',
    sidebarText: 'rgba(255,255,255,.6)',
    sidebarTextActive: '#fff',
    sidebarHover: 'rgba(255,255,255,.1)',
    sidebarHoverActive: 'rgba(255,255,255,.1)',
    inputBg: '#fff',
    inputBorder: '#ccc',
    modalOverlay: 'rgba(0,0,0,.35)',
    modalBg: '#fff',
  },
  dark: {
    background: '#1a1a1a',
    cardBg: '#2a2a2a',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textTertiary: '#888',
    border: '#3a3a3a',
    borderLight: '#404040',
    sidebarBg: '#111111',
    sidebarText: 'rgba(255,255,255,.6)',
    sidebarTextActive: '#fff',
    sidebarHover: 'rgba(255,255,255,.12)',
    sidebarHoverActive: 'rgba(255,255,255,.12)',
    inputBg: '#2a2a2a',
    inputBorder: '#3a3a3a',
    modalOverlay: 'rgba(0,0,0,.65)',
    modalBg: '#2a2a2a',
  }
}
