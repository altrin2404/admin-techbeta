import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Techbeta2k26 Admin Console",
        short_name: "AdminConsole",
        description: "Admin Console for Techbeta2k26",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "gzip",
      ext: ".gz",
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-avatar',
            '@radix-ui/react-select',
            'lucide-react',
            'clsx',
            'tailwind-merge'
          ],
          'vendor-motion': ['framer-motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
          'vendor-xlsx': ['xlsx'],
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
        },
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
