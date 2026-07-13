import React, {useState ,useRef,useEffect} from "react";
import { useLocation } from "react-router-dom";
import "./player.css"
import { FaPlay, FaPause } from "react-icons/fa";
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
} from "react-icons/io5";


function Player() {
  const location = useLocation();

  const tracks = location.state?.tracks || [];

  const [currentIndex, setCurrentIndex]=useState(
    location.state?.currentIndex ||0
  );

  const track=tracks[currentIndex];

  const [isPlaying , setIsPlaying]=useState(false);

  const [currentTime, setCurrentTime]=useState(0);
  
  const[duration, setDuration]=useState(0);

  const audioRef=useRef(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
      .play()
      .then(()=>{
        setIsPlaying(true);
      })
      .catch(console.error);
        

    }
  };
  const handleNext=()=>{
    if(currentIndex<tracks.length-1){
      setCurrentIndex((prev)=>prev+1);
    }
  };
  const handlePrevious=()=>{
    if(currentIndex>0){
      setCurrentIndex((prev)=>prev-1);
    }
  };
  
  useEffect(()=>{
    if(!audioRef.current) return;

    audioRef.current.load();
    setCurrentTime(0);
  },[currentIndex])


  if (!track) {
    return <h2>Select a song from the Feed page.</h2>;
  }

  const formatTime=(time)=>{
    if(!time) return "00:00";

    const minutes=Math.floor(time/60);
    const seconds=Math.floor(time%60)

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
console.log(track);
console.log("Preview URL:", track?.preview);

  return (
    <div className="playerScreen">
      <div className="playerCard">
        
      <h1 className="songTitle">
        {track.title}
      </h1>
      <h2 className="artistName">
        {track.artist.name}
      </h2>

      <img
        src={track.album.cover_big}
        alt={track.title}
        className={`playerCover ${isPlaying ? "rotate" : ""}`}
      />

    <div className="controls" >
      <button
        className="sideButton"
        onClick={handlePrevious}
      >
         <IoPlaySkipBack size={28} />
      </button>

      <button
        className="playButton"
        onClick={handlePlayPause}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button
        className="sideButton"
        onClick={handleNext}
      >
        <IoPlaySkipForward size={28} />
      </button>
    </div>

      <div className="time">
    <span>{formatTime(currentTime)}</span>
    <span>{formatTime(duration)}</span>
      </div>

      <input
        className="progressBar"
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={(e)=>{
          const time=Number(e.target.value)
          audioRef.current.currentTime=time;
          setCurrentTime(time);
        }}
      />

      <audio 
        ref={audioRef}
        src={track.preview}

        onTimeUpdate={()=>{
          setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={()=>{
          setDuration(audioRef.current.duration)
        }}
        onLoadedData={() => {
          if (isPlaying) {
            audioRef.current.play().catch(console.error);
          }
        }}

        onEnded={()=>{
          if(currentIndex<tracks.length-1){
            setIsPlaying(true);
            setCurrentIndex((prev)=> prev+1);
          }else{
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}

      />
      </div>
    </div>
  );
}

export default Player;