import type { DialogueTurn, KeyPoint } from '../types'

// 前端只访问同源的 /api/zhipu/* 路径。Vite dev server 会把请求反向代理到
// https://open.bigmodel.cn/api/paas/v4/*，并在 Node 端注入 Authorization 头。
// 浏览器 bundle 里不存在 API Key——详见 vite.config.ts。
const ASR_URL = '/api/zhipu/audio/transcriptions'
const CHAT_URL = '/api/zhipu/chat/completions'
const ASR_MODEL = 'glm-asr-2512'
const CHAT_MODEL = 'glm-4-flash'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_DURATION_SECONDS = 30

// ============================================================================
// 语音识别
// ============================================================================

export interface TranscriptionParams {
  blob: Blob
  duration?: number
  filename?: string
  signal?: AbortSignal
}

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  text: string
  segments?: TranscriptionSegment[]
}

interface TranscriptionResponse {
  text?: string
  segments?: Array<{ start?: number; end?: number; text?: string }>
}

export async function transcribeAudio({
  blob,
  duration,
  filename = 'recording.wav',
  signal,
}: TranscriptionParams): Promise<TranscriptionResult> {
  if (blob.size === 0) {
    throw new Error('录音数据为空，请重新录音')
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error('音频文件过大（>25MB），请缩短录音时长后重试')
  }
  if (duration !== undefined && duration > MAX_DURATION_SECONDS) {
    throw new Error(`录音时长超过 ${MAX_DURATION_SECONDS} 秒上限，请缩短后重试`)
  }

  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('model', ASR_MODEL)
  formData.append('stream', 'false')
  formData.append('language', 'zh')

  let response: Response
  try {
    response = await fetch(ASR_URL, {
      method: 'POST',
      body: formData,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error('网络错误，请检查网络连接后重试')
  }

  if (!response.ok) {
    throw new Error(await formatHttpError(response, '识别'))
  }

  const data = (await response.json().catch(() => null)) as TranscriptionResponse | null
  const text =
    data?.text?.trim() ||
    data?.segments?.map((s) => s.text ?? '').join('').trim() ||
    ''

  if (!text) {
    throw new Error('识别结果为空，请重新录制并确保语音清晰')
  }

  const segments = (data?.segments ?? [])
    .filter(
      (s): s is Required<Pick<TranscriptionSegment, 'text'>> & { start: number; end: number } =>
        typeof s.start === 'number' &&
        typeof s.end === 'number' &&
        typeof s.text === 'string'
    )
    .map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }))
    .filter((s) => s.text.length > 0)

  return { text, segments: segments.length > 0 ? segments : undefined }
}

// ============================================================================
// 翻译
// ============================================================================

export const TRANSLATION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
] as const

export type TranslationLangCode = (typeof TRANSLATION_LANGUAGES)[number]['code']

export function getLanguageLabel(code: TranslationLangCode): string {
  return TRANSLATION_LANGUAGES.find((l) => l.code === code)?.label ?? code
}

export async function translateText(
  text: string,
  targetCode: TranslationLangCode,
  signal?: AbortSignal
): Promise<string> {
  const label = getLanguageLabel(targetCode)
  return chatCompletion(
    {
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `你是一名专业翻译。请将用户提供的文本翻译为 ${label}。只输出译文，不要添加任何说明、标题、原文、引号或前后缀。保留原文的换行结构。`,
        },
        { role: 'user', content: text },
      ],
    },
    signal
  )
}

// ============================================================================
// 关键要点提取
// ============================================================================

export async function extractKeyPoints(
  text: string,
  signal?: AbortSignal
): Promise<KeyPoint[]> {
  const raw = await chatCompletion(
    {
      model: CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            '你是一个要点提取助手。从用户提供的文本中提炼 3-6 条核心要点。严格返回 JSON，结构为：{"points":[{"keyword":"短关键词","summary":"一句话说明"}]}。keyword 不超过 6 个字，summary 不超过 40 个字。不要输出任何 JSON 之外的内容，不要使用 markdown 代码块。',
        },
        { role: 'user', content: text },
      ],
    },
    signal
  )

  const points = safeParseKeyPoints(raw)
  if (points.length === 0) {
    throw new Error('未能提取到有效要点，请重试')
  }
  return points
}

