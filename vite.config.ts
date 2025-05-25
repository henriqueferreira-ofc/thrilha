import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Usar base '/thrilha/' apenas para build de produção destinado ao GitHub Pages
  const base = command === 'build' && mode === 'production' ? '/thrilha/' : '/';
  
  return {
    base,
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      open: true
    },
    preview: {
      port: 3000,
      strictPort: true,
      open: true
    },
    plugins: [
      react(),
      // Configurar o componentTagger apenas para desenvolvimento e preview do Lovable
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
      },
      manifest: true,
      ssrManifest: true
    }
  };
});
