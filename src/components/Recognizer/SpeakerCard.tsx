import { memo } from 'react'
import type { DialogueTurn } from '../../types'
import type { DiarizationStatus } from '../../hooks/useSpeakerDiarization'
import { CloseIcon, UsersIcon } from '../ui/icons'
import { Spinner } from '../ui/Spinner'

interface SpeakerCardProps {
  status: DiarizationStatus
  turns: DialogueTurn[] | null
  error: string | null
  onClose: () => void
}

const SPEAKER_COLORS: Array<{ bg: string; ring: string; text: string }> = [
  {
    bg: 'bg-indigo-100 dark:bg-indigo-900/50',
    ring: 'ring-indigo-200 dark:ring-indigo-800/60',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    ring: 'ring-emerald-200 dark:ring-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    ring: 'ring-amber-200 dark:ring-amber-800/60',
    text: 'text-amber-700 dark:text-amber-300',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    ring: 'ring-rose-200 dark:ring-rose-800/60',
    text: 'text-rose-700 dark:text-rose-300',
  },
  {
    bg: 'bg-sky-100 dark:bg-sky-900/50',
    ring: 'ring-sky-200 dark:ring-sky-800/60',
    text: 'text-sky-700 dark:text-sky-300',
  },
  {
    bg: 'bg-violet-100 dark:bg-violet-900/50',
    ring: 'ring-violet-200 dark:ring-violet-800/60',
    text: 'text-violet-700 dark:text-violet-300',
  },
]

function SpeakerCardImpl({ status, turns, error, onClose }: SpeakerCardProps) {
  const speakerIndex = buildSpeakerIndex(turns)

  return (
    <section
      aria-label="说话人分离"
      className="w-full animate-slide-up rounded-2xl bg-white p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              说话人分离
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              基于语义推断，非声纹识别
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭说话人分离"
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </header>

      {status === 'loading' && (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
          <Spinner />
          正在分析对话结构...
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

      {status === 'success' && turns && turns.length > 0 && (
        <ul className="flex flex-col gap-3">
          {turns.map((turn, index) => {
            const color = SPEAKER_COLORS[speakerIndex.get(turn.speaker) ?? 0]
            return (
              <li key={`${turn.speaker}-${index}`} className="flex gap-3">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${color.bg} ${color.ring} ${color.text}`}
                >
                  {turn.speaker}
                </span>
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50/60 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/40 dark:ring-slate-800">
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider ${color.text}`}
                  >
                    说话人 {turn.speaker}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {turn.text}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function buildSpeakerIndex(turns: DialogueTurn[] | null): Map<string, number> {
  const map = new Map<string, number>()
  if (!turns) return map
  let next = 0
  for (const turn of turns) {
    if (!map.has(turn.speaker)) {
      map.set(turn.speaker, next % SPEAKER_COLORS.length)
      next++
    }
  }
  return map
}

export const SpeakerCard = memo(SpeakerCardImpl)
