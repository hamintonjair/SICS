import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import {
    Box,
    Button,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    CircularProgress
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
// import VisibilityIcon from '@mui/icons-material/Visibility';

import { useAuth } from '../../context/AuthContext';

import {
    listarPoblacionMigrante,
    obtenerPoblacionMigrantePorId
} from '../../services/poblacionMigranteService';

import PageLayout from '../../components/layout/PageLayout';

const ListadoPoblacionMigrante = () => {
    // Navegación y contexto
    const navigate = useNavigate();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const pageTitle = 'Registro de Población Migrante';
    const pageDescription = 'Formulario para caracterización de población migrante en Quibdó';
    
    // Estados de datos
    const [poblacionMigrante, setPoblacionMigrante] = useState([]);
    // Total de población migrante (preparado para futuras implementaciones de paginación)
    const [totalPoblacionMigrante, setTotalPoblacionMigrante] = useState(0);
    const [filtro, setFiltro] = useState('');
    const [lineaTrabajo, setLineaTrabajo] = useState('');
    const [paginacion, setPaginacion] = useState({
        pagina: 0,
        porPagina: 10
    });

    // Estados para diálogos
    const [detallesMigrante, setDetallesMigrante] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Estado para overlay de carga
    const [loadingOverlay, setLoadingOverlay] = useState(false);

    // Declaración de función para cargar población migrante
    const cargarPoblacionMigrante = React.useCallback(async () => {
        // Depuración completa del usuario
     

        // Validación de dependencias antes de ejecutar
        if (!user?.linea_trabajo) {
            enqueueSnackbar('No se puede cargar población migrante: usuario sin línea de trabajo', { variant: 'warning' });
            return;
        }


        const lineaTrabajo = typeof user.linea_trabajo === 'string' 
            ? user.linea_trabajo.trim() 
            : (user.linea_trabajo?._id || user.linea_trabajo?.id);


        if (!lineaTrabajo) {
            enqueueSnackbar('Línea de trabajo no válida', { variant: 'error' });
            return;
        }

        // Validar formato de la línea de trabajo
        if (!/^[0-9a-fA-F]{24}$/.test(lineaTrabajo)) {
            console.error(`Línea de trabajo inválida: ${lineaTrabajo}`);
            enqueueSnackbar('Línea de trabajo tiene un formato inválido', { variant: 'error' });
            return;
        }

        setLoadingOverlay(true);
        try {
            const { data, total } = await listarPoblacionMigrante(
                paginacion.pagina + 1,
                paginacion.porPagina,
                filtro,
                lineaTrabajo
            );            

            // Manejar caso de datos vacíos
            if (data.length === 0) {
                enqueueSnackbar('No se encontraron registros de población migrante', { variant: 'info' });
            }

            setPoblacionMigrante(data);
            setTotalPoblacionMigrante(total);

            // Establecer línea de trabajo del primer migrante o de la sesión
            const nombreLineaTrabajo = data.length > 0 
                ? (data[0].nombre_linea_trabajo || data[0].linea_trabajo)
                : user.linea_trabajo_nombre || 'Línea de Trabajo';

            setLineaTrabajo(nombreLineaTrabajo);
        } catch (error) {
            console.error('Error al cargar población migrante:', error);
            
            // Manejar diferentes tipos de errores
            const errorMessage = error.response?.data?.mensaje 
                || error.message 
                || 'Error desconocido al cargar población migrante';
            
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setLoadingOverlay(false);
        }
    }, [user, paginacion, filtro, enqueueSnackbar]);

    useEffect(() => {
        if (user?.linea_trabajo) {
            cargarPoblacionMigrante();
        }
    }, [cargarPoblacionMigrante, user]);

    const handleEditar = useCallback(async (migrante) => {
        try {
            // Obtener detalles completos del migrante
            const detalles = await obtenerPoblacionMigrantePorId(migrante._id);
            
            // Navegar al formulario de registro en modo edición
            navigate('/funcionario/registro-migrantes', { 
                state: { 
                    migrante: detalles,
                    modoEdicion: true 
                } 
            });
        } catch (error) {
            enqueueSnackbar('Error al obtener información del migrante', { variant: 'error' });
            console.error(error);
        }
    }, [navigate, enqueueSnackbar]);

    const handleNuevoRegistro = useCallback(() => {
        navigate('/funcionario/poblacion-migrante/registro');
    }, [navigate]);

    const handleCambioPorPagina = useCallback((event) => {
        setPaginacion(prev => ({ ...prev, porPagina: parseInt(event.target.value) }));
        setFiltro('');
        cargarPoblacionMigrante();
    }, [cargarPoblacionMigrante]);

    // const handleVerDetalles = useCallback(async (id) => {
    //     try {
    //         const detalles = await obtenerPoblacionMigrantePorId(id);
    //         setDetallesMigrante(detalles);
    //         setDialogOpen(true);
    //     } catch (error) {
    //         enqueueSnackbar('Error al obtener detalles', { variant: 'error' });
    //     }
    // }, [enqueueSnackbar, setDetallesMigrante, setDialogOpen]);

    const handleCerrarDialog = React.useCallback(() => {
        setDialogOpen(false);
        setDetallesMigrante(null);
    }, []);

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
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
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {lineaTrabajo || user?.linea_trabajo}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Buscar población migrante"
                            variant="outlined"
                            value={filtro}
                            onChange={(event) => {
                                setFiltro(event.target.value);
                                setPaginacion(prev => ({ ...prev, pagina: 0 }));
                                cargarPoblacionMigrante(); // Recargar al cambiar filtro
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            select
                            label="Registros por página"
                            value={paginacion.porPagina}
                            onChange={handleCambioPorPagina}
                            variant="outlined"
                        >
                            {[5, 10, 25, 50].map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mb={2}>
                            <Button 
                                variant="contained" 
                                color="success" 
                                onClick={handleNuevoRegistro}
                            >
                                Nuevo Registro
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                {totalPoblacionMigrante > 0 && (
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Total de registros: {totalPoblacionMigrante}
                    </Typography>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Funcionario</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Línea de Trabajo</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Fecha de Registro</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {poblacionMigrante.map((migrante) => (
                                <TableRow key={migrante._id}>
                                    <TableCell>{migrante.funcionario_nombre}</TableCell>
                                    <TableCell>{migrante.nombre_linea_trabajo || migrante.linea_trabajo}</TableCell>
                                    <TableCell>{migrante.nombre_completo}</TableCell>
                                    <TableCell>{
                                        (() => {
                                            // migrante.fecha_registro es una cadena como 'YYYY-MM-DD'
                                            const partesFecha = migrante.fecha_registro.split('-');
                                            // El mes es 0-indexado en el constructor de Date (0=Enero, 1=Febrero, etc.)
                                            const fechaLocal = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
                                            return fechaLocal.toLocaleDateString();
                                        })()
                                    }</TableCell>
                                    <TableCell>
                                        <Tooltip title="Editar">
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleEditar(migrante)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Diálogo de Detalles */}
                <Dialog
                    open={dialogOpen}
                    onClose={handleCerrarDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Detalles de Población Migrante
                        <IconButton
                            aria-label="close"
                            onClick={handleCerrarDialog}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {detallesMigrante && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Información Personal</Typography>
                                <Typography>Nombre: {detallesMigrante.nombre_completo}</Typography>
                                <Typography>Tipo de Documento: {detallesMigrante.tipo_documento}</Typography>
                                <Typography>Número de Documento: {detallesMigrante.numero_documento}</Typography>
                                <Typography>País de Origen: {detallesMigrante.pais_origen}</Typography>
                                <Typography>Tiempo en Colombia: {detallesMigrante.tiempoPermanenciaColombia}</Typography>
                                <Typography>Tipo de Documento Migratorio: {detallesMigrante.tipoDocumentoMigratorio}</Typography>
                                <Typography variant="h6" sx={{ mt: 2 }}>Ubicación</Typography>
                                <Typography>Comuna: {detallesMigrante.comunaResidencia}</Typography>
                                <Typography>Barrio: {detallesMigrante.barrio}</Typography>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </Container>
            </Box>
        </PageLayout>
    );
};

export default ListadoPoblacionMigrante;
