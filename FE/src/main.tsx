import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const CHUNK_RELOAD_KEY = 'chunk-reload-attempted';

window.addEventListener('unhandledrejection', (event) => {
  const reasonMessage =
    typeof event.reason === 'string'
      ? event.reason
      : event.reason?.message || '';

  if (!reasonMessage.includes('Failed to fetch dynamically imported module')) {
    return;
  }

  // When users keep an old tab open during deployment, hashed chunks may disappear.
  // Reload once to fetch the latest index + chunk manifest.
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

window.addEventListener('load', () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
