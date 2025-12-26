import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
      // Não recarregar ao trocar de aba
      clientPort: 3000
    },
    // Melhorar estabilidade
    watch: {
      usePolling: false,
      // Ignorar node_modules para performance
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  
  build: {
    // Otimizações de build
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Minificação
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true
      }
    },
    
    // Chunk splitting para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'icons-vendor': ['lucide-react']
        }
      }
    },
    
    // Tamanho máximo de chunk (500kb)
    chunkSizeWarningLimit: 500
  },
  
  // Otimização de assets
  assetsInclude: ['**/*.webp', '**/*.jpg', '**/*.png', '**/*.svg'],
  
  // Preview (para testar build localmente)
  preview: {
    port: 4173,
    open: true
  }
})
