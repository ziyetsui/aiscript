import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ToastProvider } from './lib/ui.tsx';
import './styles.css';
import { applyFont } from './lib/editor-font.ts';

applyFont(); // before first paint, so the script never flashes in the wrong font

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider><App /></ToastProvider>
  </StrictMode>,
);
