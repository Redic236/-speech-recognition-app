import { useCallback, useEffect, useRef, useState } from 'react'
import { translateText, type TranslationLangCode } from '../services/api'

export type TranslationStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseTranslationResult {
  status: TranslationStatus
  text: string | null
  lang: TranslationLangCode | null
  error: string | null
  translate: (text: string, lang: TranslationLangCode) => Promise<void>
  reset: () => void
}

export function useTranslation(): UseTranslationResult {
  const [status, setStatus] = useState<TranslationStatus>('idle')
  const [text, setText] = useState<string | null>(null)
  const [lang, setLang] = useState<TranslationLangCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const translate = useCallback(
    async (input: string, targetLang: TranslationLangCode) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setStatus('loading')
      setError(null)
      setText(null)
      setLang(targetLang)

      try {
        const result = await translateText(input, targetLang, controller.signal)
        if (controller.signal.aborted) return
        setText(result)
        setStatus('success')
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '翻译失败，请重试')
        setStatus('error')
      }
    },
    []
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setText(null)
    setLang(null)
    setError(null)
  }, [])

  return { status, text, lang, error, translate, reset }
}
