import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordingData, RecorderStatus } from '../types'

const TARGET_SAMPLE_RATE = 16000
const MAX_DURATION_SECONDS = 30

interface UseRecorderResult {
  status: RecorderStatus
  error: string | null
  recording: RecordingData | null
  elapsed: number
  permissionDenied: boolean
  maxDuration: number
  start: () => Promise<void>
  stop: () => void
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState<RecordingData | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const chunksRef = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(TARGET_SAMPLE_RATE)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const stopImplRef = useRef<() => void>(() => {})

  const cleanup = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    try {
      processorRef.current?.disconnect()
      gainRef.current?.disconnect()
      sourceRef.current?.disconnect()
    } catch {
      // ignore
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    contextRef.current?.close().catch(() => {})
    processorRef.current = null
    gainRef.current = null
    sourceRef.current = null
    streamRef.current = null
    contextRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const start = useCallback(async () => {
    if (status === 'recording' || status === 'requesting') return

    setError(null)
    setPermissionDenied(false)
    setRecording(null)
    setElapsed(0)
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
      chunksRef.current = []
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        chunksRef.current.push(new Float32Array(input))
      }

      const silentGain = context.createGain()
      silentGain.gain.value = 0
      gainRef.current = silentGain

      source.connect(processor)
      processor.connect(silentGain)
      silentGain.connect(context.destination)

      startTimeRef.current = Date.now()
      setStatus('recording')

      timerRef.current = window.setInterval(() => {
        const seconds = (Date.now() - startTimeRef.current) / 1000
        setElapsed(seconds)
        if (seconds >= MAX_DURATION_SECONDS) {
          stopImplRef.current()
        }
      }, 100)
    } catch (err) {
      const isPermission =
        err instanceof DOMException && err.name === 'NotAllowedError'
      const message = isPermission
        ? '需要麦克风权限才能录音，请在浏览器设置中允许访问麦克风'
        : err instanceof Error
          ? err.message
          : '无法启动录音'
      setError(message)
      setPermissionDenied(isPermission)
      setStatus('error')
      cleanup()
    }
  }, [status, cleanup])

  const stop = useCallback(() => {
    if (!processorRef.current || !contextRef.current) return
    const rawDuration = (Date.now() - startTimeRef.current) / 1000
    const duration = Math.min(MAX_DURATION_SECONDS, Math.max(1, Math.round(rawDuration)))
    const blob = encodeWAV(chunksRef.current, sampleRateRef.current)
    cleanup()
    setElapsed(0)
    setRecording({ blob, duration, timestamp: Date.now() })
    setStatus('idle')
  }, [cleanup])

  useEffect(() => {
    stopImplRef.current = stop
  }, [stop])

  return {
    status,
    error,
    recording,
    elapsed,
    permissionDenied,
    maxDuration: MAX_DURATION_SECONDS,
    start,
    stop,
  }
}

function encodeWAV(chunks: Float32Array[], sampleRate: number): Blob {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const samples = new Float32Array(totalLength)
  let writeOffset = 0
  for (const chunk of chunks) {
    samples.set(chunk, writeOffset)
    writeOffset += chunk.length
  }

  const byteRate = sampleRate * 2
  const dataSize = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}
