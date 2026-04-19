import { useCallback, useEffect, useRef, useState } from 'react'
import { extractKeyPoints } from '../services/api'
import type { KeyPoint } from '../types'

export type KeyPointsStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseKeyPointsResult {
  status: KeyPointsStatus
  points: KeyPoint[] | null
  error: string | null
  extract: (text: string) => Promise<void>
  reset: () => void
}

export function useKeyPoints(): UseKeyPointsResult {
  const [status, setStatus] = useState<KeyPointsStatus>('idle')
  const [points, setPoints] = useState<KeyPoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const extract = useCallback(async (input: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setError(null)
    setPoints(null)

    try {
      const result = await extractKeyPoints(input, controller.signal)
      if (controller.signal.aborted) return
      setPoints(result)
      setStatus('success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '要点提取失败，请重试')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setPoints(null)
    setError(null)
  }, [])

  return { status, points, error, extract, reset }
}
