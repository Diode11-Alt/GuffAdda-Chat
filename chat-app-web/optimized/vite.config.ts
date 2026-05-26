/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Minimal Bundle Size Optimizations
  build: {
    // Target modern browsers only to drop polyfills and legacy syntax overhead
    target: 'esnext',
    
    // Disable sourcemaps for production builds to save space
    sourcemap: false,
    
    // Disable modulePreload polyfill if you are supporting only modern browsers
    modulePreload: {
      polyfill: false,
    },
    
    // Use esbuild for minification (default, fast and efficient)
    minify: 'esbuild',
    
    // CSS code splitting is enabled by default, ensuring CSS is chunked alongside JS
    cssCodeSplit: true,
    
    // Rollup-specific optimizations
    rollupOptions: {
      // Aggressive tree-shaking settings
      treeshake: {
        preset: 'recommended',
        // Assume modules have no side effects unless specified, maximizing code removal
        moduleSideEffects: 'no-external', 
      },
      output: {
        // Efficient chunk splitting
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group core React dependencies into a dedicated chunk for better caching
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-core';
            }
            // Put other third-party dependencies into a generic vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
  
  esbuild: {
    // Drop console logs and debuggers in the production build
    drop: ['console', 'debugger'],
    // Remove all legal comments to shave off extra bytes
    legalComments: 'none',
    // Minify whitespace, identifiers, and syntax aggressively
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  },
  
  // Retain existing test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  }
})
