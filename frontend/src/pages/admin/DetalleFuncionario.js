import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Typography, 
    Paper, 
    Grid, 
    Button, 
    Chip, 
    Box 
} from '@mui/material';
import { toast } from 'react-toastify';
import funcionarioService from '../../services/funcionarioService';

const DetalleFuncionario = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [funcionario, setFuncionario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatosFuncionario = async () => {
            try {
                const funcionarioData = await funcionarioService.obtenerFuncionarioPorId(id);
                
                console.log('Datos de funcionario cargados:', funcionarioData);

                setFuncionario(funcionarioData);
                setLoading(false);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                
                const mensajeError = error.mensaje || 'Error al cargar datos del funcionario';
                toast.error(mensajeError);
                
                if (error.detalles && Object.keys(error.detalles).length > 0) {
                    console.error('Detalles del error:', error.detalles);
                    toast.error(JSON.stringify(error.detalles));
                }
                
                setLoading(false);
            }
        };

        cargarDatosFuncionario();
    }, [id]);

    const handleEditar = () => {
        navigate(`/admin/funcionarios/editar/${id}`);
    };

    const handleVolver = () => {
        navigate('/admin/listado-funcionarios');
    };

    if (loading) {
        return <Typography>Cargando...</Typography>;
    }

    if (!funcionario) {
        return <Typography>No se encontró el funcionario</Typography>;
    }

    return (
        <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
            <Typography variant="h5" gutterBottom>
                Detalles del Funcionario
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">
                        <strong>Nombre:</strong> {funcionario.nombre}
                    </Typography>
                    <Typography variant="subtitle1">
                        <strong>Email:</strong> {funcionario.email}
                    </Typography>
                    <Typography variant="subtitle1">
                        <strong>Teléfono:</strong> {funcionario.telefono || 'No registrado'}
                    </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">
                        <strong>Secretaría:</strong> {funcionario.secretaría}
                    </Typography>
                    <Typography variant="subtitle1">
                        <strong>Línea de Trabajo:</strong> {funcionario.nombreLineaTrabajo || 'Sin línea de trabajo'}
                    </Typography>
                    <Typography variant="subtitle1">
                        <strong>Rol:</strong> {funcionario.rol}
                    </Typography>
                </Grid>
                
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Chip 
                            label={funcionario.estado} 
                            color={funcionario.estado === 'Activo' ? 'success' : 'default'}
                        />
                    </Box>
                </Grid>
                
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            onClick={handleVolver}
                        >
                            Volver
                        </Button>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleEditar}
                        >
                            Editar
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default DetalleFuncionario;
