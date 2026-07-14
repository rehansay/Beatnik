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
      <h2>🎵 Loading songs...</h2>
    </div>
  ) : (
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