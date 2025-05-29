
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('main.tsx: Iniciando aplicação...');
console.log('Environment:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento root não encontrado!');
  // Criar elemento root se não existir
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  newRoot.style.minHeight = '100vh';
  newRoot.style.background = '#000';
  document.body.appendChild(newRoot);
}

console.log('main.tsx: Elemento root encontrado, criando aplicação...');

try {
  ReactDOM.createRoot(rootElement || document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('main.tsx: Aplicação renderizada com sucesso!');
} catch (error) {
  console.error('Erro ao renderizar aplicação:', error);
  
  // Fallback de emergência
  const fallback = document.createElement('div');
  fallback.innerHTML = `
    <div style="
      min-height: 100vh; 
      background: #000; 
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      flex-direction: column;
      font-family: Arial, sans-serif;
    ">
      <h1>Thrilha - Erro de Carregamento</h1>
      <p>Houve um problema ao carregar a aplicação.</p>
      <button onclick="window.location.reload()" style="
        background: #7c3aed; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 5px; 
        cursor: pointer;
        margin-top: 20px;
      ">
        Recarregar Página
      </button>
    </div>
  `;
  document.body.appendChild(fallback);
}
