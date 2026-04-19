import { useCallback, useEffect, useRef, useState } from 'react'
import { diarizeText } from '../services/api'
import type { DialogueTurn } from '../types'

export type DiarizationStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseSpeakerDiarizationResult {
  status: DiarizationStatus
  turns: DialogueTurn[] | null
  error: string | null
  diarize: (text: string) => Promise<void>
  reset: () => void
}

export function useSpeakerDiarization(): UseSpeakerDiarizationResult {
  const [status, setStatus] = useState<DiarizationStatus>('idle')
  const [turns, setTurns] = useState<DialogueTurn[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const diarize = useCallback(async (input: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setError(null)
    setTurns(null)

    try {
      const result = await diarizeText(input, controller.signal)
      if (controller.signal.aborted) return
      setTurns(result)
      setStatus('success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '说话人分离失败，请重试')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setTurns(null)
    setError(null)
  }, [])

  return { status, turns, error, diarize, reset }
}
