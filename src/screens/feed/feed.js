import React,{useState,useEffect} from 'react';
import deezer from '../../api/deezer';
import SongCard from '../../components/songCard/songCard';
import "./feed.css"
function Feed() {
  const [tracks, setTracks]=useState([]);

  const [search, setSearch]=useState("")

   useEffect(() => {
  
      deezer.get(`/search?q=${search}`)
      .then((response) => {
        console.log(response.data);
        setTracks(response.data.data  || []);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [search]);

return (

  <div className="feed-body">

    <div className="search-bar">
      <input

      type="text"
      placeholder="Search songs or artists..."
      value={search}
      onChange={(e)=> setSearch(e.target.value)}
      />

    </div>



    <div className="songContainer">
      {tracks.map((track, index) => (
        <SongCard
          key={track.id}
          track={track}
          tracks={tracks}
          index={index}
        />
      ))}
    </div>

  </div>
);
}

export default Feed