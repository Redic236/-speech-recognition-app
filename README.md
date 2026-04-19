# 语音识别应用

纯前端实现的智谱 AI 语音识别应用，基于 GLM-ASR-2512 + GLM-4-Flash。

## 特性

**四个核心模式**（tab 懒加载）：

- **语音识别** — Web Audio API 录音 → WAV → 单次识别，结果可编辑 / 复制
- **实时识别** — 每 4 秒切块伪流式识别，边说边出字
- **字幕生成** — 长音频自动切块识别，渐进展示，一键导出 SRT / VTT
- **嵌入演示** — 独立 `VoiceInputWidget` 组件 + 聊天助手集成示例

**文本增强**：

- 翻译（英 / 日 / 韩 / 法 / 德 / 西 / 俄）
- 关键要点提取（JSON 结构化 + 容错解析）
- 说话人分离（基于 GLM-4 语义推断，非声纹）

**工程特性**：

- 历史记录 `localStorage` 持久化 + 搜索 + 按日期分组
- 深浅主题三态切换（浅色 / 深色 / 跟随系统）
- API Key 通过 Vite 反向代理，**不进入浏览器 bundle**
- `React.lazy` / `React.memo` / `ErrorBoundary` 加固

## 快速开始

前置：Node.js 18+ · 智谱 AI API Key（[open.bigmodel.cn](https://open.bigmodel.cn/)）

```bash
# 1. 安装依赖
npm install

# 2. 配置 Key
cp .env.example .env.local
# 在 .env.local 里填入：ZHIPU_API_KEY=你的key（注意：不带 VITE_ 前缀）

# 3. 启动
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
src/
├── services/            api.ts（智谱 API 封装）· storage.ts
├── hooks/               useRecorder / useRecognizer / useTranslation /
│                        useKeyPoints / useSpeakerDiarization /
│                        useStreamRecognizer / useSubtitleGenerator /
│                        useHistory / useTheme / useServerStatus /
│                        useSpaceToggle
├── components/
│   ├── Recorder/        录音按钮 + 外层
│   ├── Recognizer/      识别结果 + 翻译 / 要点 / 说话人卡
│   ├── StreamRecognizer/
│   ├── Subtitle/        字幕生成 + 下载
│   ├── Embed/           VoiceInputWidget + ChatDemo
│   ├── History/         历史列表 + 详情模态
│   └── ui/              共享图标 / Spinner
├── utils/               audio.ts（WAV 编码）· subtitle.ts（SRT/VTT）· time.ts
└── types/               共享类型
```

## API Key 安全

浏览器 → `/api/zhipu/*`（同源相对路径，无 token）
→ Vite dev server 反向代理 → `open.bigmodel.cn`（Node 端注入 `Authorization: Bearer ${ZHIPU_API_KEY}`）

环境变量名不带 `VITE_` 前缀，Vite 不会把它注入浏览器 bundle。详见 [vite.config.ts](vite.config.ts)。

> 此方案只覆盖 `npm run dev`。生产部署需自建代理服务（Express / Cloudflare Worker / Vercel Function 等），目标和逻辑与 `vite.config.ts` 里的 `server.proxy` 一致。

## 限制

- 单次录音 ≤ 30 秒（智谱 API 硬限制）
- 文件 ≤ 25 MB
- 说话人分离是**语义推断**，不是声纹——同内容不同人无法区分
- 流式模式块边界可能切词，质量略低于一次性识别

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS
智谱 AI GLM-ASR-2512（识别）· GLM-4-Flash（翻译 / 要点 / 说话人）
