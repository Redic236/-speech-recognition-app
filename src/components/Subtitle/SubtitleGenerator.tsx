import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useSubtitleGenerator } from '../../hooks/useSubtitleGenerator'
import { formatSRT, formatVTT, type SubtitleCue } from '../../utils/subtitle'
import { CloseIcon, DownloadIcon, UploadIcon } from '../ui/icons'
import { Spinner } from '../ui/Spinner'

export function SubtitleGenerator() {
  const { status, progress, cues, error, filename, duration, generate, cancel, reset } =
    useSubtitleGenerator()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const isBusy = status === 'decoding' || status === 'processing'

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    void generate(file)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragOver(false)
    if (isBusy) return
    handleFiles(event.dataTransfer.files)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const download = (content: string, ext: 'srt' | 'vtt') => {
    const base = filename ? stripExtension(filename) : 'subtitle'
    const blob = new Blob([content], {
      type: ext === 'vtt' ? 'text/vtt' : 'application/x-subrip',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${base}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <label
        onDragOver={(event) => {
          event.preventDefault()
          if (!isBusy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white/60 px-6 py-10 text-center transition-colors dark:bg-slate-900/40 ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
        } ${isBusy ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleChange}
          disabled={isBusy}
        />
        <UploadIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            拖放音频文件到此处，或点击选择
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            支持 wav / mp3 / m4a / flac / ogg · 单文件 ≤ 100 MB
          </p>
        </div>
      </label>

      {filename && (
        <div className="flex animate-fade-in items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
              {filename}
            </p>
            {duration != null && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                时长 {formatClock(duration)}
                {status === 'processing' &&
                  ` · 处理 ${progress.current}/${progress.total} 块`}
              </p>
            )}
          </div>
          {isBusy ? (
            <button
              type="button"
              onClick={cancel}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              取消
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              清除
            </button>
          )}
        </div>
      )}

      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          className="flex animate-fade-in flex-col gap-2 rounded-2xl bg-white/80 px-5 py-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800"
        >
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <Spinner />
            {status === 'decoding' ? '正在解码音频...' : '正在识别并生成字幕...'}
          </div>
          {status === 'processing' && progress.total > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300 dark:bg-indigo-400"
                style={{
                  width: `${Math.round(
                    (progress.current / progress.total) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="relative animate-slide-up rounded-xl bg-red-50 px-4 py-3 pr-10 text-sm text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60"
        >
          <p className="font-medium">生成失败</p>
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

      {cues && cues.length > 0 && (
        <div className="flex animate-slide-up flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => download(formatSRT(cues), 'srt')}
              disabled={status !== 'success'}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              下载 SRT
            </button>
            <button
              type="button"
              onClick={() => download(formatVTT(cues), 'vtt')}
              disabled={status !== 'success'}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-indigo-400"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              下载 VTT
            </button>
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
              共 {cues.length} 条
              {status === 'processing' && (
                <span className="ml-1 text-indigo-500 dark:text-indigo-400">
                  · 实时追加中
                </span>
              )}
            </span>
          </div>
          <SubtitlePreview cues={cues} />
        </div>
      )}
    </div>
  )
}

function SubtitlePreview({ cues }: { cues: SubtitleCue[] }) {
  return (
    <section
      aria-label="字幕预览"
      className="flex max-h-[320px] flex-col gap-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
    >
      {cues.map((cue, index) => (
        <div
          key={`${cue.start}-${index}`}
          className="flex gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800"
        >
          <span className="w-28 shrink-0 font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
            {formatClock(cue.start)} → {formatClock(cue.end)}
          </span>
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
            {cue.text}
          </span>
        </div>
      ))}
    </section>
  )
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}
