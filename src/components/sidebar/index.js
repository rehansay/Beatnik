import React from 'react'
import "./sidebar.css"
import SidebarButton from './sidebarButton'
import { MdSpaceDashboard, MdFavorite } from "react-icons/md";
import { FaGripfire, FaPlay, FaUserCircle } from "react-icons/fa";
import { IoLibrary } from "react-icons/io5";


function Sidebar() {
  return (
    <aside className="sidebar-container" aria-label="Main navigation">
        <nav className="sidebar-nav">
            <SidebarButton title="Feed" to="/" icon={<MdSpaceDashboard />}/>
            <SidebarButton title="Trending" to="/trending" icon={<FaGripfire />}/>
            <SidebarButton title="Player" to="/player" icon={<FaPlay />}/>
            <SidebarButton title="Favorites" to="/favorites" icon={<MdFavorite />}/>
            <SidebarButton title="Library" to="/library" icon={<IoLibrary />}/>
        </nav>
        <div className="sidebar-account-nav">
          <SidebarButton title="Account" to="/account" icon={<FaUserCircle />}/>
        </div>
    </aside>
  )
}

export default Sidebar
