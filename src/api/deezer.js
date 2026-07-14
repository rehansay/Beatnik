import axios from "axios";
console.log(process.env.REACT_APP_RAPIDAPI_KEY);
console.log(process.env.REACT_APP_RAPIDAPI_HOST);

const deezer=axios.create({
    baseURL:"https://deezerdevs-deezer.p.rapidapi.com",
    headers:{
        "X-RapidAPI-Key":process.env.REACT_APP_RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.REACT_APP_RAPIDAPI_HOST,


    },
});
export default deezer;