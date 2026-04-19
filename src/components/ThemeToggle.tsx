import { useTheme, type Theme } from '../hooks/useTheme'
import { MoonIcon, SunIcon, SystemIcon } from './ui/icons'

const LABELS: Record<Theme, string> = {
  light: '浅色模式',
  dark: '深色模式',
  system: '跟随系统',
}

export function ThemeToggle() {
  const { theme, cycle } = useTheme()

  const Icon =
    theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : SystemIcon

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`当前：${LABELS[theme]}，点击切换`}
      title={LABELS[theme]}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
