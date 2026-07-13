import React from "react";
import "./songCard.css";
import {useNavigate} from "react-router-dom"

function SongCard({track, tracks, index}){
    const navigate=useNavigate();

    return(
        <div className="songCard"
        onClick={()=>
            navigate("/player", {
                state: {
                    track,
                    tracks,
                    currentIndex:index,
                },
            })

        }
        
        
        >
            <img 
            src={track.album.cover_medium}
            alt={track.title}
            className="songCover"
            />

            <h3>{track.title}</h3>

            <p>{track.artist.name}</p>
        </div>

    );
}

export default SongCard;