import { useEffect, useState } from 'react'

export type ServerStatus =
  | { state: 'loading' }
  | { state: 'configured' }
  | { state: 'not-configured' }
  | { state: 'unknown' }

// 查询 Vite dev server 暴露的 /api/status，确认代理是否配置了 ZHIPU_API_KEY。
// 该接口仅在开发环境可用；生产部署（静态站点无后端）时返回 unknown，
// 由用户部署的代理服务自行决定。
export function useServerStatus(): ServerStatus {
  const [status, setStatus] = useState<ServerStatus>({ state: 'loading' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) {
          setStatus({ state: 'unknown' })
          return
        }
        const data = (await res.json()) as { zhipuConfigured?: boolean }
        if (cancelled) return
        setStatus({
          state: data?.zhipuConfigured ? 'configured' : 'not-configured',
        })
      } catch {
        if (!cancelled) setStatus({ state: 'unknown' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return status
}
