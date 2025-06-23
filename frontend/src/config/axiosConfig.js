import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Skip adding token for login/refresh token endpoints
        if (config.url.includes('/auth/')) {
            return config;
        }
        
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('No JWT token found in localStorage');
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (error.message === 'Network Error') {
            throw new Error('No se puede conectar con el servidor. Verifique su configuración de red y que el backend esté corriendo.');
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh token if this is not a refresh token request
                if (!originalRequest.url.includes('/auth/refresh')) {
                    const refreshToken = localStorage.getItem(process.env.REACT_APP_REFRESH_TOKEN_KEY);
                    if (refreshToken) {
                        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        const { access_token, refresh_token } = response.data;
                        
                        localStorage.setItem(process.env.REACT_APP_TOKEN_KEY, access_token);
                        localStorage.setItem(process.env.REACT_APP_REFRESH_TOKEN_KEY, refresh_token);
                        
                        // Update the original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                        return axiosInstance(originalRequest);
                    }
                }
                
                // If we get here, token refresh failed or no refresh token
                localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
                localStorage.removeItem(process.env.REACT_APP_REFRESH_TOKEN_KEY);
                window.location.href = '/login';
                return Promise.reject(error);
                
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
                localStorage.removeItem(process.env.REACT_APP_REFRESH_TOKEN_KEY);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
