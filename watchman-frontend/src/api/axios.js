import axios from 'axios';

const api = axios.create({
    baseURL: 'https://watchman-notifier.onrender.com/api', // Backend URL
    withCredentials: true // Cookie gönderimi için önemli
});

export default api;
