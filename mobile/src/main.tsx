import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* Ionic core CSS - can thiet cho IonApp + safe-area tren Android */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';

/* Giao dien goc cua ban web (giu nguyen 100%) */
import './theme/globals.css';
import './theme/mobile.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
