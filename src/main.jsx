import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // PENTING: Ini yang akan memanggil file App.jsx yang panjang tadi!
import './index.css';

const rootElement = document.getElementById('aisya-react-root') || document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.warn('Elemen dengan id "aisya-react-root" tidak ditemukan.');
}