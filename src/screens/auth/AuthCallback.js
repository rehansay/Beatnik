import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import backend from '../../api/backend';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Checking your Google sign-in…');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (searchParams.has('error')) {
      setStatus('Google sign-in could not be completed. Please try again.');
      return;
    }

    backend.get('/auth/me')
      .then(({ data }) => {
        setStatus(`Signed in${data.name ? ` as ${data.name}` : ''}.`);
        setSignedIn(true);
      })
      .catch(() => setStatus('Sign-in could not be verified. Please try again.'));
  }, [searchParams]);

  return (
    <main className="auth-callback-page">
      <h1>{signedIn ? 'Welcome to Beatnik' : 'Google sign-in'}</h1>
      <p role="status">{status}</p>
      <Link to="/">Return to Beatnik</Link>
    </main>
  );
}

export default AuthCallback;
