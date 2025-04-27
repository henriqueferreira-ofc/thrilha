import type { Plugin, ViteDevServer } from 'vite';

// Configuração para o plugin SPA
export default function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: any, _res: any, next: () => void) => {
        // Se a URL não contém extensão de arquivo e não começa com /api/
        // consideramos que é uma rota do React Router
        if (req.url && !req.url.match(/\.\w+$/) && !req.url.startsWith('/api/')) {
          console.log(`SPA fallback: Redirecting ${req.url} to index.html`);
          req.url = '/';
        }
        next();
      });
    }
  };
} 