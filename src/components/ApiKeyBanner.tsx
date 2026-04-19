import { KeyIcon } from './ui/icons'

export function ApiKeyBanner() {
  return (
    <div
      role="alert"
      className="w-full rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/60"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
          <KeyIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">服务端未配置智谱 AI API Key</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
            Key 通过 Vite dev server 反向代理注入，只在 Node 进程里使用——不会进入浏览器 bundle。
          </p>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
            <li>
              到{' '}
              <a
                className="underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-100"
                href="https://open.bigmodel.cn/"
                target="_blank"
                rel="noreferrer"
              >
                open.bigmodel.cn
              </a>{' '}
              控制台复制 Key
            </li>
            <li>
              在项目根目录{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                .env.local
              </code>{' '}
              写入：
              <code className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                ZHIPU_API_KEY=你的key
              </code>
              （注意：**不带** <code className="font-mono">VITE_</code> 前缀）
            </li>
            <li>重启 dev server（Vite 启动时读取环境变量）</li>
          </ol>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
          >
            已配置，重新检查
          </button>
        </div>
      </div>
    </div>
  )
}
