import { useEffect } from 'react'

// 监听 Space 键在非文本输入焦点下的按下事件，触发 onToggle
// - active=false 时不挂载监听
// - 聚焦 input / textarea / select / contenteditable 时不触发
export function useSpaceToggle(active: boolean, onToggle: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      onToggle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, onToggle])
}
