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
        lineaTrabajo: null,
        nombreLineaTrabajo: ''
    });

    useEffect(() => {
        const cargarLineaTrabajo = async () => {
            let nombreLinea = '';
            if (user?.nombre_linea_trabajo) {
                nombreLinea = user.nombre_linea_trabajo;
            } else if (user?.linea_trabajo) {
                try {
                    const lineas = await usuarioService.obtenerLineasTrabajo();
                    const linea = lineas.find(l => l.id === user.linea_trabajo || l._id === user.linea_trabajo);
                    if (linea) {
                        nombreLinea = linea.nombre;
                    }
                } catch (e) {
                    // Si falla, dejar vacío
                }
            }
            setPerfil({
                nombre: user.nombre,
                email: user.email,
                lineaTrabajo: user.linea_trabajo,
                nombreLineaTrabajo: nombreLinea
            });
        };
        if (user) {
            cargarLineaTrabajo();
        }
    }, [user]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Mi Perfil - Si deseas realizar algún cambio, por favor, contactar al administrador.
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
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre Completo"
                                    name="nombre"
                                    value={perfil.nombre}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Correo Electrónico"
                                    name="email"
                                    type="email"
                                    value={perfil.email}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Rol"
                                    value={user?.rol?.toUpperCase()}
                                    disabled
                                />
                            </Grid>
                            {(perfil.lineaTrabajo || perfil.nombreLineaTrabajo) && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Línea de Trabajo"
                                        value={perfil.nombreLineaTrabajo || 'Sin línea'}
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
