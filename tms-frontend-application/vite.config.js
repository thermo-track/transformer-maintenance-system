import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // anything starting with /api will be proxied to Spring Boot
      '/api': {
        target: 'http://localhost:8080', // your Spring Boot server
        changeOrigin: true,
        secure: false,
        // if your backend has a context path, e.g. /tms, add:
        // rewrite: (path) => path.replace(/^\/api/, '/tms/api')
      },
    },
  },
});