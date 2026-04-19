import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'speech-recognition:theme'

function loadInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // ignore
  }
  return 'system'
}

function resolveEffective(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface UseThemeResult {
  theme: Theme
  effective: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  cycle: () => void
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>(() => loadInitialTheme())
  const [effective, setEffective] = useState<'light' | 'dark'>(() =>
    resolveEffective(loadInitialTheme())
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const next = resolveEffective(theme)
      setEffective(next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
    apply()
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const cycle = useCallback(() => {
    setThemeState((prev) =>
      prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'
    )
  }, [])

  return { theme, effective, setTheme, cycle }
}
