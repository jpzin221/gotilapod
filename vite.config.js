import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Otimizações de dependências
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  },

  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
      clientPort: 3000
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },

  build: {
    // Otimizações de build
    outDir: 'dist',
    assetsDir: 'assets',

    // Usar esbuild para minificação (mais rápido que terser)
    minify: 'esbuild',
    target: 'es2020',

    // Habilitar source maps apenas em dev
    sourcemap: false,

    // Chunk splitting avançado para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks separados
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'icons': ['lucide-react']
        },
        // Nomes otimizados para cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // Tamanho máximo de chunk (300kb para melhor performance)
    chunkSizeWarningLimit: 300,

    // CSS code splitting
    cssCodeSplit: true,

    // Compressão adicional
    reportCompressedSize: false
  },

  // Otimização de assets
  assetsInclude: ['**/*.webp', '**/*.jpg', '**/*.png', '**/*.svg'],

  // Resolver aliases para imports mais limpos
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@lib': '/src/lib',
      '@context': '/src/context'
    }
  },

  // Preview (para testar build localmente)
  preview: {
    port: 4173,
    open: true
  },

  // Performance: pré-carregar assets críticos
  experimental: {
    renderBuiltUrl(filename) {
      return filename;
    }
  }
})
