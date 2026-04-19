interface SpinnerProps {
  className?: string
  tone?: 'slate' | 'indigo' | 'white'
}

const TONE_STYLES: Record<NonNullable<SpinnerProps['tone']>, string> = {
  slate:
    'border-slate-300 border-t-slate-700 dark:border-slate-600 dark:border-t-slate-200',
  indigo:
    'border-slate-300 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400',
  white: 'border-white/40 border-t-white',
}

export function Spinner({ className = 'h-4 w-4', tone = 'indigo' }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 ${TONE_STYLES[tone]} ${className}`}
    />
  )
}
