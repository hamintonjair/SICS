import React, { useState } from 'react';
import { 
    Typography, 
    TextField, 
    Button, 
    Grid, 
    Box,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../../services/usuarioService';

const CrearLineaTrabajo = () => {
    const navigate = useNavigate();
    const [lineaTrabajo, setLineaTrabajo] = useState({
        nombre: '',
        descripcion: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLineaTrabajo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            await usuarioService.crearLineaTrabajo(lineaTrabajo);
            setSuccess('Línea de trabajo creada exitosamente');
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                navigate('/admin/lineas-trabajo');
            }, 1500);
        } catch (error) {
            setError(error.response?.data?.mensaje || 'Error al crear línea de trabajo');
        }
    };

    const handleCancelar = () => {
        navigate('/admin/lineas-trabajo');
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Nueva Línea
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            name="nombre"
                            value={lineaTrabajo.nombre}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Descripción"
                            name="descripcion"
                            value={lineaTrabajo.descripcion}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                            >
                                Crear Línea de Trabajo
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="secondary"
                                onClick={handleCancelar}
                            >
                                Cancelar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default CrearLineaTrabajo;
