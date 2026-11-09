import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import backend from '../../api/backend';
import { usePlayer } from '../../context/PlayerContext';
import './auth.css';

function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refreshSession } = usePlayer();
  const isSignup = mode === 'signup';

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await backend.post(`/auth/${isSignup ? 'signup' : 'login'}`, {
        email,
        password,
        ...(isSignup && name.trim() ? { name: name.trim() } : {}),
      });
      await refreshSession();
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-eyebrow">BEATNIK ACCOUNT</p>
        <h1 id="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">{isSignup ? 'Save your music and listen across devices.' : 'Sign in to open your saved music.'}</p>

        <a className="auth-google-button" href={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/auth/google`}>
          Continue with Google
        </a>

        <div className="auth-divider"><span>or use email</span></div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label>
              Name <span>(optional)</span>
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={320}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isSignup ? 8 : 1}
              maxLength={128}
            />
            {isSignup && <span className="auth-hint">Use at least 8 characters.</span>}
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-mode-switch">
          {isSignup ? 'Already have an account?' : 'New to Beatnik?'}{' '}
          <button type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <Link className="auth-back-link" to="/">Back to Beatnik</Link>
      </section>
    </main>
  );
}

export default AuthPage;
