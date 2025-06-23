import axios from 'axios';
import { API_URL } from '../config';

// Crear una instancia personalizada de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true // Importante para manejar cookies de autenticación
});

// Obtener el token del localStorage
export const getToken = () => {
    const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'authToken';
    const token = localStorage.getItem(tokenKey);
    return token;
};

// Variable para evitar múltiples intentos de refresco
let isRefreshing = false;
let refreshPromise = null;

// Función para refrescar el token
const refreshToken = async () => {
    if (isRefreshing) {
        // Si ya hay un refresco en curso, devolver la promesa existente
        return refreshPromise;
    }

    isRefreshing = true;
    const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'authToken';
    
    try {
        const refreshTokenValue = localStorage.getItem(`${tokenKey}_refresh`);
        
        if (!refreshTokenValue) {
            throw new Error('No hay token de refresco disponible');
        }

        refreshPromise = api.post('/auth/refresh', {}, {
            headers: {
                'Authorization': `Bearer ${refreshTokenValue}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            skipAuthRefresh: true // Para evitar bucles de actualización
        });

        const response = await refreshPromise;
        
        if (response.data && response.data.access_token) {
            const newAccessToken = response.data.access_token;
            
            // Guardar el nuevo token
            localStorage.setItem(tokenKey, newAccessToken);
            
            // Actualizar el refresh token si viene uno nuevo
            if (response.data.refresh_token) {
                localStorage.setItem(`${tokenKey}_refresh`, response.data.refresh_token);
            }
            
            // Actualizar el token en los headers por defecto
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            
            // Actualizar el token en el objeto de usuario si existe
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    user.token = newAccessToken;
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (e) {
                    console.error('Error al actualizar el token en el usuario:', e);
                }
            }
            
            return newAccessToken;
        }
        
        throw new Error('No se recibió un token de acceso válido en la respuesta');
    } catch (error) {
        
        // Limpiar tokens y datos de usuario
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(`${tokenKey}_refresh`);
        localStorage.removeItem('user');
        
        // Redirigir al login
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        
        throw error;
    } finally {
        isRefreshing = false;
        refreshPromise = null;
    }
};

// Obtener los headers de autenticación
export const getAuthHeader = async () => {
    let token = getToken();
    
    if (!token) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
    }
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
};

// Interceptor para agregar el token a las solicitudes
api.interceptors.request.use(
    async (config) => {
        // No agregar el token a las rutas de autenticación
        if (config.url.includes('/auth/') || config.skipAuthRefresh) {
            return config;
        }
        
        // Obtener el token actual
        const token = getToken();
        
        // Si no hay token, lanzar un error
        if (!token) {
            const error = new Error('No se encontró token de autenticación');
            error.code = 'MISSING_TOKEN';
            throw error;
        }
        
        // Verificar que el token tenga el formato correcto
        if (typeof token !== 'string' || !token.startsWith('eyJ')) {
            const error = new Error('Token inválido');
            error.code = 'INVALID_TOKEN';
            throw error;
        }
        
        // Agregar el token al header de autorización
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token.trim()}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Asegurarse de que withCredentials esté habilitado
        config.withCredentials = true;
        
            
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar la renovación automática del token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Si el error es 401 y no es una solicitud de login/refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // Evitar bucles de reintento
            if (originalRequest.url.includes('/auth/refresh')) {
                console.error('Error al renovar el token, cerrando sesión...');
                logout();
                return Promise.reject(error);
            }
            
            originalRequest._retry = true;
            
            try {
                const newToken = await refreshToken();
                
                if (!newToken) {
                    throw new Error('No se pudo renovar el token');
                }
                
                // Crear una nueva instancia de la configuración original
                const newConfig = { ...originalRequest };
                
                // Actualizar el token en la solicitud original
                newConfig.headers = {
                    ...originalRequest.headers,
                    'Authorization': `Bearer ${newToken}`
                };
                
                // Reintentar la solicitud original con el nuevo token
                return api(newConfig);
            } catch (refreshError) {
                // Limpiar todo y redirigir al login
                logout();
                return Promise.reject(refreshError);
            }
        }
        
        // Para otros errores, rechazar con el error original
        return Promise.reject(error);
    }
);

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
    return !!getToken();
};

// Iniciar sesión
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        
        if (response.data && response.data.access_token) {
            const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'authToken';
            
            // Guardar tokens
            localStorage.setItem(tokenKey, response.data.access_token);
            
            // Guardar refresh token si está disponible
            if (response.data.refresh_token) {
                localStorage.setItem(`${tokenKey}_refresh`, response.data.refresh_token);
            }
            
            // Guardar información del usuario en localStorage
            if (response.data.funcionario) {
                const userData = {
                    ...response.data.funcionario,
                    token: response.data.access_token
                };
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            // Configurar el token en el encabezado por defecto
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
            
            return response.data.funcionario;
        }
        
        throw new Error('No se recibió un token de acceso válido');
    } catch (error) {
        // Limpiar tokens en caso de error
        const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'authToken';
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(`${tokenKey}_refresh`);
        localStorage.removeItem('user');
        throw error;
    }
};

// Cerrar sesión
export const logout = () => {
    const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'authToken';
    
    try {
        // Limpiar todos los datos de autenticación
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(`${tokenKey}_refresh`);
        localStorage.removeItem('user');
        
        // Limpiar cualquier dato de sesión adicional
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('auth_') || key.endsWith('_token')) {
                localStorage.removeItem(key);
            }
        });
        
        // Eliminar el token de los headers por defecto
        delete api.defaults.headers.common['Authorization'];
        
        // Limpiar cookies relacionadas con la autenticación
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        
        console.log('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        // Redirigir al login si no estamos ya ahí
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
};

// Obtener el usuario actual
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        
        // Si el token expiró, forzar cierre de sesión
        const token = getToken();
        if (!token) {
            logout();
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        return null;
    }
};

// Exportar la instancia de axios configurada
export { api };
