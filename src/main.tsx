import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker safely (ignoring iframe sandbox restrictions in preview)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent('app-update-available'));
      },
      onOfflineReady() {
        // App cached and ready for offline use
      },
      onRegisterError(error) {
        // Safely suppress in sandboxed iframe environments
        console.info('Service worker registration status:', error?.message || 'deferred');
      },
    });
  }
} catch {
  // Gracefully continue without SW in restricted contexts
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
