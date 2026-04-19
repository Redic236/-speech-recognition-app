import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../services/api'
import { decodeAudioFile, encodeWAV, extractMonoChunk } from '../utils/audio'
import {
  distributeTextAcrossTimeline,
  type SubtitleCue,
} from '../utils/subtitle'

const CHUNK_DURATION_SECONDS = 28
const MAX_FILE_SIZE = 100 * 1024 * 1024

export type SubtitleStatus =
  | 'idle'
  | 'decoding'
  | 'processing'
  | 'success'
  | 'error'

export interface SubtitleProgress {
  current: number
  total: number
}

interface UseSubtitleGeneratorResult {
  status: SubtitleStatus
  progress: SubtitleProgress
  cues: SubtitleCue[] | null
  error: string | null
  filename: string | null
  duration: number | null
  generate: (file: File) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useSubtitleGenerator(): UseSubtitleGeneratorResult {
  const [status, setStatus] = useState<SubtitleStatus>('idle')
  const [progress, setProgress] = useState<SubtitleProgress>({ current: 0, total: 0 })
  const [cues, setCues] = useState<SubtitleCue[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setProgress({ current: 0, total: 0 })
    setCues(null)
    setError(null)
    setFilename(null)
    setDuration(null)
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const generate = useCallback(async (file: File) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('decoding')
    setProgress({ current: 0, total: 0 })
    setCues(null)
    setError(null)
    setFilename(file.name)
    setDuration(null)

    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('文件过大（>100MB），请使用较小的音频文件')
      }

      const buffer = await decodeAudioFile(file)
      if (controller.signal.aborted) return

      const totalDuration = buffer.duration
      setDuration(totalDuration)

      const totalChunks = Math.max(1, Math.ceil(totalDuration / CHUNK_DURATION_SECONDS))
      setProgress({ current: 0, total: totalChunks })
      setStatus('processing')

      const collected: SubtitleCue[] = []
      setCues([])

      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted) return

        const chunkStart = i * CHUNK_DURATION_SECONDS
        const chunkEnd = Math.min(totalDuration, chunkStart + CHUNK_DURATION_SECONDS)
        const chunkDuration = chunkEnd - chunkStart

        if (chunkDuration < 0.2) break

        const samples = extractMonoChunk(buffer, chunkStart, chunkEnd)
        const wavBlob = encodeWAV(samples, buffer.sampleRate)

        const result = await transcribeAudio({
          blob: wavBlob,
          duration: Math.ceil(chunkDuration),
          filename: `chunk-${i + 1}.wav`,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        const chunkCues: SubtitleCue[] = []
        if (result.segments && result.segments.length > 0) {
          for (const segment of result.segments) {
            chunkCues.push({
              start: chunkStart + segment.start,
              end: chunkStart + segment.end,
              text: segment.text,
            })
          }
        } else if (result.text.trim().length > 0) {
          chunkCues.push(
            ...distributeTextAcrossTimeline(result.text, chunkStart, chunkEnd)
          )
        }

        if (chunkCues.length > 0) {
          collected.push(...chunkCues)
          setCues([...collected])
        }
        setProgress({ current: i + 1, total: totalChunks })
      }

      if (controller.signal.aborted) return

      if (collected.length === 0) {
        throw new Error('未识别到任何内容，请确认音频有清晰语音')
      }

      setCues(mergeAdjacentCues(collected))
      setStatus('success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle')
        return
      }
      const message =
        err instanceof DOMException && err.name === 'EncodingError'
          ? '无法解码该音频文件，请改用 wav / mp3 / m4a / flac / ogg 格式'
          : err instanceof Error
            ? err.message
            : '字幕生成失败，请重试'
      setError(message)
      setStatus('error')
    }
  }, [])

  return { status, progress, cues, error, filename, duration, generate, cancel, reset }
}

function mergeAdjacentCues(cues: SubtitleCue[]): SubtitleCue[] {
  if (cues.length === 0) return cues
  const merged: SubtitleCue[] = []
  for (const cue of cues) {
    const prev = merged[merged.length - 1]
    if (
      prev &&
      cue.start - prev.end < 0.05 &&
      prev.end - prev.start + (cue.end - cue.start) < 6 &&
      prev.text.length + cue.text.length < 40
    ) {
      prev.end = cue.end
      prev.text = `${prev.text} ${cue.text}`.trim()
    } else {
      merged.push({ ...cue })
    }
  }
  return merged
}
