import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog', 
            '@radix-ui/react-toast',
            '@radix-ui/react-progress',
            '@radix-ui/react-tabs'
          ],
          'utils-vendor': [
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ]
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  }
}));
