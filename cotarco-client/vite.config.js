import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Porta da API: usa 8001 para testes (--env=testing), 8000 para desenvolvimento
const apiPort = process.env.VITE_API_PORT || '8000';

// https://vite.dev/config/
export default defineConfig({
  base: '/distribuidores/', 
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    exclude: ['node_modules', 'tests/e2e/**'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Erro no proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            console.log('Requisição sendo enviada para:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes) => {
            console.log('Resposta recebida:', proxyRes.statusCode);
          });
        },
      },
    },
  },
})
