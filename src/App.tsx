import { lazy, Suspense, useCallback, useState } from 'react'
import { Recorder } from './components/Recorder/Recorder'
import { Recognizer } from './components/Recognizer/Recognizer'
import { HistoryList } from './components/History/HistoryList'
import { HistoryDetail } from './components/History/HistoryDetail'
import { ApiKeyBanner } from './components/ApiKeyBanner'
import { ThemeToggle } from './components/ThemeToggle'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Spinner } from './components/ui/Spinner'
import { useRecorder } from './hooks/useRecorder'
import { useHistory } from './hooks/useHistory'
import { useSpaceToggle } from './hooks/useSpaceToggle'
import { useServerStatus } from './hooks/useServerStatus'
import type { HistoryItem, RecordingData } from './types'

const StreamRecognizer = lazy(() =>
  import('./components/StreamRecognizer/StreamRecognizer').then((m) => ({
    default: m.StreamRecognizer,
  }))
)
const SubtitleGenerator = lazy(() =>
  import('./components/Subtitle/SubtitleGenerator').then((m) => ({
    default: m.SubtitleGenerator,
  }))
)
const ChatDemo = lazy(() =>
  import('./components/Embed/ChatDemo').then((m) => ({ default: m.ChatDemo }))
)

type Mode = 'record' | 'stream' | 'subtitle' | 'embed'

export default function App() {
  const recorder = useRecorder()
  const history = useHistory()
  const serverStatus = useServerStatus()
  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const [mode, setMode] = useState<Mode>('record')

  const handleRecordShortcut = useCallback(() => {
    if (recorder.status === 'recording') recorder.stop()
    else if (recorder.status === 'idle') void recorder.start()
  }, [recorder])
  useSpaceToggle(
    mode === 'record' && recorder.status !== 'requesting',
    handleRecordShortcut
  )

  const handleRecognized = useCallback(
    (recording: RecordingData, text: string) => {
      history.add({
        text,
        timestamp: Date.now(),
        duration: recording.duration,
      })
    },
    [history]
  )

  const handleClear = () => {
    if (window.confirm('确定清空所有历史记录？此操作不可撤销')) {
      history.clear()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 flex justify-center"
      >
        <div className="h-[480px] w-[480px] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="fixed right-4 top-4 z-40">
        <ThemeToggle />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center gap-8 px-4 py-16 sm:px-6">
        <header className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
            Speech to Text
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            语音识别
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            录音转文字 · 翻译 · 要点提取 · 字幕生成
          </p>
        </header>

        {serverStatus.state === 'not-configured' && <ApiKeyBanner />}

        <ModeSwitcher value={mode} onChange={setMode} />

        <ErrorBoundary key={mode}>
          {mode === 'record' && (
            <>
              <Recorder {...recorder} />
              <Recognizer
                recording={recorder.recording}
                onRecognized={handleRecognized}
              />

              <div className="w-full border-t border-slate-200/70 pt-6 dark:border-slate-800/70">
                <HistoryList
                  items={history.items}
                  onSelect={setSelected}
                  onDelete={history.remove}
                  onClear={handleClear}
                />
              </div>
            </>
          )}

          {mode !== 'record' && (
            <Suspense fallback={<LazyFallback />}>
              {mode === 'stream' && <StreamRecognizer />}
              {mode === 'subtitle' && <SubtitleGenerator />}
              {mode === 'embed' && <ChatDemo />}
            </Suspense>
          )}
        </ErrorBoundary>

        <footer className="pt-4 text-xs text-slate-400 dark:text-slate-500">
          {mode === 'record' && '空格启停录音 · 单次 ≤ 30 秒 · 文件 ≤ 25 MB'}
          {mode === 'stream' && '空格启停 · 每 4 秒切块识别，边说边出字'}
          {mode === 'subtitle' && '长音频自动切分为 28 秒块后逐段识别'}
          {mode === 'embed' && '核心组件可独立分发，回调接口：onResult(text)'}
        </footer>
      </main>

      <HistoryDetail
        item={selected}
        onClose={() => setSelected(null)}
        onDelete={history.remove}
      />
    </div>
  )
}

function LazyFallback() {
  return (
    <div className="flex w-full items-center justify-center py-12">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

interface ModeSwitcherProps {
  value: Mode
  onChange: (value: Mode) => void
}

function ModeSwitcher({ value, onChange }: ModeSwitcherProps) {
  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'record', label: '语音识别' },
    { id: 'stream', label: '实时识别' },
    { id: 'subtitle', label: '字幕生成' },
    { id: 'embed', label: '嵌入演示' },
  ]
  return (
    <div
      role="tablist"
      aria-label="功能模式"
      className="flex w-full max-w-full gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 scrollbar-none dark:bg-slate-800/60 sm:inline-flex sm:w-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:px-5 ${
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

