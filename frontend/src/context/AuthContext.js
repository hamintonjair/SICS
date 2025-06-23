import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import usuarioService from '../services/usuarioService';
import { jwtDecode } from 'jwt-decode';

// Tiempo de inactividad en milisegundos (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
        localStorage.removeItem('user');
        setUser(null);
        // Limpiar cualquier temporizador de inactividad existente
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.removeEventListener(event, window.resetInactivityTimer);
        });
        clearTimeout(window.inactivityTimer);
    }, []);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    // Token válido, obtener información completa del usuario
                    const userData = await usuarioService.obtenerUsuarioPorId(decodedToken.sub);
                    return {
                        ...userData,
                        token: token,
                        telefono: userData.telefono || ''
                    };
                } else {
                    // Token expirado
                    logout();
                    return null;
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                logout();
                return null;
            }
        }
        return null;
    }, [logout]);

    useEffect(() => {
        // Verificar autenticación al cargar
        const verifyAuth = async () => {
            try {
                const userData = await checkAuth();
                if (userData) {
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            const userData = await usuarioService.iniciarSesion(email, password);
            // Almacenar token y datos de usuario
            localStorage.setItem(process.env.REACT_APP_TOKEN_KEY, userData.token);
            // Asegurar que el usuario tenga un rol
            const userWithRole = {
                ...userData,
                rol: userData.rol || 'funcionario'
            };
            // Almacenar datos de usuario en localStorage
            localStorage.setItem('user', JSON.stringify(userWithRole));
            setUser(userWithRole);
            return userWithRole;
        } catch (error) {
            // Extraer mensaje de error más detallado
            const errorMessage = error.response?.data?.mensaje || 
                                 error.message || 
                                 'Error desconocido al iniciar sesión';
            throw new Error(errorMessage);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            logout,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
