import { useEffect, useRef, useState } from 'react'
import { useRecorder } from '../../hooks/useRecorder'
import { transcribeAudio } from '../../services/api'
import type { RecordingData } from '../../types'
import { MicIcon, StopIcon } from '../ui/icons'

// 独立的语音输入控件。
// - 不依赖主应用状态，通过 onResult(text) 回调把识别结果交给宿主
// - 可以直接复用到聊天输入框、表单、评论框等任何需要语音输入的场景
// - 如需发布为 npm 包或 Web Component，以此文件为核心实现

interface VoiceInputWidgetProps {
  onResult: (text: string) => void
  onError?: (message: string) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

type Phase = 'idle' | 'recording' | 'transcribing' | 'error'

export function VoiceInputWidget({
  onResult,
  onError,
  disabled,
  size = 'md',
}: VoiceInputWidgetProps) {
  const recorder = useRecorder()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const lastProcessedRef = useRef<RecordingData | null>(null)

  useEffect(() => {
    if (recorder.status === 'recording') setPhase('recording')
  }, [recorder.status])

  useEffect(() => {
    if (!recorder.recording || recorder.recording === lastProcessedRef.current) return
    lastProcessedRef.current = recorder.recording

    setPhase('transcribing')
    setError(null)
    transcribeAudio({
      blob: recorder.recording.blob,
      duration: recorder.recording.duration,
    })
      .then((result) => {
        onResult(result.text)
        setPhase('idle')
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : '识别失败'
        setError(message)
        setPhase('error')
        onError?.(message)
      })
  }, [recorder.recording, onResult, onError])

  useEffect(() => {
    if (phase !== 'error') return
    const timer = setTimeout(() => {
      setPhase('idle')
      setError(null)
    }, 3000)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (recorder.permissionDenied) {
      setPhase('error')
      setError('需要麦克风权限')
    }
  }, [recorder.permissionDenied])

  const isRecording = phase === 'recording'
  const isTranscribing = phase === 'transcribing'

  const handleClick = () => {
    if (disabled) return
    if (isRecording) recorder.stop()
    else if (!isTranscribing) void recorder.start()
  }

  const btnSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        aria-label={isRecording ? '停止录音' : '语音输入'}
        aria-pressed={isRecording}
        className={`flex ${btnSize} items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
          isRecording
            ? 'animate-pulse bg-red-500 text-white shadow-md focus-visible:ring-red-300'
            : isTranscribing
              ? 'bg-indigo-500 text-white focus-visible:ring-indigo-300'
              : phase === 'error'
                ? 'bg-amber-100 text-amber-700 focus-visible:ring-amber-300 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 focus-visible:ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
      >
        {isTranscribing ? (
          <span
            aria-hidden
            className={`inline-block ${iconSize} animate-spin rounded-full border-2 border-white/40 border-t-white`}
          />
        ) : isRecording ? (
          <StopIcon className={iconSize} />
        ) : (
          <MicIcon className={iconSize} />
        )}
      </button>

      {isRecording && (
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 inline-flex -translate-y-1/2 items-center gap-1 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {Math.floor(recorder.elapsed)}s
        </span>
      )}

      {phase === 'error' && error && (
        <span
          role="alert"
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60"
        >
          {error}
        </span>
      )}
    </div>
  )
}
