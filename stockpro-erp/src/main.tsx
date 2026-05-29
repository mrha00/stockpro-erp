import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from './i18n/I18nContext';
import AppErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
