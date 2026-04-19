import { useEffect, useState } from 'react'
import type { HistoryItem } from '../../types'
import { formatDateTime } from '../../utils/time'
import { CloseIcon } from '../ui/icons'

interface HistoryDetailProps {
  item: HistoryItem | null
  onClose: () => void
  onDelete: (id: string) => void
}

export function HistoryDetail({ item, onClose, onDelete }: HistoryDetailProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!item) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [item, onClose])

  useEffect(() => {
    setCopied(false)
  }, [item])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  if (!item) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const handleDelete = () => {
    onDelete(item.id)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="识别记录详情"
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
      />
      <div className="relative w-full max-w-lg animate-slide-up rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              识别详情
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatDateTime(item.timestamp)} · 时长 {item.duration} 秒
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[50vh] overflow-y-auto rounded-xl bg-slate-50 p-4 text-base leading-relaxed text-slate-800 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:text-slate-100 dark:ring-slate-800">
          {item.text}
        </div>

        <footer className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            删除
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              关闭
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
