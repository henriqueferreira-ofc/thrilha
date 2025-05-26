
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Determinar a base URL baseado no ambiente e modo
  let base = '/';
  
  if (command === 'build' && mode === 'production') {
    // Para GitHub Pages em produção - sempre usar /thrilha/
    base = '/thrilha/';
  }
  
  console.log(`Vite config - Command: ${command}, Mode: ${mode}, Base: ${base}`);
  
  return {
    base,
    server: {
      host: true,
      port: 8080,
      strictPort: true,
      open: true
    },
    preview: {
      port: 8080,
      strictPort: true,
      open: true
    },
    plugins: [
      react(),
      // Configurar o componentTagger apenas para desenvolvimento e preview do Lovable
      // Não incluir no build de produção para evitar interferências
      ...(command === 'build' && mode === 'production' ? [] : [componentTagger()])
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
      // Garantir que os assets sejam gerados com caminhos corretos
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  };
});
