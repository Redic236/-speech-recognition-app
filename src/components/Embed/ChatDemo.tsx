import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { VoiceInputWidget } from './VoiceInputWidget'
import { MicIcon } from '../ui/icons'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
  voice?: boolean
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'hello',
    role: 'assistant',
    text: '你好，我是聊天助手。点右下的麦克风说话，或者直接打字。',
    timestamp: Date.now(),
  },
]

export function ChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const sendMessage = (text: string, viaVoice = false) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const user: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
      voice: viaVoice,
    }
    setMessages((prev) => [...prev, user])
    setDraft('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: viaVoice
            ? `已收到你的语音消息：「${trimmed}」。（这里是演示回复，接入真实大模型即可替换）`
            : '已收到你的文字消息，这里是演示回复。',
          timestamp: Date.now(),
        },
      ])
    }, 400)
  }

  const handleSend = () => sendMessage(draft)

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900/60">
        <p className="font-semibold">嵌入演示</p>
        <p className="mt-1">
          下方是一个模拟的聊天助手界面。核心组件{' '}
          <code className="rounded bg-white px-1 py-0.5 text-[10px] text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
            VoiceInputWidget
          </code>{' '}
          独立于主应用，通过{' '}
          <code className="rounded bg-white px-1 py-0.5 text-[10px] text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
            onResult(text)
          </code>{' '}
          回调把识别结果交给宿主——可复用到任何表单 / 评论 / 输入场景。
        </p>
      </div>

      <section
        aria-label="聊天演示"
        className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)] dark:ring-slate-800"
      >
        <div
          ref={listRef}
          className="flex max-h-[440px] min-h-[300px] flex-col gap-3 overflow-y-auto bg-slate-50/60 p-4 dark:bg-slate-800/30"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，或点麦克风说话..."
            className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
          />
          <VoiceInputWidget size="md" onResult={(text) => sendMessage(text, true)} />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            发送
          </button>
        </div>
      </section>

      <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          如何嵌入到自己的应用
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100 dark:bg-black">
{`import { VoiceInputWidget } from './VoiceInputWidget'

function Composer() {
  const [text, setText] = useState('')
  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <VoiceInputWidget onResult={(t) => setText(prev => prev + t)} />
    </div>
  )
}`}
        </pre>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[82%] animate-fade-in flex-col gap-1 rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
        }`}
      >
        {message.voice && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] ${
              isUser ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <MicIcon className="h-3 w-3" />
            语音
          </span>
        )}
        <span className="whitespace-pre-wrap break-words">{message.text}</span>
      </div>
    </div>
  )
}
