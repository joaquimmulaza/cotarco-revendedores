import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
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
