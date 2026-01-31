import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:10000/api', // Backend URL
    withCredentials: true // Cookie gönderimi için önemli
});

export default api;
