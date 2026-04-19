import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStreamRecognizer } from '../../hooks/useStreamRecognizer'
import { useSpaceToggle } from '../../hooks/useSpaceToggle'
import { StopIcon, WaveIcon } from '../ui/icons'

export function StreamRecognizer() {
  const {
    status,
    elapsed,
    segments,
    error,
    permissionDenied,
    pendingCount,
    start,
    stop,
    reset,
  } = useStreamRecognizer()

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const transcriptRef = useRef<HTMLDivElement>(null)

  const isRecording = status === 'recording'
  const isRequesting = status === 'requesting'

  const fullText = useMemo(
    () =>
      segments
        .filter((s) => s.status === 'final')
        .map((s) => s.text)
        .filter(Boolean)
        .join(' '),
    [segments]
  )

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [segments])

  useEffect(() => {
    if (copyState === 'idle') return
    const t = setTimeout(() => setCopyState('idle'), 2000)
    return () => clearTimeout(t)
  }, [copyState])

  const handleToggle = useCallback(() => {
    if (isRecording) stop()
    else void start()
  }, [isRecording, start, stop])

  useSpaceToggle(!isRequesting, handleToggle)

  const handleCopy = async () => {
    if (!fullText) return
    try {
      await navigator.clipboard.writeText(fullText)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const hasContent = segments.length > 0

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isRequesting}
        aria-pressed={isRecording}
        className={`group relative flex h-[120px] w-[120px] items-center justify-center rounded-full text-white font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus-visible:ring-emerald-300'
        }`}
      >
        {isRecording && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-red-400/70 animate-pulse-ring"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-red-400/40 animate-pulse-ring"
              style={{ animationDelay: '0.75s' }}
            />
          </>
        )}
        <span className="relative z-10 flex flex-col items-center">
          {isRecording ? (
            <StopIcon className="mb-1 h-8 w-8" />
          ) : (
            <WaveIcon className="mb-1 h-8 w-8" />
          )}
          <span className="text-sm tracking-wide">{isRecording ? '停止' : '开始'}</span>
        </span>
      </button>

      <div className="min-h-[1.5rem] text-sm text-slate-500 dark:text-slate-400">
        {isRequesting && '正在请求麦克风权限...'}
        {isRecording && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>实时识别中</span>
            <span className="ml-1 font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {formatClock(elapsed)}
            </span>
            {pendingCount > 0 && (
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                · {pendingCount} 块识别中
              </span>
            )}
          </span>
        )}
        {status === 'idle' && !hasContent && '点击按钮开始说话，文字将实时显示'}
        {status === 'idle' && hasContent && (
          <span>
            已停止 · 共 {segments.filter((s) => s.status === 'final').length} 段
          </span>
        )}
      </div>

      {permissionDenied && (
        <div className="w-full max-w-md animate-slide-up rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60">
          <p className="font-medium">需要麦克风权限才能实时识别</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300/80">
            请在浏览器地址栏左侧的锁形图标中允许此站点访问麦克风，授予权限后重试。
          </p>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
          >
            重新请求权限
          </button>
        </div>
      )}

      {error && !permissionDenied && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      {hasContent && (
        <section
          aria-label="实时识别文本"
          className="w-full animate-fade-in rounded-2xl bg-white p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
        >
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              实时转写
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!fullText}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  copyState === 'copied'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : copyState === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {copyState === 'copied'
                  ? '已复制'
                  : copyState === 'failed'
                    ? '复制失败'
                    : '复制全部'}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={isRecording}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                清空
              </button>
            </div>
          </header>
          <div
            ref={transcriptRef}
            className="max-h-[300px] overflow-y-auto rounded-xl bg-slate-50/60 p-4 text-base leading-relaxed text-slate-800 ring-1 ring-slate-100 dark:bg-slate-800/40 dark:text-slate-100 dark:ring-slate-800"
          >
            {segments.map((segment) => (
              <SegmentChip key={segment.id} segment={segment} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface SegmentChipProps {
  segment: { id: string; text: string; status: 'pending' | 'final' | 'error' }
}

function SegmentChip({ segment }: SegmentChipProps) {
  if (segment.status === 'pending') {
    return (
      <span className="mr-1 inline-flex items-center gap-1 align-middle text-slate-400 dark:text-slate-500">
        <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-slate-400 dark:bg-slate-500" />
        <span
          className="inline-block h-1 w-1 animate-pulse rounded-full bg-slate-400 dark:bg-slate-500"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="inline-block h-1 w-1 animate-pulse rounded-full bg-slate-400 dark:bg-slate-500"
          style={{ animationDelay: '300ms' }}
        />
      </span>
    )
  }
  if (segment.status === 'error') {
    return <span className="mr-1 text-red-400 dark:text-red-300">{segment.text}</span>
  }
  return <span className="mr-1">{segment.text}</span>
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

