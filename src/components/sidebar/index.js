import React,{useEffect, useState} from 'react'
import "./sidebar.css"
import SidebarButton from './sidebarButton'
import { MdSpaceDashboard } from "react-icons/md";
import { FaGripfire } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";
import { MdFavorite } from "react-icons/md";
import { IoLibrary } from "react-icons/io5";
import { FaSignOutAlt } from "react-icons/fa";
import deezer from '../../api/deezer';
// import songCard from '../songCard/songCard';


function Sidebar() {

    const [image, setImage] = useState(
    "https://images.pexels.com/photos/10676939/pexels-photo-10676939.jpeg"
  );

  //const [tracks, setTracks]=useState([]);



  useEffect(()=>{
    deezer
      .get("/search?q=eminem")

      .then((response)=>{
        console.log(response.data);

        setImage(response.data.data[0].album.cover_big);
        
        //setTracks(response.data.data);
        console.log(response.data.data.length);
        
        
      })
      .catch((error)=>{
        console.log(error);
        
      });
  }, []);
  


  //console.log(tracks);


  return (
    <div className='sidebar-container'>
        <img src={image} className="profile-img" alt="profile" />
{/* 
        <div className='songContainer'>
          {tracks.map((track)=>(
            <SongCard
             key={track.id}
             track={track}
             />
            // <p key={track.id}>{track.title}</p>
          ))}
        </div> */}




        <div>
            <SidebarButton title="Feed" to="/feed" icon={<MdSpaceDashboard />}/>
            <SidebarButton title="Trending" to="/trending" icon={<FaGripfire />}/>
            <SidebarButton title="Player" to="/player" icon={<FaPlay />}/>
            <SidebarButton title="Favorites" to="/favorites" icon={<MdFavorite />}/>
            <SidebarButton title="Library" to="/" icon={<IoLibrary />}/>
            

        </div>
        <SidebarButton title="" to="" icon={<FaSignOutAlt/>} />
    </div>
  )
}

export default Sidebar