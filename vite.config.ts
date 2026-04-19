import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 代理说明：
// - 前端向 /api/zhipu/* 发请求 → Vite dev server 把请求转发到 https://open.bigmodel.cn
// - Key 只在这里注入 Authorization 头，不会进入浏览器 bundle
// - 前端不再需要 VITE_ZHIPU_API_KEY；环境变量改名为 ZHIPU_API_KEY（无 VITE_ 前缀即不被暴露）
// - 生产部署：静态站点无后端 → 需自己起一个代理服务（Express / Cloudflare Worker / Vercel Function）
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const zhipuKey = env.ZHIPU_API_KEY

  return {
    plugins: [
      react(),
      {
        name: 'server-status',
        configureServer(server) {
          server.middlewares.use('/api/status', (_req, res) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ zhipuConfigured: Boolean(zhipuKey) }))
          })
        },
      },
    ],
    server: {
      proxy: {
        '/api/zhipu': {
          target: 'https://open.bigmodel.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/zhipu/, '/api/paas/v4'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (zhipuKey) {
                proxyReq.setHeader('Authorization', `Bearer ${zhipuKey}`)
              }
            })
          },
        },
      },
    },
  }
})
