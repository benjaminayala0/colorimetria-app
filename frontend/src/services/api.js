import axios from 'axios';

//  Local development API URL
const API_URL = 'http://192.168.1.6:3000/api'; 

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;