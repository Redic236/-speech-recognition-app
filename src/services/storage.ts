import type { HistoryItem } from '../types'

const STORAGE_KEY = 'speech-recognition:history:v1'
const MAX_ITEMS = 100

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidItem)
  } catch {
    return []
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    const trimmed = items.slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn(
      '[storage] 写入历史记录失败（可能是 localStorage 已满或被禁用），本次变更不会被持久化：',
      err
    )
  }
}

function isValidItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<HistoryItem>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.timestamp === 'number' &&
    typeof item.duration === 'number'
  )
}
