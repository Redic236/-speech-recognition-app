import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../services/api'
import type { RecordingData } from '../types'

export type RecognizerStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseRecognizerOptions {
  onSuccess?: (recording: RecordingData, text: string) => void
}

interface UseRecognizerResult {
  status: RecognizerStatus
  text: string | null
  error: string | null
  recognize: (recording: RecordingData) => Promise<void>
  reset: () => void
}

export function useRecognizer(options: UseRecognizerOptions = {}): UseRecognizerResult {
  const { onSuccess } = options
  const [status, setStatus] = useState<RecognizerStatus>('idle')
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    []
  )

  const recognize = useCallback(async (recording: RecordingData) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setError(null)
    setText(null)

    try {
      const result = await transcribeAudio({
        blob: recording.blob,
        duration: recording.duration,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      setText(result.text)
      setStatus('success')
      onSuccess?.(recording, result.text)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : '识别失败，请重试'
      setError(message)
      setStatus('error')
    }
  }, [onSuccess])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setText(null)
    setError(null)
  }, [])

  return { status, text, error, recognize, reset }
}
