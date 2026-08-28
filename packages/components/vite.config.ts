import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      cssFileName: 'index',
      fileName: () => 'exui.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@base-ui/react',
        '@shadcn/react',
        'class-variance-authority',
        'clsx',
        'cmdk',
        'date-fns',
        'embla-carousel-react',
        'input-otp',
        'lucide-react',
        'next-themes',
        'radix-ui',
        'react',
        'react-day-picker',
        'react-dom',
        'react/jsx-runtime',
        'react-resizable-panels',
        'recharts',
        'sonner',
        'tailwind-merge',
        'vaul',
      ],
    },
  },
})
