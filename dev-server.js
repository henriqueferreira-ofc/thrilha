import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    const server = await createServer({
      // Configuração do servidor
      server: {
        port: 8080
      },

      // Middleware para lidar com rotas SPA
      configureServer: [
        (server) => {
          server.middlewares.use((req, _, next) => {
            // Redirecionar todas as rotas para o index.html, exceto arquivos estáticos
            if (
              req.url &&
              !req.url.includes(".") &&
              !req.url.startsWith("/api/")
            ) {
              console.log(`Redirecionando ${req.url} para index.html`);
              req.url = "/";
            }
            next();
          });
        }
      ],

      // Configuração de resolução de caminho
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "src")
        }
      }
    });

    await server.listen();

    server.printUrls();
    console.log("Servidor iniciado com sucesso! Pressione Ctrl+C para parar.");
  } catch (e) {
    console.error("Erro ao iniciar o servidor:", e);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();
