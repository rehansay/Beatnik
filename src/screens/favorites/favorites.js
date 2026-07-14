import React ,{useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';

function Favorites() {

  const [favorites, setFavorites]= useState([]);
  const navigate=useNavigate();

  const playFavorite=(index)=>{
    navigate("/player",{
      state:{
        tracks: favorites,
        currentIndex: index,
      },
    });
  };

  useEffect(()=>{
    const storedFavorites=JSON.parse(localStorage.getItem("favorites") || "[]")

      setFavorites(storedFavorites);
      
  },[])



  return (
    <div>
      {favorites.map((song, index)=>(
        <div 
          key={song.id}
          onClick={()=>playFavorite(index)}
        >
          <img
            src={song.album.cover_medium}
            alt={song.title}
            width={80}
          
          />
          <h3>{song.title}</h3>

          <p>{song.artist.name}</p>
        </div>
      ))}
    </div>
  );
}

export default Favorites