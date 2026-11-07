import React from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Library from '../library/library';
import Feed from '../feed/feed';
import Player from '../player/player';
import Trending from '../trending/trending';
import Favorites from '../favorites/favorites';
import './home.css'
import Sidebar from '../../components/sidebar';
import PlayerBar from '../../components/playerBar/PlayerBar';
import { PlayerProvider } from '../../context/PlayerContext';


function Home() {
  return (
    <Router>
      <PlayerProvider>
        <div className='main-body'>

        <Sidebar />

        <Routes>
            <Route path="/" element={<Feed/>}/>
            <Route path="/library" element={<Library/>}/>
            <Route path="/player" element={<Player />}/>
            <Route path="/trending" element={<Trending/>}/>
            <Route path="/favorites" element={<Favorites/>}/>
        </Routes>

        </div>
        <PlayerBar />
      </PlayerProvider>
    </Router>
  )
}

export default Home
