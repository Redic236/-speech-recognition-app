import { memo, useEffect, useState } from 'react'
import type { TranslationStatus } from '../../hooks/useTranslation'
import { CloseIcon, GlobeIcon } from '../ui/icons'
import { Spinner } from '../ui/Spinner'

interface TranslationCardProps {
  status: TranslationStatus
  text: string | null
  error: string | null
  langLabel: string
  onClose: () => void
}

function TranslationCardImpl({
  status,
  text,
  error,
  langLabel,
  onClose,
}: TranslationCardProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      aria-label="翻译结果"
      className="w-full animate-slide-up rounded-2xl bg-white p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            翻译 ·{' '}
            <span className="text-slate-700 dark:text-slate-200">{langLabel}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {status === 'success' && text && (
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? '已复制' : '复制'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭翻译"
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {status === 'loading' && (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
          <Spinner />
          正在翻译，请稍候...
        </div>
      )}

      {status === 'error' && error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60"
        >
          {error}
        </p>
      )}

      {status === 'success' && text && (
        <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50/60 p-4 text-base leading-relaxed text-slate-800 ring-1 ring-slate-100 dark:bg-slate-800/40 dark:text-slate-100 dark:ring-slate-800">
          {text}
        </p>
      )}
    </section>
  )
}

export const TranslationCard = memo(TranslationCardImpl)
