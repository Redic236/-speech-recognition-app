import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../services/api'
import { concatFloat32, encodeWAV } from '../utils/audio'
import type { StreamSegment } from '../types'

const TARGET_SAMPLE_RATE = 16000
const CHUNK_SECONDS = 4
const MIN_CHUNK_SECONDS = 0.6

export type StreamStatus = 'idle' | 'requesting' | 'recording' | 'error'

interface UseStreamRecognizerResult {
  status: StreamStatus
  elapsed: number
  segments: StreamSegment[]
  error: string | null
  permissionDenied: boolean
  pendingCount: number
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

export function useStreamRecognizer(): UseStreamRecognizerResult {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [segments, setSegments] = useState<StreamSegment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const bufferRef = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(TARGET_SAMPLE_RATE)
  const chunkTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const seqRef = useRef<number>(0)
  const pendingCountRef = useRef<number>(0)

  const updatePending = useCallback((delta: number) => {
    pendingCountRef.current = Math.max(0, pendingCountRef.current + delta)
    setPendingCount(pendingCountRef.current)
  }, [])

  const stopAudio = useCallback(() => {
    if (chunkTimerRef.current != null) {
      clearInterval(chunkTimerRef.current)
      chunkTimerRef.current = null
    }
    if (elapsedTimerRef.current != null) {
      clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }
    try {
      processorRef.current?.disconnect()
      gainRef.current?.disconnect()
      sourceRef.current?.disconnect()
    } catch {
      // ignore
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    contextRef.current?.close().catch(() => {})
    processorRef.current = null
    gainRef.current = null
    sourceRef.current = null
    streamRef.current = null
    contextRef.current = null
  }, [])

  const drainAndTranscribe = useCallback(() => {
    const pending = bufferRef.current
    if (pending.length === 0) return
    const samples = concatFloat32(pending)
    bufferRef.current = []

    const sampleRate = sampleRateRef.current
    const durationSec = samples.length / sampleRate
    if (durationSec < MIN_CHUNK_SECONDS) {
      // 太短，归还到缓冲以合并到下一块
      bufferRef.current.unshift(samples)
      return
    }

    const seq = seqRef.current++
    const id = `chunk-${seq}`
    const segment: StreamSegment = { id, seq, text: '', status: 'pending' }
    setSegments((prev) => [...prev, segment])
    updatePending(+1)

    const blob = encodeWAV(samples, sampleRate)

    transcribeAudio({
      blob,
      duration: Math.ceil(durationSec),
      filename: `chunk-${seq}.wav`,
    })
      .then((result) => {
        setSegments((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, text: result.text.trim(), status: 'final' }
              : s
          )
        )
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : '识别失败'
        setSegments((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, text: `[${message}]`, status: 'error' } : s
          )
        )
      })
      .finally(() => updatePending(-1))
  }, [updatePending])

  const stop = useCallback(() => {
    if (status !== 'recording') return
    drainAndTranscribe()
    stopAudio()
    setElapsed(0)
    setStatus('idle')
  }, [status, drainAndTranscribe, stopAudio])

  const reset = useCallback(() => {
    stopAudio()
    bufferRef.current = []
    seqRef.current = 0
    pendingCountRef.current = 0
    setPendingCount(0)
    setSegments([])
    setError(null)
    setPermissionDenied(false)
    setElapsed(0)
    setStatus('idle')
  }, [stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const start = useCallback(async () => {
    if (status === 'recording' || status === 'requesting') return

    setError(null)
    setPermissionDenied(false)
    setSegments([])
    setElapsed(0)
    seqRef.current = 0
    bufferRef.current = []
    pendingCountRef.current = 0
    setPendingCount(0)
    setStatus('requesting')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持录音功能')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext

      let context: AudioContext
      try {
        context = new AudioCtor({ sampleRate: TARGET_SAMPLE_RATE })
      } catch {
        context = new AudioCtor()
      }
      contextRef.current = context
      sampleRateRef.current = context.sampleRate

      const source = context.createMediaStreamSource(stream)
      sourceRef.current = source

      const processor = context.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        bufferRef.current.push(new Float32Array(input))
      }

      const silentGain = context.createGain()
      silentGain.gain.value = 0
      gainRef.current = silentGain

      source.connect(processor)
      processor.connect(silentGain)
      silentGain.connect(context.destination)

      startTimeRef.current = Date.now()
      setStatus('recording')

      elapsedTimerRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 200)

      chunkTimerRef.current = window.setInterval(() => {
        drainAndTranscribe()
      }, CHUNK_SECONDS * 1000)
    } catch (err) {
      const isPermission =
        err instanceof DOMException && err.name === 'NotAllowedError'
      const message = isPermission
        ? '需要麦克风权限才能开始实时识别，请在浏览器设置中允许访问麦克风'
        : err instanceof Error
          ? err.message
          : '无法启动实时识别'
      setError(message)
      setPermissionDenied(isPermission)
      setStatus('error')
      stopAudio()
    }
  }, [status, drainAndTranscribe, stopAudio])

  return {
    status,
    elapsed,
    segments,
    error,
    permissionDenied,
    pendingCount,
    start,
    stop,
    reset,
  }
}
