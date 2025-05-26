import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import cname from 'vite-plugin-cname';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
      cname({ domain: 'thrilha.com' }),
      viteStaticCopy({
        targets: [
          { src: 'index.html', dest: '.', rename: '404.html' }
        ]
      })
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
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`
        }
      }
    },
  };
});
