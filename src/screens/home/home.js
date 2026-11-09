import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Library from '../library/library';
import Feed from '../feed/feed';
import Player from '../player/player';
import Trending from '../trending/trending';
import Favorites from '../favorites/favorites';
import AuthCallback from '../auth/AuthCallback';
import AuthPage from '../auth/AuthPage';
import AccountPage from '../account/AccountPage';
import { FaMusic } from 'react-icons/fa';
import './home.css'
import Sidebar from '../../components/sidebar';
import PlayerBar from '../../components/playerBar/PlayerBar';
import { PlayerProvider } from '../../context/PlayerContext';


function Home() {
  return (
    <Router>
      <PlayerProvider>
        <div className="main-body">
          <Sidebar />
          <div className="workspace-shell">
            <header className="app-header">
              <Link className="beatnik-brand" to="/" aria-label="Beatnik home">
                <span className="beatnik-brand-mark"><FaMusic aria-hidden="true" /></span>
                <span>Beatnik</span>
              </Link>
            </header>
            <div className="workspace-content">
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/library" element={<Library />} />
                <Route path="/player" element={<Player />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Routes>
            </div>
          </div>
        </div>
        <PlayerBar />
      </PlayerProvider>
    </Router>
  )
}

export default Home
