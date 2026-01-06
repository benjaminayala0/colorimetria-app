import axios from 'axios';

// Url Render Backend  
const API_URL = 'https://colorimetria-app.onrender.com'; 

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;