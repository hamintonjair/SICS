import React, { useState, useEffect } from 'react';
import { 
    Typography, 
    Grid, 
    Paper, 
    Avatar, 
    TextField, 
    Box
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import usuarioService from '../../services/usuarioService';

const Perfil = () => {
    const { user } = useAuth();
    const [perfil, setPerfil] = useState({
        nombre: '',
        email: '',
        secretaría: '',
        rol: '',
        estado: '',
        linea_trabajo: null,
        lineaTrabajo: null
    });

    useEffect(() => {
        const cargarDatosPerfil = async () => {
            if (user) {
                const perfilActualizado = {
                    nombre: user.nombre || '',
                    email: user.email || '',
                    secretaría: user.secretaría || '',
                    rol: user.rol || '',
                    estado: user.estado || '',
                    linea_trabajo: user.linea_trabajo || null
                };

                // Obtener el nombre de la línea de trabajo si existe el ID
                if (user.linea_trabajo) {
                    try {
                        const lineaTrabajo = await usuarioService.obtenerLineaTrabajoPorId(user.linea_trabajo);
                        perfilActualizado.lineaTrabajo = lineaTrabajo;
                    } catch (error) {
                        console.error('Error al obtener línea de trabajo:', error);
                        perfilActualizado.lineaTrabajo = null;
                    }
                }

                setPerfil(perfilActualizado);
            }
        };

        cargarDatosPerfil();
    }, [user]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Mi Perfil
            </Typography>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Avatar 
                            sx={{ 
                                width: 150, 
                                height: 150, 
                                margin: '0 auto',
                                fontSize: '4rem',
                                bgcolor: 'primary.main' 
                            }}
                        >
                            {user?.nombre?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nombre Completo"
                                    value={perfil.nombre}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Correo Electrónico"
                                    value={perfil.email}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Secretaría"
                                    value={perfil.secretaría}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Rol"
                                    value={perfil.rol?.toUpperCase()}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Estado"
                                    value={perfil.estado}
                                    disabled
                                />
                            </Grid>
                            {perfil.lineaTrabajo && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Línea de Trabajo"
                                        value={perfil.lineaTrabajo.nombre || 'Sin línea'}
                                        disabled
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default Perfil;
