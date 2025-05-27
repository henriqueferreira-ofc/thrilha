
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração do Vite para GitHub Pages
export default defineConfig(({ command, mode }) => {
  const base = mode === 'production' ? '/' : '/';

  return {
    base,
    server: {
      port: 8080,
    },
    preview: {
      port: 8080,
    },
    plugins: [
      react(),
      componentTagger(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
  };
});
