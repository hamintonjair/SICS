import React from 'react';
import { Outlet } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

const Funcionarios = () => {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Gestión de Funcionarios
            </Typography>
            <Outlet />
        </Box>
    );
};

export default Funcionarios;
