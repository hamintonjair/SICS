import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

const Beneficiarios = () => {
    const location = useLocation();

    const getTitulo = () => {
        const path = location.pathname;
        if (path.includes('/registro')) return 'Nuevo registro de personas';
        if (path.includes('/editar')) return 'Editar Persona';
        return ;
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                {getTitulo()}
            </Typography>
            <Outlet />
        </Box>
    );
};

export default Beneficiarios;
