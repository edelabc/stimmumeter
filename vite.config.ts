import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['html2pdf.js'],
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
