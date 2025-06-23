import React from 'react';
import { Outlet } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

const Beneficiarios = () => {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Gestión de Habitantes
            </Typography>
            <Outlet />
        </Box>
    );
};

export default Beneficiarios;
