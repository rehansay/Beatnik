import React from "react";
import "./songCard.css";
import {useNavigate} from "react-router-dom"
import { usePlayer } from '../../context/PlayerContext';

function SongCard({track, tracks, index}){
    const navigate=useNavigate();
    const { selectQueue } = usePlayer();

    return(
        <div className="songCard"
        onClick={() => {
            selectQueue(tracks?.length ? tracks : [track], index || 0);
            navigate("/player");
        }}
        
        
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
