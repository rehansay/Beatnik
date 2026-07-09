import React from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Library from '../library/library';
import Feed from '../feed/feed';
import Player from '../player/player';
import Trending from '../trending/trending';
import Favorites from '../favorites/favorites';
import './home.css'
import Sidebar from '../../components/sidebar';


function Home() {
  return (
    <Router>
        <div className='main-body'>
        <Sidebar />

        <Routes>
            <Route path="/" element={<Library/>}/>
            <Route path="/feed" element={<Feed/>}/>
            <Route path="/player" element={<Player/>}/>
            <Route path="/trending" element={<Trending/>}/>
            <Route path="/favorites" element={<Favorites/>}/>
        </Routes>

        </div>
    </Router>
  )
}

export default Home