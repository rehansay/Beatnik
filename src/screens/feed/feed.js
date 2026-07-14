import React,{useState,useEffect} from 'react';
import deezer from '../../api/deezer';
import SongCard from '../../components/songCard/songCard';
import "./feed.css"
function Feed() {
  const [tracks, setTracks]=useState([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch]=useState("")

  const[debouncedSearch, setDebouncedSearch]=useState("");


  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500);

  return () => clearTimeout(timer);
  }, [search]);




   useEffect(() => {

    if (!debouncedSearch.trim()) {
    setTracks([]);
    return;
    }

    const fetchSongs=async()=>{
      try{

          setLoading(true);

          const response= await deezer.get(`/search?q=${debouncedSearch}`)

          setTracks(response.data.data  || []);

      }
      catch(error){
        console.log(error);
        
      }
      finally{
        setLoading(false);
      }
    

    };
    fetchSongs();
  

  }, [debouncedSearch]);

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

{loading ? (
  <div className="loading">
    <div className="loader">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>

    <p>Loading music...</p>
  </div>
) : search.trim() === "" ? (
  <div className="emptySearch">
    <div className="musicIcon">🎵</div>

    <h2>Discover Music</h2>

    <p>
      Search for your favorite songs or artists
      to start listening.
    </p>
  </div>
) : tracks.length === 0 ? (
  <div className="emptySearch">
    <div className="musicIcon">😕</div>

    <h2>No Songs Found</h2>

    <p>
      Try searching for another song or artist.
    </p>
  </div>  ) : (
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
    )}
  </div>

);
}

export default Feed