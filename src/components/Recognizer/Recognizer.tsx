import { useEffect } from 'react'
import type { RecordingData } from '../../types'
import { useRecognizer } from '../../hooks/useRecognizer'
import { ResultDisplay } from './ResultDisplay'
import { Spinner } from '../ui/Spinner'
import { CloseIcon } from '../ui/icons'

interface RecognizerProps {
  recording: RecordingData | null
  onRecognized?: (recording: RecordingData, text: string) => void
}

export function Recognizer({ recording, onRecognized }: RecognizerProps) {
  const { status, text, error, recognize, reset } = useRecognizer({
    onSuccess: onRecognized,
  })

  useEffect(() => {
    reset()
  }, [recording, reset])

  if (!recording) return null

  const isLoading = status === 'loading'

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void recognize(recording)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {isLoading && <Spinner tone="white" className="h-4 w-4" />}
          {isLoading ? '识别中...' : text ? '重新识别' : '开始识别'}
        </button>
        {(text || error) && !isLoading && (
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            清除
          </button>
        )}
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="flex w-full animate-fade-in flex-col items-center gap-3 rounded-2xl bg-white/80 px-5 py-6 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/60 dark:ring-slate-800"
        >
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Spinner className="h-5 w-5" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                正在识别语音
                <LoadingDots />
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              取消
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            上传音频到智谱 AI，请稍候几秒
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="relative w-full animate-slide-up rounded-xl bg-red-50 px-4 py-3 pr-10 text-sm text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60"
        >
          <p className="font-medium">识别失败</p>
          <p className="mt-0.5 text-red-500/90 dark:text-red-400/90">{error}</p>
          <button
            type="button"
            onClick={reset}
            aria-label="关闭"
            className="absolute right-2 top-2 rounded-full p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-200"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {text && <ResultDisplay text={text} />}
    </div>
  )
}

function LoadingDots() {
  return (
    <span aria-hidden className="ml-0.5 inline-flex gap-0.5">
      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
        .
      </span>
    </span>
  )
}
