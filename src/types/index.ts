export interface RecordingData {
  blob: Blob
  duration: number
  timestamp: number
}

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'error'

export interface HistoryItem {
  id: string
  text: string
  timestamp: number
  duration: number
}

export interface KeyPoint {
  keyword: string
  summary: string
}

export interface DialogueTurn {
  speaker: string
  text: string
}

export interface StreamSegment {
  id: string
  seq: number
  text: string
  status: 'pending' | 'final' | 'error'
}
