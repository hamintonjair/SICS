import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import AdminRoutes from './AdminRoutes';
import FuncionarioRoutes from './FuncionarioRoutes';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PrivateRoute = ({ children, allowedRoles }) => {
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

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        return <Navigate to="/no-autorizado" replace />;
    }

    return children;
};

const NoAutorizado = () => (
    <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
    >
        <h1>No Autorizado</h1>
    </Box>
);

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
                path="/admin/*" 
                element={
                    <PrivateRoute allowedRoles={['admin']}>
                        <AdminRoutes />
                    </PrivateRoute>
                } 
            />
            
            <Route 
                path="/funcionario/*" 
                element={
                    <PrivateRoute allowedRoles={['funcionario']}>
                        <FuncionarioRoutes />
                    </PrivateRoute>
                } 
            />
            
            <Route path="/no-autorizado" element={<NoAutorizado />} />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
