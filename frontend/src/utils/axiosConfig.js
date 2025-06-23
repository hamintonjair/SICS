import axios from 'axios';

// Configuración base de axios
const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 30000, // Aumentar timeout a 30 segundos
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para añadir token de autenticación
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Token y usuario:', { token, user });
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        if (error.response && error.response.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
