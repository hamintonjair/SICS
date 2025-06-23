import React from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Container, 
    CssBaseline 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <LockIcon 
                    color="error" 
                    sx={{ fontSize: 100, mb: 2 }} 
                />
                <Typography component="h1" variant="h4" color="error">
                    Acceso No Autorizado
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                    No tienes permisos para acceder a esta página.
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => navigate('/')}
                >
                    Volver al Inicio
                </Button>
            </Box>
        </Container>
    );
};

export default Unauthorized;
