import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    IconButton, 
    TablePagination,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Event as EventIcon,
    People as PeopleIcon,
    GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import { getActividades, deleteActividad } from '../../services/actividadService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageLayout from '../../components/layout/PageLayout';

const Actividades = () => {
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    const pageTitle = 'Listado de actividades';
    const pageDescription =   <Typography variant="h5" component="h1">
    Gestiona tus actividades realizadas, edita o elimina aquellas que no sean relevantes.
</Typography>;
    const cargarActividades = async () => {
        try {
            setLoading(true);
            const data = await getActividades();
            setActividades(data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error al cargar actividades:', err);
            setError('No se pudieron cargar las actividades. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarActividades();
    }, []);

    const [actividadAEliminar, setActividadAEliminar] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    const handleEliminarClick = (id) => {
        setActividadAEliminar(id);
        setMostrarConfirmacion(true);
    };

    const confirmarEliminacion = async () => {
        if (!actividadAEliminar) return;
        
        try {
            setEliminando(true);
            await deleteActividad(actividadAEliminar);
            cargarActividades();
            setError(null);
        } catch (error) {
            console.error('Error al eliminar la actividad:', error);
            setError('No se pudo eliminar la actividad. Por favor, intente nuevamente.');
        } finally {
            setEliminando(false);
            setMostrarConfirmacion(false);
            setActividadAEliminar(null);
        }
    };

    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setActividadAEliminar(null);
    };


    if (loading) {
        return (
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
        );
    }

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/funcionario/actividades/nueva"
                    >
                        Nueva Actividad
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<GroupAddIcon />}
                        component={Link}
                        to="/funcionario/actividades/reunion"
                    >
                        Nueva Reunión
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Tema</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Lugar</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Dependencia</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Asistentes</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {actividades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No hay actividades registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            actividades.map((actividad) => (
                                <TableRow key={actividad._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle1">
                                            {actividad.tema}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {actividad.objetivo?.substring(0, 50)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {actividad.fecha && (
                                            <Box>
                                                <Typography>
                                                    {(() => {
                                                        try {
                                                            // Asegurarse de que la fecha tenga el formato correcto
                                                            const fecha = actividad.fecha;
                                                            // Crear una fecha en UTC para evitar problemas de zona horaria
                                                            const fechaUTC = new Date(fecha);
                                                            // Ajustar la fecha para que coincida con la zona horaria local
                                                            const fechaAjustada = new Date(fechaUTC.getTime() + (fechaUTC.getTimezoneOffset() * 60000));
                                                            
                                                            return !isNaN(fechaAjustada.getTime()) 
                                                                ? format(fechaAjustada, 'PPPP', { locale: es })
                                                                : 'Fecha no válida';
                                                        } catch (e) {
                                                            console.error('Error al formatear fecha:', e);
                                                            return 'Fecha no especificada';
                                                        }
                                                    })()}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {actividad.hora_inicio} - {actividad.hora_fin}
                                                </Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>{actividad.lugar}</TableCell>
                                    <TableCell>
                                        {actividad.dependencia}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                                            {actividad.asistentes?.length || 0}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => {
                                                // Redirigir a la vista de detalles correspondiente según el tipo
                                                if (actividad.tipo === 'reunion') {
                                                    navigate(`/funcionario/actividades/reunion/${actividad._id}`);
                                                } else {
                                                    navigate(`/funcionario/actividades/${actividad._id}`);
                                                }
                                            }}
                                        >
                                            <EventIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => {
                                                // Redirigir a la ruta de edición correspondiente según el tipo
                                                if (actividad.tipo === 'reunion') {
                                                    navigate(`/funcionario/actividades/editar-reunion/${actividad._id}`);
                                                } else {
                                                    navigate(`/funcionario/actividades/editar/${actividad._id}`);
                                                }
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="error" 
                                            onClick={() => handleEliminarClick(actividad._id)}
                                            disabled={loading || eliminando}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog
                open={mostrarConfirmacion}
                onClose={cancelarEliminacion}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirmar eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        ¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={cancelarEliminacion} 
                        color="primary"
                        disabled={eliminando}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={confirmarEliminacion} 
                        color="error" 
                        autoFocus
                        disabled={eliminando}
                        startIcon={eliminando ? <CircularProgress size={20} /> : null}
                    >
                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
        </PageLayout>
    );
};

export default Actividades;
