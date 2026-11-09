import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { usePlayer } from '../../context/PlayerContext';
import './account.css';

function AccountPage() {
  const { sessionUser, logout } = usePlayer();
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError('');
    try {
      await logout();
    } catch {
      setError('Could not log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <p className="account-eyebrow">YOUR ACCOUNT</p>
        {sessionUser ? (
          <>
            {sessionUser.picture ? (
              <img className="account-avatar" src={sessionUser.picture} alt="" />
            ) : (
              <FaUserCircle className="account-avatar-placeholder" aria-hidden="true" />
            )}
            <h1>{sessionUser.name || 'Beatnik listener'}</h1>
            <p className="account-email">{sessionUser.email}</p>
            <p className="account-description">Your favorites and listening history are saved to your account.</p>
            {error && <p className="account-error" role="alert">{error}</p>}
            <button className="account-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
              <FaSignOutAlt aria-hidden="true" /> {loggingOut ? 'Signing out...' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <FaUserCircle className="account-avatar-placeholder" aria-hidden="true" />
            <h1>Sign in to Beatnik</h1>
            <p className="account-description">Sign in or create an account to save your favorites and listening history across devices.</p>
            <Link className="account-sign-in" to="/auth">Sign in or create account</Link>
          </>
        )}
      </section>
    </main>
  );
}

export default AccountPage;
