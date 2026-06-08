import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch, getToken, setSession, clearSession } from '@/lib/auth';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState(() => (getToken() ? 'checking' : 'guest'));

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    let active = true;

    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!active) return;

        if (!response.ok) {
          clearSession();
          setStatus('guest');
          return;
        }

        const user = await response.json();
        setSession(token, user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (active) {
          clearSession();
          setStatus('guest');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'checking') {
    return null;
  }

  return children;
}
