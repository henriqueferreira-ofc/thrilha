
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração para domínio personalizado: thrilha.com
export default defineConfig(({ command, mode }) => {
  const base = '/'; // Base raiz para domínios personalizados

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
    },
  };
});
