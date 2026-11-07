import axios from 'axios';

const backend = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000',
  timeout: 15000,
});

export default backend;
