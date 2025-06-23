import React, { useState, useEffect } from 'react';
import DashboardMapa from './DashboardMapa';
import { 
    Grid, 
    Typography, 
    Box, 
    Card, 
    CardContent,
    CircularProgress
} from '@mui/material';
import { 
    Group as GroupIcon,
    Accessibility as AccessibilityIcon,
    ChildCare as ChildCareIcon,
    School as SchoolIcon,
    PersonSearch as PersonSearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import estadisticasService from '../../services/estadisticasService';

const Dashboard = () => {
    const { user } = useAuth();
    const [loadingOverlay, setLoadingOverlay] = useState(false);
    const [estadisticas, setEstadisticas] = useState({
        total_beneficiarios: 0,
        total_victimas: 0,
        total_discapacidad: 0,
        total_ayuda_humanitaria: 0,
        total_menores_13: 0,
        total_13_25: 0,
        total_mayores_25: 0,
        total_alfabetizados: 0,
        total_analfabetas: 0,
        total_mujeres_menores_con_hijos: 0
    });

    useEffect(() => {
        const cargarEstadisticas = async () => {
            setLoadingOverlay(true);
            try {
                if (user?.linea_trabajo) {
                    const estadisticasObtenidas = await estadisticasService.obtenerEstadisticasBeneficiarios(user.linea_trabajo);
                    if (Object.keys(estadisticasObtenidas).length > 0) {
                        setEstadisticas(estadisticasObtenidas);
                    }
                }
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            } finally {
                setLoadingOverlay(false);
            }
        };
        cargarEstadisticas();
    }, [user]);

    const renderTarjetaEstadistica = (titulo, valor, icono, color = 'primary') => (
        <Grid item xs={12} md={4}>
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" color="textSecondary">
                                {titulo}
                            </Typography>
                            <Typography variant="h4" color={color}>
                                {valor}
                            </Typography>
                        </Box>
                        {icono}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            {loadingOverlay && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.35)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress size={100} thickness={5} value={100} variant="determinate" color="secondary" />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Typography variant="h5" component="div" color="white">Cargando...</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <Typography variant="h5" gutterBottom>
                Dashboard de Funcionario - {user?.linea_trabajo_nombre}
            </Typography>
            
            <Grid container spacing={3}>
                {renderTarjetaEstadistica(
                    'Total Registros', 
                    estadisticas.total_beneficiarios, 
                    <GroupIcon color="primary" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Víctimas de Conflicto', 
                    estadisticas.total_victimas, 
                    <PersonSearchIcon color="warning" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Con Discapacidad', 
                    estadisticas.total_discapacidad, 
                    <AccessibilityIcon color="secondary" sx={{ fontSize: 50 }} />
                )}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {renderTarjetaEstadistica(
                    'Ayuda Humanitaria', 
                    estadisticas.total_ayuda_humanitaria, 
                    <ChildCareIcon color="success" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Menores de 13', 
                    estadisticas.total_menores_13, 
                    <ChildCareIcon color="info" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Entre 13 y 25', 
                    estadisticas.total_13_25, 
                    <SchoolIcon color="primary" sx={{ fontSize: 50 }} />
                )}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {renderTarjetaEstadistica(
                    'Mayores de 25', 
                    estadisticas.total_mayores_25, 
                    <PersonSearchIcon color="secondary" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Alfabetizados', 
                    estadisticas.total_alfabetizados, 
                    <SchoolIcon color="success" sx={{ fontSize: 50 }} />
                )}
                {renderTarjetaEstadistica(
                    'Analfabetas', 
                    estadisticas.total_analfabetas, 
                    <SchoolIcon color="error" sx={{ fontSize: 50 }} />
                )}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {renderTarjetaEstadistica(
                    'Mujeres < 18 con Hijos', 
                    estadisticas.total_mujeres_menores_con_hijos, 
                    <ChildCareIcon color="warning" sx={{ fontSize: 50 }} />
                )}
            </Grid>

            {/* Mapa de beneficiarios */}
            <DashboardMapa />
        </Box>
    );
};

export default Dashboard;
