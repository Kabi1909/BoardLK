import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ApiDataBoundary from './components/common/ApiDataBoundary';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/common/UI';
import { ScrollToTop } from './layouts/PublicLayout';
import './index.css';
import './assets/marketplace.css';
import './assets/application.css';
import './assets/motion.css';
import './assets/theme.css';
import { ThemeProvider } from './context/ThemeContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <FavoritesProvider>
            <NotificationProvider>
              <a className="skip-link" href="#main-content">
                Skip to content
              </a>
              <ScrollToTop />
              <ApiDataBoundary>
                <App />
              </ApiDataBoundary>
            </NotificationProvider>
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>,
);
