import axios from 'axios';

// Url Local Backend (IP local para dispositivo móvil/emulador)
const API_URL = 'http://192.168.1.6:3000';

// Url Render Backend (producción)
// const API_URL = 'https://colorimetria-app.onrender.com';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;