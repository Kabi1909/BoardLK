import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

import { refreshRemote } from '../../services/remoteStore';
import { LoadingSpinner, EmptyState } from './UI';
export default function ApiDataBoundary({ children }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const key = user?.id || 'public';
  useEffect(() => {
    let active = true;
    setError('');
    const onError = (event) => setError(event.detail);
    window.addEventListener('boardlk-api-error', onError);
    refreshRemote()
      .then(() => {
        if (active) {
          setLoaded(key);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    const timer = setInterval(() => {
      if (active)
        refreshRemote()
          .then(() => {
            if (active) setError('');
          })
          .catch((e) => {
            if (active) setError(e.message);
          });
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('boardlk-api-error', onError);
    };
  }, [key, retry]);

  if (error && loaded !== key)
    return (
      <EmptyState
        title="Unable to load BoardLK"
        description={error}
        action={
          <button className="btn" onClick={() => setRetry((n) => n + 1)}>
            Retry
          </button>
        }
      />
    );
  if (loaded !== key) return <LoadingSpinner />;
  return (
    <>
      {error && (
        <div
          className="error-box"
          role="alert"
          style={{ position: 'fixed', top: 12, right: 12, zIndex: 200, maxWidth: 360 }}
        >
          <p>{error}</p>
          <button className="btn secondary" onClick={() => setRetry((n) => n + 1)}>
            Retry updates
          </button>
          <button
            className="icon-button"
            aria-label="Dismiss update error"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}
      {children}
    </>
  );
}
