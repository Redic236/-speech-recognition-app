import { useEffect, useState } from 'react'
import {
  TRANSLATION_LANGUAGES,
  getLanguageLabel,
  type TranslationLangCode,
} from '../../services/api'
import { useTranslation } from '../../hooks/useTranslation'
import { useKeyPoints } from '../../hooks/useKeyPoints'
import { useSpeakerDiarization } from '../../hooks/useSpeakerDiarization'
import { TranslationCard } from './TranslationCard'
import { KeyPointsCard } from './KeyPointsCard'
import { SpeakerCard } from './SpeakerCard'
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  SparklesIcon,
  UsersIcon,
} from '../ui/icons'
import { Spinner } from '../ui/Spinner'

interface ResultDisplayProps {
  text: string
}

type CopyState = 'idle' | 'copied' | 'failed'

const MAX_ENRICHMENT_LENGTH = 10000

export function ResultDisplay({ text }: ResultDisplayProps) {
  const [edited, setEdited] = useState(text)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [targetLang, setTargetLang] = useState<TranslationLangCode>('en')

  const translation = useTranslation()
  const keyPoints = useKeyPoints()
  const speakers = useSpeakerDiarization()

  useEffect(() => {
    setEdited(text)
    translation.reset()
    keyPoints.reset()
    speakers.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [copyState])

  const trimmed = edited.trim()
  const isTranslating = translation.status === 'loading'
  const isExtracting = keyPoints.status === 'loading'
  const isDiarizing = speakers.status === 'loading'
  const isTooLong = edited.length > MAX_ENRICHMENT_LENGTH
  const canEnrich = trimmed.length > 0 && !isTooLong

  const handleCopy = async () => {
    if (!trimmed) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmed)
      } else {
        fallbackCopy(trimmed)
      }
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const handleTranslate = () => {
    if (!canEnrich) return
    void translation.translate(trimmed, targetLang)
  }

  const handleExtract = () => {
    if (!canEnrich) return
    void keyPoints.extract(trimmed)
  }

  const handleDiarize = () => {
    if (!canEnrich) return
    void speakers.diarize(trimmed)
  }

  const copyLabel =
    copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败' : '复制'

  return (
    <div className="flex w-full flex-col gap-4">
      <section
        aria-label="识别结果"
        className="w-full animate-fade-in rounded-2xl bg-white p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            识别结果
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!trimmed}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              copyState === 'copied'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : copyState === 'failed'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {copyState === 'copied' ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
            {copyLabel}
          </button>
        </div>

        <textarea
          value={edited}
          onChange={(event) => setEdited(event.target.value)}
          aria-label="识别结果（可编辑）"
          spellCheck={false}
          className="min-h-[140px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-base leading-relaxed text-slate-800 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
        />
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            可直接编辑文本后再次操作
          </span>
          <span
            className={
              isTooLong
                ? 'font-medium text-red-500 dark:text-red-400'
                : 'text-slate-400 dark:text-slate-500'
            }
          >
            {edited.length.toLocaleString()} / {MAX_ENRICHMENT_LENGTH.toLocaleString()}
          </span>
        </div>
        {isTooLong && (
          <p
            role="alert"
            className="mt-1 text-xs text-red-500 dark:text-red-400"
          >
            文本超过 {MAX_ENRICHMENT_LENGTH.toLocaleString()} 字符，请精简后再调用翻译 / 要点 / 说话人
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <select
            value={targetLang}
            onChange={(event) =>
              setTargetLang(event.target.value as TranslationLangCode)
            }
            disabled={isTranslating}
            aria-label="翻译目标语言"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:focus:border-indigo-500"
          >
            {TRANSLATION_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleTranslate}
            disabled={!canEnrich || isTranslating}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isTranslating ? (
              <Spinner tone="white" className="h-3.5 w-3.5" />
            ) : (
              <GlobeIcon className="h-3.5 w-3.5" />
            )}
            {isTranslating ? '翻译中...' : '翻译'}
          </button>

          <button
            type="button"
            onClick={handleExtract}
            disabled={!canEnrich || isExtracting}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {isExtracting ? (
              <Spinner tone="white" className="h-3.5 w-3.5" />
            ) : (
              <SparklesIcon className="h-3.5 w-3.5" />
            )}
            {isExtracting ? '提取中...' : '关键要点'}
          </button>

          <button
            type="button"
            onClick={handleDiarize}
            disabled={!canEnrich || isDiarizing}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {isDiarizing ? (
              <Spinner tone="white" className="h-3.5 w-3.5" />
            ) : (
              <UsersIcon className="h-3.5 w-3.5" />
            )}
            {isDiarizing ? '分析中...' : '说话人'}
          </button>
        </div>
      </section>

      {translation.status !== 'idle' && (
        <TranslationCard
          status={translation.status}
          text={translation.text}
          error={translation.error}
          langLabel={getLanguageLabel(translation.lang ?? targetLang)}
          onClose={translation.reset}
        />
      )}

      {keyPoints.status !== 'idle' && (
        <KeyPointsCard
          status={keyPoints.status}
          points={keyPoints.points}
          error={keyPoints.error}
          onClose={keyPoints.reset}
        />
      )}

      {speakers.status !== 'idle' && (
        <SpeakerCard
          status={speakers.status}
          turns={speakers.turns}
          error={speakers.error}
          onClose={speakers.reset}
        />
      )}
    </div>
  )
}

function fallbackCopy(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}
