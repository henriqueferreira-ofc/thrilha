
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('main.tsx: Iniciando aplicação...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado!');
}

console.log('main.tsx: Elemento root encontrado, criando aplicação...');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('main.tsx: Aplicação renderizada!');

if ('serviceWorker' in navigator) {
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registrado:', registration.scope);
    } catch (error) {
      console.error('Falha ao registrar o service worker:', error);
    }
  };

  if (import.meta.env.PROD) {
    window.addEventListener('load', registerServiceWorker, { once: true });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}

