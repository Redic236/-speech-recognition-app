import { memo } from 'react'
import type { KeyPoint } from '../../types'
import type { KeyPointsStatus } from '../../hooks/useKeyPoints'
import { CloseIcon, SparklesIcon } from '../ui/icons'
import { Spinner } from '../ui/Spinner'

interface KeyPointsCardProps {
  status: KeyPointsStatus
  points: KeyPoint[] | null
  error: string | null
  onClose: () => void
}

function KeyPointsCardImpl({
  status,
  points,
  error,
  onClose,
}: KeyPointsCardProps) {
  return (
    <section
      aria-label="关键要点"
      className="w-full animate-slide-up rounded-2xl bg-white p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            关键要点
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭要点"
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </header>

      {status === 'loading' && (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
          <Spinner />
          正在提取要点，请稍候...
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

      {status === 'success' && points && points.length > 0 && (
        <ul className="flex flex-col gap-2">
          {points.map((point, index) => (
            <li
              key={`${point.keyword}-${index}`}
              className="flex gap-3 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100 dark:bg-slate-800/40 dark:ring-slate-800"
            >
              <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {point.keyword}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {point.summary}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export const KeyPointsCard = memo(KeyPointsCardImpl)
