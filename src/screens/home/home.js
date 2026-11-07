import React, { useState } from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Library from '../library/library';
import Feed from '../feed/feed';
import Player from '../player/player';
import Trending from '../trending/trending';
import Favorites from '../favorites/favorites';
import './home.css'
import Sidebar from '../../components/sidebar';


function Home() {
  const [currentTrack, setCurrentTrack] = useState(null);



  return (
    <Router>
        <div className='main-body'>

        
        <Sidebar currentTrack={currentTrack} />

        <Routes>
            <Route path="/" element={<Feed/>}/>
            <Route path="/library" element={<Library/>}/>
            <Route path="/player" element={<Player onTrackChange={setCurrentTrack} />}/>
            <Route path="/trending" element={<Trending/>}/>
            <Route path="/favorites" element={<Favorites/>}/>
        </Routes>

        </div>
    </Router>
  )
}

export default Home
