import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { HistoryItem } from '../../types'
import { formatRelativeTime } from '../../utils/time'
import { SearchIcon, TrashIcon } from '../ui/icons'

interface HistoryListProps {
  items: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onClear: () => void
}

interface HistoryGroup {
  label: string
  items: HistoryItem[]
}

export function HistoryList({
  items,
  onSelect,
  onDelete,
  onClear,
}: HistoryListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.text.toLowerCase().includes(q))
  }, [items, query])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  if (items.length === 0) {
    return (
      <section aria-label="识别历史" className="w-full">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          历史记录
        </h2>
        <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
          暂无识别历史，完成一次语音识别后会自动保存
        </div>
      </section>
    )
  }

  return (
    <section aria-label="识别历史" className="w-full">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          历史记录{' '}
          <span className="ml-1 text-slate-400 dark:text-slate-500">
            ({items.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
        >
          清空全部
        </button>
      </header>

      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <SearchIcon className="h-3.5 w-3.5" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索历史..."
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          没有匹配「{query}」的记录
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <HistoryRow
                      item={item}
                      onSelect={() => onSelect(item)}
                      onDelete={() => onDelete(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

interface HistoryRowProps {
  item: HistoryItem
  onSelect: () => void
  onDelete: () => void
}

function HistoryRow({ item, onSelect, onDelete }: HistoryRowProps) {
  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    onDelete()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer items-start gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300 focus:-translate-y-0.5 focus:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-slate-700 dark:focus-visible:ring-indigo-500"
    >
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          {item.text}
        </p>
        <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>{formatRelativeTime(item.timestamp)}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>{item.duration} 秒</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="删除此记录"
        className="shrink-0 rounded-full p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function groupByDate(items: HistoryItem[]): HistoryGroup[] {
  if (items.length === 0) return []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  const sevenDaysAgo = startOfToday - 7 * 86_400_000

  const groups: Record<string, HistoryItem[]> = {
    今天: [],
    昨天: [],
    '7 天内': [],
    更早: [],
  }

  for (const item of items) {
    if (item.timestamp >= startOfToday) groups['今天'].push(item)
    else if (item.timestamp >= startOfYesterday) groups['昨天'].push(item)
    else if (item.timestamp >= sevenDaysAgo) groups['7 天内'].push(item)
    else groups['更早'].push(item)
  }

  return (['今天', '昨天', '7 天内', '更早'] as const)
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ label: key, items: groups[key] }))
}
