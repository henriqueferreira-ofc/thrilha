
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
