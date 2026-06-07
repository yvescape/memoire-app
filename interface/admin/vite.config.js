import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/users':     { target: 'http://localhost:8001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/users/, '') },
      '/api/products':  { target: 'http://localhost:8002', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/products/, '') },
      '/api/orders':    { target: 'http://localhost:8003', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/orders/, '') },
      '/api/payments':  { target: 'http://localhost:8004', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/payments/, '') },
      '/api/interation':{ target: 'http://localhost:8005', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/interation/, '') },
    },
  },
});
