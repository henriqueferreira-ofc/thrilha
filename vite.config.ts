
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Usar base '/thrilha/' apenas para build de produção destinado ao GitHub Pages
  const base = command === 'build' && mode === 'production' ? '/thrilha/' : './';
  
  return {
    base,
    server: {
      port: 8080
    },
    preview: {
      port: 8080
    },
    plugins: [
      react(),
      componentTagger()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true
    }
  };
});
