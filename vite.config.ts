import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração do Vite
export default defineConfig(({ command, mode }) => {
  // Para GitHub Pages, use o nome do repositório como base
  // Se o repo é username.github.io, deixe como '/'
  // Se o repo é username.github.io/repo-name, use '/repo-name/'
  const base = process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/';
    
  return {
    base: mode === 'production' ? base : '/',
    server: {
      port: 8080,
      host: true,
    },
    preview: {
      port: 8080,
      host: true,
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
