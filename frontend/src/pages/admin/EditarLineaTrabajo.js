import React, { useState, useEffect } from 'react';
import { 
    Typography, 
    TextField, 
    Button, 
    Grid, 
    Box,
    Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import usuarioService from '../../services/usuarioService';

const EditarLineaTrabajo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lineaTrabajo, setLineaTrabajo] = useState({
        nombre: '',
        descripcion: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Validar que el ID no sea undefined o inválido
        if (!id || id === 'undefined') {
            setError('ID de línea de trabajo no válido');
            return;
        }

        const cargarLineaTrabajo = async () => {
            try {
                const lineaData = await usuarioService.obtenerLineaTrabajoPorId(id);
                setLineaTrabajo({
                    nombre: lineaData.nombre,
                    descripcion: lineaData.descripcion
                });
            } catch (error) {
                console.error('Error al cargar línea de trabajo:', error);
                setError('Error al cargar los datos de la línea de trabajo');
                
                // Redirigir después de un breve retraso
                setTimeout(() => {
                    navigate('/admin/lineas-trabajo');
                }, 1500);
            }
        };

        cargarLineaTrabajo();
    }, [id, navigate]);

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

        // Validar que el ID no sea undefined o inválido
        if (!id || id === 'undefined') {
            setError('ID de línea de trabajo no válido');
            return;
        }

        try {
            await usuarioService.actualizarLineaTrabajo(id, lineaTrabajo);
            setSuccess('Línea de trabajo actualizada exitosamente');
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                navigate('/admin/lineas-trabajo');
            }, 1500);
        } catch (error) {
            setError(error.response?.data?.mensaje || 'Error al actualizar línea de trabajo');
        }
    };

    const handleCancelar = () => {
        navigate('/admin/lineas-trabajo');
    };

    // Si hay un error con el ID, mostrar mensaje de error
    if (error && error.includes('ID de línea de trabajo no válido')) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleCancelar}
                >
                    Volver a Líneas de Trabajo
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Editar Línea de Trabajo
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
                                Actualizar Línea de Trabajo
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

export default EditarLineaTrabajo;
