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
    backgroundGradient: 'linear-gradient(180deg, #f0f2f0 0%, #e8f0e8 100%)',
    cardBg: '#fff',
    cardGradient: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,252,250,0.8) 100%)',
    text: '#111',
    textSecondary: '#555',
    textTertiary: '#888',
    border: '#e2e8e4',
    borderLight: '#f0f0f0',
    sidebarBg: '#163828',
    sidebarGradient: 'linear-gradient(180deg, #163828 0%, #0f2d1e 100%)',
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
    background: '#0f0f0f',
    backgroundGradient: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
    cardBg: '#252525',
    cardGradient: 'linear-gradient(135deg, rgba(37,37,37,0.95) 0%, rgba(30,30,30,0.9) 100%)',
    text: '#f0f0f0',
    textSecondary: '#c0c0c0',
    textTertiary: '#888888',
    border: '#404040',
    borderLight: '#505050',
    sidebarBg: '#0a0a0a',
    sidebarGradient: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)',
    sidebarText: 'rgba(255,255,255,.6)',
    sidebarTextActive: '#fff',
    sidebarHover: 'rgba(255,255,255,.15)',
    sidebarHoverActive: 'rgba(255,255,255,.15)',
    inputBg: '#1a1a1a',
    inputBorder: '#404040',
    modalOverlay: 'rgba(0,0,0,.75)',
    modalBg: '#252525',
    brandDark: '#1a4d2e',
    hoverOverlay: 'rgba(255,255,255,.05)',
  }
}