// ============================================================================
// 说话人分离（基于 GLM-4 内容推断，非声纹）
// ============================================================================

export async function diarizeText(
  text: string,
  signal?: AbortSignal
): Promise<DialogueTurn[]> {
  const raw = await chatCompletion(
    {
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            '你是对话结构分析助手。请把用户文本按说话人拆分为对话轮次，依据称呼、提问/回答、人称、语气等语义线索推断说话人。说话人标签使用 A、B、C…（最多 6 个）。如果全文只有一个说话人，仍拆分为一轮即可。严格返回 JSON：{"turns":[{"speaker":"A","text":"完整发言"}]}。不要输出 JSON 之外的任何内容，不要使用 markdown 代码块，不要改写原文内容。',
        },
        { role: 'user', content: text },
      ],
    },
    signal
  )

  const turns = safeParseTurns(raw)
  if (turns.length === 0) {
    throw new Error('未能解析说话人结构，请重试')
  }
  return turns
}

function safeParseTurns(raw: string): DialogueTurn[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    const obj: unknown = JSON.parse(cleaned)
    if (!obj || typeof obj !== 'object') return []
    const turns = (obj as { turns?: unknown }).turns
    if (!Array.isArray(turns)) return []
    return turns
      .filter(
        (t: unknown): t is DialogueTurn =>
          !!t &&
          typeof t === 'object' &&
          typeof (t as DialogueTurn).speaker === 'string' &&
          typeof (t as DialogueTurn).text === 'string'
      )
      .map((t) => ({
        speaker: t.speaker.trim().slice(0, 4) || 'A',
        text: t.text.trim(),
      }))
      .filter((t) => t.text.length > 0)
      .slice(0, 40)
  } catch {
    return []
  }
}

function safeParseKeyPoints(raw: string): KeyPoint[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    const obj: unknown = JSON.parse(cleaned)
    if (!obj || typeof obj !== 'object') return []
    const points = (obj as { points?: unknown }).points
    if (!Array.isArray(points)) return []
    return points
      .filter(
        (p: unknown): p is KeyPoint =>
          !!p &&
          typeof p === 'object' &&
          typeof (p as KeyPoint).keyword === 'string' &&
          typeof (p as KeyPoint).summary === 'string'
      )
      .slice(0, 6)
  } catch {
    return []
  }
}

// ============================================================================
// Chat 调用（翻译 / 要点 / 说话人共用）
// ============================================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  model: string
  messages: ChatMessage[]
  temperature?: number
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

async function chatCompletion(
  body: ChatRequestBody,
  signal?: AbortSignal
): Promise<string> {
  let response: Response
  try {
    response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error('网络错误，请检查网络连接后重试')
  }

  if (!response.ok) {
    throw new Error(await formatHttpError(response, '请求'))
  }

  const data = (await response.json().catch(() => null)) as ChatResponse | null
  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('模型未返回内容，请重试')
  }
  return content
}

// ============================================================================
// 错误格式化
// ============================================================================

async function formatHttpError(response: Response, action: string): Promise<string> {
  let detail = ''
  try {
    const body = await response.json()
    detail = body?.error?.message || body?.message || ''
  } catch {
    detail = await response.text().catch(() => '')
  }

  switch (response.status) {
    case 401:
      return '服务端配置的 API Key 无效或已过期，请检查 .env.local 中的 ZHIPU_API_KEY'
    case 403:
      return 'API 访问被拒绝，请确认账户权限与余额'
    case 404:
      return '代理路径未找到，请确认正在使用 vite dev server 并且 vite.config.ts 已配置代理'
    case 413:
      return '请求体过大，请缩短内容后重试'
    case 429:
      return '请求过于频繁，请稍后再试'
    case 500:
    case 502:
    case 503:
    case 504:
      return '智谱 AI 服务暂时不可用，请稍后重试'
    default:
      return detail ? `${action}失败：${detail}` : `${action}失败（状态码 ${response.status}）`
  }
}
