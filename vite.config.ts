import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['html2pdf.js'],
  },
  server: {
    // Proxy API-Anfragen zu Apache/XAMPP auf Port 80
    proxy: {
      '/stimmumeter/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      // Fallback für /api wenn kein /stimmumeter Präfix
      '/api': {
        target: 'http://localhost:80/stimmumeter',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    // Kopiere .htaccess und _redirects in dist/
    copyPublicDir: true,
    outDir: 'dist',
    assetsDir: 'assets',
    // Source maps für Production (optional, entfernen für kleinere Dateien)
    sourcemap: false,
  },
});
