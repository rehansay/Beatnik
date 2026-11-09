import axios from 'axios';

const backend = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
  timeout: 15000,
  withCredentials: true,
});

export default backend;
