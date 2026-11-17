import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copyFileSync } from 'node:fs';

import { defineConfig } from '@vben/vite-config';

import { loadDemoBase } from '../../scripts/demo-deployment.mjs';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      base: loadDemoBase(),
      resolve: {
        alias: {
          '@wangeditor/editor-for-vue': fileURLToPath(
            new URL('./src/wangeditor-shim.js', import.meta.url),
          ),
        },
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:5321/api',
            ws: true,
          },
        },
      },
      plugins: [
        {
          name: 'standalone-report-entry-points',
          closeBundle() {
            const appEntry = fileURLToPath(
              new URL('./dist/index.html', import.meta.url),
            );
            const reportEntry = fileURLToPath(
              new URL('./dist/report-share.html', import.meta.url),
            );
            copyFileSync(appEntry, reportEntry);
          },
        },
        {
          name: 'serve-public-markdown',
          configureServer(server) {
            const markdownMiddleware = (req, res, next) => {
              const url = req.url ?? '';
              const cleanUrl = url.split('?')[0];
              if (!cleanUrl.endsWith('.md')) {
                next();
                return;
              }
              const base = server.config.base;
              const relativePath = cleanUrl.startsWith(base)
                ? cleanUrl.slice(base.length)
                : cleanUrl.replace(/^\//, '');
              const filePath = join(server.config.publicDir, relativePath);
              if (existsSync(filePath)) {
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
                res.end(readFileSync(filePath, 'utf-8'));
                return;
              }
              next();
            };
            // 返回的函数在 Vite 内部中间件安装后执行，unshift 确保在 SPA fallback 之前拦截
            return () => {
              server.middlewares.stack.unshift({
                route: '',
                handle: markdownMiddleware,
              });
            };
          },
        },
      ],
    },
  };
});
