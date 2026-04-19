import { useEffect, useState } from 'react'
import type { RecordingData, RecorderStatus } from '../../types'
import { RecorderButton } from './RecorderButton'

interface RecorderProps {
  status: RecorderStatus
  error: string | null
  recording: RecordingData | null
  elapsed: number
  permissionDenied: boolean
  maxDuration: number
  start: () => Promise<void>
  stop: () => void
}

export function Recorder({
  status,
  error,
  recording,
  elapsed,
  permissionDenied,
  maxDuration,
  start,
  stop,
}: RecorderProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const isRecording = status === 'recording'
  const isRequesting = status === 'requesting'

  useEffect(() => {
    if (!recording) {
      setAudioUrl(null)
      return
    }
    const url = URL.createObjectURL(recording.blob)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [recording])

  const handleClick = () => {
    if (isRecording) stop()
    else void start()
  }

  const elapsedSec = Math.floor(elapsed)
  const remaining = Math.max(0, maxDuration - elapsedSec)
  const progress = maxDuration > 0 ? elapsed / maxDuration : 0

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <RecorderButton
        isRecording={isRecording}
        disabled={isRequesting}
        onClick={handleClick}
        progress={progress}
      />

      <div className="min-h-[1.5rem] text-sm text-slate-500 dark:text-slate-400">
        {isRequesting && '正在请求麦克风权限...'}
        {isRecording && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>录音中</span>
            <span className="ml-1 font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {formatTime(elapsedSec)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500">
              {formatTime(maxDuration)}
            </span>
            <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
              · 剩余 {remaining}s
            </span>
          </span>
        )}
        {status === 'idle' && !recording && (
          <span>
            点击按钮或按{' '}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              空格
            </kbd>{' '}
            开始录音（最长 30 秒）
          </span>
        )}
        {status === 'idle' && recording && (
          <span className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <span>{recording.duration} 秒</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>{(recording.blob.size / 1024).toFixed(1)} KB</span>
          </span>
        )}
      </div>

      {permissionDenied && (
        <div className="w-full max-w-md animate-slide-up rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60">
          <p className="font-medium">需要麦克风权限才能录音</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300/80">
            请在浏览器地址栏左侧的锁形图标中允许此站点访问麦克风，授予权限后点击下方按钮重试。
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

      {audioUrl && (
        <audio className="w-full max-w-md rounded-full" controls src={audioUrl} />
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `0:${s.toString().padStart(2, '0')}`
}
