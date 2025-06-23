import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { useSnackbar } from 'notistack';
import PageLayout from '../../components/layout/PageLayout';
import { 
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Pagination
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import SeleccionarColumnasDialog from '../../components/SeleccionarColumnasDialog';
import { getActividadById, deleteActividad, registrarAsistencia } from '../../services/actividadService';
import { obtenerBeneficiarios } from '../../services/beneficiarioService';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const DetalleActividad = ({ esReunion = false }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { id } = useParams();
    const navigate = useNavigate();
    const [actividad, setActividad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [columnasDialogAbierto, setColumnasDialogAbierto] = useState(false);
    const [columnasSeleccionadas, setColumnasSeleccionadas] = useState([]);
    const [asistentes, setAsistentes] = useState([]);
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [savingAsistencia, setSavingAsistencia] = useState(false);
    const [generandoExcel, setGenerandoExcel] = useState(false);
    // Estados para la paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina] = useState(10); // 10 registros por página

    // Columnas disponibles para exportación de actividades
    const columnasActividad = [
        { campo: 'numero', etiqueta: 'N°', visiblePorDefecto: true },
        { campo: 'fecha_registro', etiqueta: 'FECHA DE REGISTRO', visiblePorDefecto: true },
        { campo: 'nombre', etiqueta: 'NOMBRE', visiblePorDefecto: true },
        { campo: 'tipo_documento', etiqueta: 'TIPO DOCUMENTO', visiblePorDefecto: true },
        { campo: 'identificacion', etiqueta: 'IDENTIFICACIÓN', visiblePorDefecto: true },
        { campo: 'genero', etiqueta: 'GÉNERO', visiblePorDefecto: true },
        { campo: 'rango_edad', etiqueta: 'RANGO DE EDAD', visiblePorDefecto: true },
        { campo: 'comuna', etiqueta: 'COMUNA', visiblePorDefecto: true },
        { campo: 'barrio', etiqueta: 'BARRIO', visiblePorDefecto: true },
        { campo: 'telefono', etiqueta: 'TELÉFONO', visiblePorDefecto: true },
        { campo: 'correo', etiqueta: 'CORREO ELECTRÓNICO', visiblePorDefecto: true },
        { campo: 'estudia', etiqueta: 'ESTUDIA ACTUALMENTE', visiblePorDefecto: false },
        { campo: 'nivel_educativo', etiqueta: 'NIVEL EDUCATIVO', visiblePorDefecto: false },
        { campo: 'sabe_leer', etiqueta: 'SABE LEER', visiblePorDefecto: false },
        { campo: 'sabe_escribir', etiqueta: 'SABE ESCRIBIR', visiblePorDefecto: false },
        { campo: 'tipo_vivienda', etiqueta: 'TIPO DE VIVIENDA', visiblePorDefecto: false },
        { campo: 'situacion_laboral', etiqueta: 'SITUACIÓN LABORAL', visiblePorDefecto: false },
        { campo: 'grupo_etnico', etiqueta: 'GRUPO ÉTNICO', visiblePorDefecto: false },
        { campo: 'ayuda_humanitaria', etiqueta: 'AYUDA HUMANITARIA', visiblePorDefecto: false },
        { campo: 'tipo_ayuda_humanitaria', etiqueta: 'TIPO DE AYUDA HUMANITARIA', visiblePorDefecto: false },
        { campo: 'discapacidad', etiqueta: 'DISCAPACIDAD', visiblePorDefecto: false },
        { campo: 'tipo_discapacidad', etiqueta: 'TIPO DE DISCAPACIDAD', visiblePorDefecto: false },
        { campo: 'nombre_cuidadora', etiqueta: 'NOMBRE DE LA CUIDADORA', visiblePorDefecto: false },
        { campo: 'labora_actualmente', etiqueta: 'LABORA ACTUALMENTE', visiblePorDefecto: false },
        { campo: 'victima_conflicto', etiqueta: 'VÍCTIMA DE CONFLICTO', visiblePorDefecto: false },
        { campo: 'firma', etiqueta: 'FIRMA', visiblePorDefecto: false }
    ];

    // Columnas disponibles para exportación de reuniones
    const columnasReunion = [
        { campo: 'numero', etiqueta: 'N°', visiblePorDefecto: true },
        { campo: 'nombre', etiqueta: 'NOMBRE COMPLETO', visiblePorDefecto: true },
        { campo: 'cedula', etiqueta: 'CÉDULA', visiblePorDefecto: true },
        { campo: 'dependencia', etiqueta: 'DEPENDENCIA', visiblePorDefecto: true },
        { campo: 'cargo', etiqueta: 'CARGO', visiblePorDefecto: true },
        { campo: 'tipo_participacion', etiqueta: 'TIPO PARTICIPACIÓN', visiblePorDefecto: true },
        { campo: 'telefono', etiqueta: 'TELÉFONO', visiblePorDefecto: true },
        { campo: 'email', etiqueta: 'CORREO ELECTRÓNICO', visiblePorDefecto: true },
        { campo: 'firma', etiqueta: 'FIRMA', visiblePorDefecto: true }
    ];

    // Usar las columnas correspondientes según el tipo de vista
    const columnasExportacion = esReunion ? columnasReunion : columnasActividad;

    // Obtener columnas seleccionadas por defecto
    useEffect(() => {
        const defaultSelected = columnasExportacion
            .filter(col => col.visiblePorDefecto)
            .map(col => col.campo);
        setColumnasSeleccionadas(defaultSelected);
    }, [esReunion]); // Dependencia de esReunion para recalcular cuando cambie

    // Cargar la lista de beneficiarios
    useEffect(() => {
        const cargarBeneficiarios = async () => {
            try {
                const response = await obtenerBeneficiarios({ 
                    por_pagina: 1000, // Obtenemos todos los registros para filtrar localmente
                    pagina: 1
                });
                
                if (response && Array.isArray(response.beneficiarios)) {
                    setBeneficiarios(response.beneficiarios);
                } else if (Array.isArray(response)) {
                    setBeneficiarios(response);
                } else {
                    console.error('Formato de respuesta inesperado:', response);
                    setBeneficiarios([]);
                }
            } catch (error) {
                enqueueSnackbar('Error al cargar la lista de beneficiarios', { variant: 'error' });
                setBeneficiarios([]);
            }
        };
        
        cargarBeneficiarios();
    }, []);
    
    // Lógica de paginación
    const indexOfLastRecord = paginaActual * registrosPorPagina;
    const indexOfFirstRecord = indexOfLastRecord - registrosPorPagina;
    const currentAsistentes = Array.isArray(asistentes) 
        ? asistentes.slice(indexOfFirstRecord, indexOfLastRecord) 
        : [];
    const totalPaginas = Math.ceil((asistentes?.length || 0) / registrosPorPagina);
    
    // Cambiar de página
    const paginate = (pageNumber) => setPaginaActual(pageNumber);

    // Cargar los datos de la actividad
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Mostrar loading solo por un breve tiempo
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms antes de mostrar el loading
                
                // Cargar actividad
                const actividadData = await getActividadById(id);
                
                if (actividadData) {
                    // Asegurarse de que los asistentes tengan la estructura correcta
                    const asistentesFormateados = (actividadData.asistentes || []).map(asistente => ({
                        ...asistente,
                        // Asegurarse de que cada asistente tenga un ID y un beneficiario_id
                        _id: asistente._id || asistente.beneficiario_id,
                        beneficiario_id: asistente.beneficiario_id || asistente._id,
                        asistio: asistente.asistio || false,
                        observaciones: asistente.observaciones || ''
                    }));
                    
                    setActividad(actividadData);
                    setAsistentes(asistentesFormateados);
                    setLoading(false);
                } else {
                    setError('No se encontró la actividad');
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message || 'No se pudieron cargar los datos de la actividad');
                setLoading(false);
            }
        };

        if (id) {
            cargarDatos();
        } else {
            setError('No se proporcionó un ID de actividad válido');
            setLoading(false);
        }
    }, [id]);

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteActividad(id);
            navigate('/funcionario/actividades');
        } catch (err) {
            console.error('Error al eliminar la actividad:', err);
            setError('No se pudo eliminar la actividad');
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
        }
    };

    const toggleAsistencia = async (asistenteId, asistio) => {
        try {
            setSavingAsistencia(true);
            
            // Encontrar el asistente actual para preservar sus datos
            const asistenteActual = asistentes.find(a => 
                a.beneficiario_id === asistenteId || a._id === asistenteId
            );
            
            // Crear un array con los asistentes actualizados
            const updatedAsistentes = asistentes.map(a => {
                if (a.beneficiario_id === asistenteId || a._id === asistenteId) {
                    return {
                        ...a,
                        asistio: asistio,
                        // Preservar el beneficiario_id y _id
                        beneficiario_id: a.beneficiario_id || asistenteId,
                        _id: a._id || asistenteId
                    };
                }
                return a;
            });
                        
            // Llamar al servicio para actualizar en el servidor
            await registrarAsistencia(id, updatedAsistentes);
            
            // Actualizar el estado local
            setAsistentes(updatedAsistentes);
            
            // Actualizar también el estado de la actividad
            setActividad(prev => ({
                ...prev,
                asistentes: updatedAsistentes
            }));
            
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo actualizar la asistencia');
        } finally {
            setSavingAsistencia(false);
        }
    };

    const getBeneficiarioInfo = (beneficiarioId) => {
        if (!beneficiarioId) {
            return { 
                nombre_completo: 'Beneficiario no especificado',
                tipo_documento: 'N/A',
                numero_documento: 'N/A'
            };
        }
        
        // Primero buscar en los datos ya cargados en los asistentes
        const asistente = asistentes.find(a => 
            (a.beneficiario_id === beneficiarioId || a._id === beneficiarioId) && 
            a.beneficiario_data
        );
        
        if (asistente && asistente.beneficiario_data) {
            return asistente.beneficiario_data;
        }
        
        // Si no se encuentra en los asistentes, buscar en la lista de beneficiarios
        const beneficiario = beneficiarios.find(b => 
            b._id === beneficiarioId || 
            b.id === beneficiarioId ||
            (b.beneficiario && (b.beneficiario._id === beneficiarioId || b.beneficiario.id === beneficiarioId))
        );
        
        if (beneficiario) {
            // Si el beneficiario tiene un objeto anidado 'beneficiario', devolver ese objeto
            if (beneficiario.beneficiario) {
                return {
                    ...beneficiario.beneficiario,
                    nombre_completo: beneficiario.beneficiario.nombre_completo || 'Nombre no disponible',
                    tipo_documento: beneficiario.beneficiario.tipo_documento || 'Sin documento',
                    numero_documento: beneficiario.beneficiario.numero_documento || 'N/A'
                };
            }
            
            // Si no, devolver el beneficiario directamente
            return {
                ...beneficiario,
                nombre_completo: beneficiario.nombre_completo || 'Nombre no disponible',
                tipo_documento: beneficiario.tipo_documento || 'Sin documento',
                numero_documento: beneficiario.numero_documento || 'N/A'
            };
        }
        
        // Si no se encuentra en ningún lado, devolver un objeto con valores por defecto
        return { 
            nombre_completo: 'Beneficiario no encontrado',
            tipo_documento: 'N/A',
            numero_documento: beneficiarioId || 'N/A'
        };
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

    if (!actividad) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">No se encontró la actividad solicitada</Alert>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/funcionario/actividades')}
                    sx={{ mt: 2 }}
                >
                    Volver al listado
                </Button>
            </Box>
        );
    }

    const fechaFormateada = actividad.fecha && !isNaN(new Date(actividad.fecha).getTime())
        ? format(new Date(actividad.fecha), 'PPPP', { locale: es })
        : 'Fecha no especificada';

    const pageTitle = actividad.tema || (esReunion ? 'Detalle de Reunión' : 'Detalle de Actividad');
    const pageDescription = (
        <Typography variant="h5" component="h1">
            {esReunion ? 'Detalles de la reunión y gestión de asistentes' : 'Detalles de la actividad y gestión de asistentes'}
        </Typography>
    );

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box sx={{ p: 3, position: 'relative' }}>
            {/* Overlay de carga para la generación de Excel */}
            {generandoExcel && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(2px)'
                }}>
                    <Box sx={{ 
                        bgcolor: 'background.paper',
                        p: 4,
                        borderRadius: 2,
                        boxShadow: 24,
                        textAlign: 'center',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Generando archivo Excel
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Por favor espere mientras se genera el archivo...
                        </Typography>
                    </Box>
                </Box>
            )}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate('/funcionario/actividades')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        p: 1.5,
                        borderRadius: 1,
                        width: '100%',
                        textAlign: 'left',
                        boxShadow: 1
                    }}
                >
                    {'👈  '+ 'Volver atras'}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
           
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Tabs 
                                value={tabValue} 
                                onChange={(e, newValue) => setTabValue(newValue)}
                                sx={{ mb: 3 }}
                            >
                                <Tab label="Información" icon={<DescriptionIcon />} />
                                <Tab label="Asistentes" icon={<PeopleIcon />} />
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
                                <Box sx={{ mb: 3 }}>
                                    <Button 
                                        variant="outlined" 
                                        color="primary" 
                                        fullWidth 
                                        startIcon={<PeopleIcon />}
                                        onClick={() => setTabValue(1)}
                                    >
                                        Registrar Asistencia
                                    </Button>
                                </Box>

                                <Typography 
                                    variant="h6" 
                                    sx={{
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        p: 1,
                                        borderRadius: 1,
                                        mb: 2,
                                        textAlign: 'center'
                                    }}
                                >
                                    {esReunion ? 'Detalles de la Reunión' : 'Detalles de la Actividad'}
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <List>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <AssignmentIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary="Objetivo" 
                                            secondary={actividad.objetivo || 'No especificado'}
                                            secondaryTypographyProps={{ style: { whiteSpace: 'pre-line' } }}
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <CalendarIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary="Fecha" 
                                            secondary={fechaFormateada} 
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <TimeIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary="Horario" 
                                            secondary={`${actividad.hora_inicio || '--:--'} - ${actividad.hora_fin || '--:--'}`} 
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <LocationIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary="Lugar" 
                                            secondary={actividad.lugar || 'No especificado'} 
                                        />
                                    </ListItem>
                                </List>
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography 
                                        variant="h6"
                                        sx={{
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: 1,
                                            mb: 2,
                                            textAlign: 'center'
                                        }}
                                    >
                                        Lista de Asistentes
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {asistentes.filter(a => a.asistio).length} de {asistentes.length} asistentes registrados
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                
                                {asistentes.length === 0 ? (
                                    <Alert severity="info">No hay asistentes registrados para esta actividad</Alert>
                                ) : (
                                    <>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                                                        <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }} align="center">Documento</TableCell>
                                                        <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }} align="center">Asistencia</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {currentAsistentes.map((asistente) => {
                                                        const beneficiario = getBeneficiarioInfo(asistente.beneficiario_id || asistente._id);
                                                        return (
                                                            <TableRow key={asistente.beneficiario_id || asistente._id}>
                                                                <TableCell>
                                                                    {beneficiario ? (
                                                                        <>
                                                                            {beneficiario.nombre_completo || 'Nombre no disponible'}
                                                                            {!beneficiario.nombre_completo && (
                                                                                <span style={{ color: 'red', fontSize: '0.8em', marginLeft: '8px' }}>
                                                                                    (ID: {asistente.beneficiario_id || asistente._id || 'N/A'})
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span style={{ color: 'red' }}>
                                                                            Beneficiario no encontrado (ID: {asistente.beneficiario_id || asistente._id || 'N/A'})
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="left">
                                                                    {beneficiario?.tipo_documento}: {beneficiario?.numero_documento}
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {asistente.asistio ? (
                                                                        <Chip 
                                                                            icon={<CheckIcon />} 
                                                                            label="Asistió" 
                                                                            color="success" 
                                                                            size="small" 
                                                                        />
                                                                    ) : (
                                                                        <Chip 
                                                                            icon={<CloseIcon />} 
                                                                            label="No asistió" 
                                                                            color="error" 
                                                                            size="small" 
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        
                                        {/* Controles de paginación */}
                                        {totalPaginas > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                                                <Pagination 
                                                    count={totalPaginas} 
                                                    page={paginaActual} 
                                                    onChange={(e, page) => paginate(page)}
                                                    color="primary" 
                                                    showFirstButton 
                                                    showLastButton
                                                    size="small"
                                                />
                                            </Box>
                                        )}
                                    </>
                                )}
                            </TabPanel>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Estadísticas
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Total de asistentes" 
                                        secondary={asistentes.length}
                                        secondaryTypographyProps={{ variant: 'h5' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Asistencia confirmada" 
                                        secondary={`${asistentes.filter(a => a.asistio).length} (${asistentes.length > 0 ? Math.round((asistentes.filter(a => a.asistio).length / asistentes.length) * 100) : 0}%)`}
                                        secondaryTypographyProps={{ variant: 'h5' }}
                                    />
                                </ListItem>
                            </List>
                            
                            <Button 
                                variant="contained" 
                                color="success" 
                                fullWidth 
                                startIcon={<DescriptionIcon />}
                                sx={{ mt: 2 }}
                                onClick={() => setColumnasDialogAbierto(true)}
                                disabled={asistentes.length === 0 || generandoExcel}
                            >
                                {generandoExcel ? 'Generando Excel...' : (asistentes.length === 0 ? 'No hay asistentes para exportar' : 'Exportar a Excel')}
                            </Button>
                            
                            <SeleccionarColumnasDialog
                                open={columnasDialogAbierto}
                                onClose={() => setColumnasDialogAbierto(false)}
                                columnasDisponibles={columnasExportacion}
                                columnasSeleccionadas={columnasSeleccionadas}
                                onAceptar={async (columnas) => {
                                    setColumnasSeleccionadas(columnas);
                                    setColumnasDialogAbierto(false);
                                    setGenerandoExcel(true);
                                    
                                    try {
                                        // Asegurarse de que las columnas sean un array
                                        const columnasArray = Array.isArray(columnas) ? columnas : [columnas];
                                        
                                        // Usar axios para la descarga con credenciales y parámetros de columnas
                                        // Para reuniones, la ruta es /actividades/<id>/exportar-excel pero con un parámetro adicional
                                        const url = esReunion 
                                            ? `/actividades/reuniones/${id}/exportar-excel`
                                            : `/actividades/${id}/exportar-excel`;
                                            
                                        const response = await axiosInstance.get(url, {
                                            responseType: 'blob',
                                            params: {
                                                columnas: columnasArray.join(',')
                                            },
                                            onDownloadProgress: (progressEvent) => {
                                                // Opcional: Mostrar progreso de descarga
                                                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                                                console.log(`Descargando: ${percentCompleted}%`);
                                            },
                                            paramsSerializer: params => {
                                                return Object.entries(params)
                                                    .map(([key, value]) => {
                                                        if (Array.isArray(value)) {
                                                            return `${key}=${value.join(',')}`;
                                                        }
                                                        return `${key}=${value}`;
                                                    })
                                                    .join('&');
                                            }
                                        });
                                        
                                        if (!response.data) {
                                            throw new Error('La respuesta del servidor está vacía');
                                        }

                                        // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
                                        const contentDisposition = response.headers['content-disposition'];
                                        let fileName = esReunion 
                                            ? `asistencia-reunion-${id}.xlsx` 
                                            : `asistencia-actividad-${id}.xlsx`;
                                        
                                        if (contentDisposition) {
                                            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                            if (fileNameMatch != null && fileNameMatch[1]) {
                                                fileName = fileNameMatch[1].replace(/['"]/g, '');
                                            }
                                        }

                                        // Crear un enlace temporal para la descarga
                                        const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.setAttribute('download', fileName);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        
                                        // Mostrar notificación de éxito
                                        enqueueSnackbar('Archivo Excel generado correctamente', { variant: 'success' });
                                    } catch (error) {
                                        console.error('Error al generar el archivo Excel:', error);
                                        enqueueSnackbar(
                                            error?.response?.data?.message || error.message || 'Error al generar el archivo Excel', 
                                            { 
                                                variant: 'error',
                                                autoHideDuration: 10000 // Mostrar por 10 segundos
                                            }
                                        );
                                    } finally {
                                        setGenerandoExcel(false);
                                    }
                                }}
                                titulo="Seleccionar columnas para exportar"
                                textoBotonAceptar="Generar Excel"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Acciones Rápidas
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                fullWidth 
                                startIcon={<PeopleIcon />}
                                sx={{ mb: 1 }}
                                onClick={() => navigate(`/funcionario/actividades/nueva`)}
                            >
                                Registrar Asistencia
                            </Button>
                            
                            <Button 
                                variant="outlined" 
                                color="secondary" 
                                fullWidth 
                                startIcon={<EditIcon />}
                                sx={{ mb: 1 }}
                                onClick={() => navigate(`/funcionario/actividades/editar/${id}`)}
                            >
                                Editar Actividad
                            </Button>
                            
                            <Button 
                                variant="outlined" 
                                color="error" 
                                fullWidth 
                                startIcon={<DeleteIcon />}
                                onClick={() => setConfirmOpen(true)}
                                disabled={deleting}
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar Actividad'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : null}
                    >
                        {deleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
            </Box>
        </PageLayout>
    );
};

export default DetalleActividad;
