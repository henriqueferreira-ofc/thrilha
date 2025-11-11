import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração do Vite
export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  const base = isDev ? "/" : "./"; // garante caminhos relativos no GitHub Pages e em domínios customizados

  return {
    base,
    server: {
      port: 8080,
      host: true,
    },
    preview: {
      port: 8080,
      host: true,
    },
    plugins: [react(), componentTagger()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});
