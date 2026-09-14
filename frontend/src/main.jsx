import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/common/UI';
import { ScrollToTop } from './layouts/PublicLayout';
import './index.css';
import './assets/marketplace.css';
import './assets/application.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <FavoritesProvider>
          <NotificationProvider>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <ScrollToTop />
            <App />
          </NotificationProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);
