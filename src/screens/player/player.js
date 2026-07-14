import React, {useState ,useRef,useEffect} from "react";
import { useLocation } from "react-router-dom";
import "./player.css"
import { FaPlay, FaPause } from "react-icons/fa";
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoVolumeLow, IoVolumeHigh
} from "react-icons/io5";
import { FaHeart, FaRegHeart } from "react-icons/fa";

function Player() {
  const location = useLocation();

  const tracks = location.state?.tracks || [];

  const [currentIndex, setCurrentIndex]=useState(
    location.state?.currentIndex ||0
  );

  const track = tracks[currentIndex] ?? null;

  const [isPlaying , setIsPlaying]=useState(false);

  const [currentTime, setCurrentTime]=useState(0);
  
  const[duration, setDuration]=useState(0);

  const [volume, setVolume]= useState(1);


  const [isFavorite, setIsFavorite] = useState(false);


  const audioRef=useRef(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play()
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

  
  // useEffect(()=>{
  //   if(!audioRef.current) return;

  //   audioRef.current.load();
  //   setCurrentTime(0);
  // },[currentIndex])
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);
  }, [currentIndex]);

  useEffect(() => {
    if(audioRef.current){
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(()=>{
    const favorites=JSON.parse(localStorage.getItem("favorites")) || [];

    setIsFavorite(
      favorites.some((song)=> song.id===track.id)
    );
  }, [track]);


  if (!track) {
    return <h2>Select a song from the Feed page.</h2>;
  }

  const formatTime=(time)=>{
    if(!time) return "00:00";

    const minutes=Math.floor(time/60);
    const seconds=Math.floor(time%60)

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  const progress =
  duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeProgress = volume * 100;

  const toggleFavorite=()=>{
    const favorites=
    JSON.parse(localStorage.getItem("favorites"))||[];

    const exists=favorites.some(
      (song)=>song.id===track.id
    );
    if(exists){
      const updatedFavorites=favorites.filter(
       (song)=>song.id !==track.id
     );

    localStorage.setItem(
      "favorites",
      JSON.stringify(updatedFavorites)
    );
    setIsFavorite(false);
    }else{
      favorites.push(track);
      localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
      );

      setIsFavorite(true);
    }
  }

  



  return (
    <div 
      className="playerScreen"
      style={{
        backgroundImage: `url(${track.album.cover_big})`,
      }}
    >
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
        disabled={currentIndex===0}
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
        disabled={currentIndex===tracks.length-1}
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
      style={{
        background: `linear-gradient(
          to right,
          #1DB954 ${progress}%,
          #535353 ${progress}%
        )`,
      }}
      
      onChange={(e) => {
          const time = Number(e.target.value);

          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }}
    />
    <div className="volumeContainer">
        <span><IoVolumeLow size={20} /></span>

        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            style={{
                background: `linear-gradient(
                    to right,
                    #1DB954 ${volumeProgress}%,
                    #535353 ${volumeProgress}%
                )`
            }}


            onChange={(e) => setVolume(Number(e.target.value))}
            className="volumeSlider"
        />

        <span><IoVolumeHigh size={20} /></span>
    </div>


      <audio 
        ref={audioRef}
        src={track.preview}
       

        onTimeUpdate={()=>{
          setCurrentTime(audioRef.current.currentTime);
        }}

        onLoadedMetadata={() => {
          if (!audioRef.current) return;

          setDuration(audioRef.current.duration);

          if (isPlaying) {
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(console.error);
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

      <div className="favoriteContainer">
        <button
          className="favoriteButton"
          onClick={toggleFavorite}
        >
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      </div>
    </div>
  );
}

export default Player;