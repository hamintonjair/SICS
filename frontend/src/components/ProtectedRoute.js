import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { getToken, isTokenExpired, removeToken } from '../utils/auth';

export const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                height="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Verificar expiración del token
    const token = getToken();
    if (!user || !token || isTokenExpired(token)) {
        removeToken();
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        // Redirigir si el rol no está permitido
        return <Navigate to="/unauthorized" replace />;
    }

    // Renderizar rutas protegidas
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
