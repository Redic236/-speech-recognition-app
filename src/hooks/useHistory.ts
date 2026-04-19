import { useCallback, useEffect, useState } from 'react'
import type { HistoryItem } from '../types'
import { loadHistory, saveHistory } from '../services/storage'

interface UseHistoryResult {
  items: HistoryItem[]
  add: (input: Omit<HistoryItem, 'id'>) => HistoryItem
  remove: (id: string) => void
  clear: () => void
}

export function useHistory(): UseHistoryResult {
  const [items, setItems] = useState<HistoryItem[]>(() => loadHistory())

  useEffect(() => {
    saveHistory(items)
  }, [items])

  const add = useCallback((input: Omit<HistoryItem, 'id'>): HistoryItem => {
    const item: HistoryItem = { ...input, id: createId() }
    setItems((prev) => [item, ...prev])
    return item
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  return { items, add, remove, clear }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
