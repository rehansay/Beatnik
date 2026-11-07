// import React from "react";

// const SongList = ({title, songs}) => {
//   return (
//     <div>
//         <h2>{title}</h2>

//         {songs.map((song)=>(
//             <div key ={song.id}>
//                 {song.title}
//             </div>
//                 <SongList
//                 title="❤️ Favorites"
//                 songs={favorites}
//                 onSongClick={playFavorite}
//                 onRemove={removeFavorite}
//                 />
//             </div>
//         ))}
//     </div>
//   );
// };

// export default SongList;

import React from "react";
import "../screens/favorites/favorite.css";

import { FaHeart } from "react-icons/fa";

const SongList = ({
     title,
     songs,
     onSongClick,
     onRemove, 
    }) => {
  return (
    
    <div>
        <h1>{title}</h1>
      {songs.map((song, index) => (
        <div
          className="favoriteCard"
          key={song.id}
        >
          <button
            className="favoriteTrackButton"
            type="button"
            onClick={() => onSongClick(index)}
            aria-label={`Play ${song.title} by ${song.artist?.name || 'unknown artist'}`}
          >
            <img
              className="favoriteImage"
              src={song.album?.cover_medium}
              alt=""
              width={80}
            />
            <span className="favoriteInfo">
              <strong>{song.title}</strong>
              <span>{song.artist?.name || 'Unknown artist'}</span>
            </span>
          </button>

          <button 
            className="removeButton"
            type="button"
            aria-label={`Remove ${song.title} from Favorites`}
            onClick={(e)=>{
              e.stopPropagation();
              onRemove(song.id);
            }}
          >
            <FaHeart />
          </button>
        </div>


      ))}
    </div>
  );
};

export default SongList;

        // <div key={song.id}>
        //   {song.title}
        // </div>
