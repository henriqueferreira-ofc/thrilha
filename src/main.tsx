import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Função para desabilitar ou remover qualquer Service Worker existente
// que possa estar causando problemas de comunicação
const cleanupServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Obter todas as registrações de service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Remover todos os service workers registrados
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker desregistrado:', registration);
      }
      
      // Limpar caches que possam estar causando problemas
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(key => caches.delete(key))
        );
        console.log('Caches limpos:', cacheKeys);
      }
    } catch (error) {
      console.error('Erro ao limpar Service Workers:', error);
    }
  }
};

// Lidar com o erro de comunicação assíncrona
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason && 
    typeof event.reason.message === 'string' && 
    event.reason.message.includes('message channel closed')
  ) {
    console.warn('Detectado erro de canal de mensagem fechado. Isso geralmente é causado por Service Workers ou WebSockets.');
    event.preventDefault(); // Previne o erro de aparecer no console
    cleanupServiceWorkers(); // Tenta limpar service workers problemáticos
  }
});

// Iniciar o app após a limpeza
cleanupServiceWorkers().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
