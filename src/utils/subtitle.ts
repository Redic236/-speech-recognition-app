export interface SubtitleCue {
  start: number
  end: number
  text: string
}

export function formatSRT(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const header = `${index + 1}`
      const timing = `${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}`
      return `${header}\n${timing}\n${cue.text}\n`
    })
    .join('\n')
}

export function formatVTT(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue) => {
      const timing = `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}`
      return `${timing}\n${cue.text}\n`
    })
    .join('\n')
  return `WEBVTT\n\n${body}`
}

export function distributeTextAcrossTimeline(
  text: string,
  startSec: number,
  endSec: number
): SubtitleCue[] {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return []

  const totalChars = sentences.reduce((sum, s) => sum + Math.max(1, s.length), 0)
  const totalDuration = Math.max(0.1, endSec - startSec)

  const cues: SubtitleCue[] = []
  let offset = 0
  for (const sentence of sentences) {
    const weight = Math.max(1, sentence.length) / totalChars
    const dur = totalDuration * weight
    cues.push({
      start: startSec + offset,
      end: startSec + offset + dur,
      text: sentence,
    })
    offset += dur
  }
  if (cues.length > 0) {
    cues[cues.length - 1].end = endSec
  }
  return cues
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  const parts = normalized.split(/(?<=[。！？!?…])\s*/)
  return parts.map((s) => s.trim()).filter((s) => s.length > 0)
}

function formatSrtTime(seconds: number): string {
  const { h, m, s, ms } = toTimeParts(seconds)
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`
}

function formatVttTime(seconds: number): string {
  const { h, m, s, ms } = toTimeParts(seconds)
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`
}

function toTimeParts(seconds: number): { h: number; m: number; s: number; ms: number } {
  const total = Math.max(0, Math.round(seconds * 1000))
  return {
    h: Math.floor(total / 3_600_000),
    m: Math.floor((total % 3_600_000) / 60_000),
    s: Math.floor((total % 60_000) / 1000),
    ms: total % 1000,
  }
}

function pad(n: number, len: number): string {
  return n.toString().padStart(len, '0')
}
