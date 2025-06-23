import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Alert,
    Box, 
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { 
    Save as SaveIcon, 
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate, parse, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PageLayout from '../../components/layout/PageLayout';
import { 
    createActividad, 
    updateActividad, 
    getActividadById,
    registrarAsistencia
} from '../../services/actividadService';
import funcionarioService from '../../services/funcionarioService';
import { obtenerLineasTrabajo } from '../../services/lineaTrabajoService';
import { obtenerActividadPorId } from '../../services/actividadService';
import { obtenerAsistentes } from '../../services/asistenteService';

// Función para obtener una reunión por su ID
const obtenerReunionPorId = async (id) => {
    try {
        // Aquí deberías reemplazar esto con una llamada real a tu API
        // Por ahora, devolvemos un objeto vacío para evitar errores
        console.log('Obteniendo reunión con ID:', id);
        return {};
    } catch (error) {
        console.error('Error al obtener la reunión:', error);
        throw error;
    }
};

const NuevaReunion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState(null);
    const [asistentes, setAsistentes] = useState([]);
    const [asistentesDisponibles, setAsistentesDisponibles] = useState([]);
    const [asistentesFiltrados, setAsistentesFiltrados] = useState([]);
    const [filtroAsistente, setFiltroAsistente] = useState('');
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    
    const eliminarAsistente = (asistenteId) => {
        setAsistentes(asistentes.filter(id => id !== asistenteId));
    };
    
    const [formData, setFormData] = useState({
        tema: '',
        objetivo: '',
        lugar: '',
        dependencia: user?.dependencia || '',
        fecha: new Date(),
        hora_inicio: '09:00',
        hora_fin: '10:00',
        observaciones: '',
        linea_trabajo_id: user?.linea_trabajo_id || '',
        es_reunion: true
    });

    // Cargar asistentes cuando el componente se monte o cambie la línea de trabajo
    useEffect(() => {
        console.log('useEffect - Cargando datos iniciales...');
        const cargarDatosIniciales = async () => {
            try {
                console.log('Iniciando carga de datos iniciales...');
                setLoading(true);
                
                // Cargar datos de la reunión si estamos editando
                if (id) {
                    const reunion = await obtenerReunionPorId(id);
                    if (reunion) {
                        console.log('Reunión cargada:', reunion);
                        const reunionData = {
                            ...reunion,
                            fecha: reunion.fecha ? new Date(reunion.fecha) : new Date(),
                        };
                        setFormData(reunionData);
                        setAsistentes(reunion.asistentes?.map(a => a.funcionario_id) || []);
                    }
                }
                
                // Cargar asistentes (funcionarios) de la línea de trabajo
                if (user?.linea_trabajo_id) {
                    console.log(`Cargando asistentes para línea de trabajo: ${user.linea_trabajo_id}`);
                    const asistentesCargados = await cargarAsistentes({ 
                        linea_trabajo: user.linea_trabajo_id,
                        por_pagina: 1000 
                    });
                    console.log('Asistentes cargados en el efecto principal:', asistentesCargados);
                } else {
                    console.warn('No se pudo cargar asistentes: No hay línea de trabajo definida');
                    console.log('Datos del usuario:', user);
                }
                
            } catch (error) {
                setError('No se pudieron cargar los datos necesarios');
            } finally {
                setLoading(false);
            }
        };
        
        cargarDatosIniciales();
    }, [id, user?.linea_trabajo_id]);
    
    // Efecto para depuración
    useEffect(() => {
        console.log('Estado actual de asistentes:', {
            asistentesDisponibles: asistentesDisponibles,
            asistentesFiltrados: asistentesFiltrados,
            asistentesSeleccionados: asistentes,
            hayAsistentes: asistentesFiltrados.length > 0
        });
    }, [asistentesDisponibles, asistentesFiltrados, asistentes]);

    // Cargar datos iniciales al montar el componente
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                setLoading(true);
                
                // Cargar líneas de trabajo
                try {
                    const lineas = await obtenerLineasTrabajo();
                    setLineasTrabajo(lineas);
                } catch (error) {
                    console.error('Error al cargar líneas de trabajo:', error);
                }
                
                // Si es edición, cargar datos de la actividad
                if (id) {
                    const actividad = await getActividadById(id);
                    if (actividad) {
                        const actividadData = {
                            ...actividad,
                            fecha: actividad.fecha ? new Date(actividad.fecha) : new Date(),
                        };
                        setFormData(actividadData);
                        setAsistentes(actividad.asistentes?.map(a => a.beneficiario_id) || []);
                        
                        // Cargar todos los asistentes sin filtrar
                        await cargarAsistentes();
                    }
                } else {
                    // Cargar todos los asistentes sin filtrar
                    await cargarAsistentes();
                    
                    // Establecer la línea de trabajo del usuario
                    setFormData(prev => ({
                        ...prev,
                        linea_trabajo_id: user.linea_trabajo_id,
                        dependencia: user.dependencia || prev.dependencia
                    }));
                }
            } catch (err) {
                setError('No se pudieron cargar los datos necesarios');
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();
    }, [id, user]);

    // Función para cargar todos los asistentes sin condiciones
    const cargarAsistentes = async (filtros = {}) => {
        try {
            console.log('Iniciando carga de asistentes con filtros:', filtros);
            
            // Obtener todos los asistentes sin filtrar
            const response = await obtenerAsistentes();
            console.log('Respuesta de obtenerAsistentes():', response);
            
            // Asegurarse de que tenemos un array de asistentes
            let asistentesArray = [];
            
            // Manejar diferentes formatos de respuesta
            if (Array.isArray(response)) {
                asistentesArray = response;
            } else if (response && Array.isArray(response.data)) {
                asistentesArray = response.data;
            } else if (response && response.asistentes && Array.isArray(response.asistentes)) {
                asistentesArray = response.asistentes;
            }
            
            console.log('Asistentes después de procesar la respuesta:', asistentesArray);
                        
            // Mapear los datos de los asistentes al formato esperado
            const asistentesData = asistentesArray.map(asistente => {
                // Asegurarse de que cada asistente tenga un ID
                const id = asistente._id || asistente.id || Math.random().toString(36).substr(2, 9);
                
                // Construir nombre completo si no existe
                const nombreCompleto = asistente.nombre_completo || 
                    `${asistente.nombres || ''} ${asistente.apellidos || ''}`.trim() || 
                    'Nombre no disponible';
                
                return {
                    ...asistente,
                    _id: id,
                    id: id,
                    nombre_completo: nombreCompleto,
                    nombres: asistente.nombres || '',
                    apellidos: asistente.apellidos || '',
                    tipo_documento: asistente.tipo_documento || '',
                    numero_documento: asistente.numero_documento || asistente.documento || '',
                    documento: asistente.documento || asistente.numero_documento || '',
                    correo: asistente.correo || asistente.email || '',
                    telefono: asistente.telefono || '',
                    cargo: asistente.cargo || 'Sin cargo asignado',
                    linea_trabajo: asistente.linea_trabajo || '',
                    linea_trabajo_nombre: asistente.linea_trabajo_nombre || 'Sin línea asignada'
                };
            });
                        
            // Actualizar estados con todos los asistentes
            console.log('Asistentes cargados:', asistentesData);
            setAsistentesDisponibles(asistentesData);
            setAsistentesFiltrados(asistentesData);
            
            return asistentesData;
            
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            console.error('Detalles del error:', error.response?.data || error.message);
            
            setAsistentesDisponibles([]);
            setAsistentesFiltrados([]);
            return [];
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date, field) => {
        if (!date) {
            console.warn('Fecha no válida recibida');
            return;
        }
        
        const fechaValida = date instanceof Date && !isNaN(date) ? date : new Date();
        
        setFormData(prev => ({
            ...prev,
            [field]: fechaValida
        }));
    };
    
    const handleTimeChange = (time, field) => {
        const horaValida = time && !isNaN(new Date(time)) ? 
            format(time, 'HH:mm') : 
            field === 'hora_inicio' ? '09:00' : '10:00';
            
        setFormData(prev => ({
            ...prev,
            [field]: horaValida
        }));
    };
    
    const validarFormulario = () => {
        if (!formData.tema || formData.tema.trim().length < 3) {
            throw new Error('El tema es requerido y debe tener al menos 3 caracteres');
        }
        
        if (!formData.objetivo || formData.objetivo.trim().length < 10) {
            throw new Error('El objetivo es requerido y debe ser descriptivo');
        }
        
        if (!formData.lugar || !formData.dependencia) {
            throw new Error('El lugar y la dependencia son campos requeridos');
        }
        
        if (!formData.fecha || isNaN(new Date(formData.fecha))) {
            throw new Error('La fecha de la reunión no es válida');
        }
        
        if (!formData.hora_inicio || !formData.hora_fin) {
            throw new Error('Las horas de inicio y fin son requeridas');
        }
        
        if (!user?.linea_trabajo_id) {
            throw new Error('No se ha podido determinar la línea de trabajo');
        }
        
        if (asistentes.length === 0) {
            throw new Error('Debe seleccionar al menos un asistente para la reunión');
        }
        
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Validar el formulario
            validarFormulario();
            
            // Preparar los datos para enviar al backend
            const reunionData = {
                ...formData,
                tema: formData.tema.trim(),
                objetivo: formData.objetivo.trim(),
                lugar: formData.lugar.trim(),
                dependencia: formData.dependencia.trim(),
                fecha: format(formData.fecha, 'yyyy-MM-dd'),
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                linea_trabajo_id: user.linea_trabajo_id,
                funcionario_id: user.id,
                creado_por: user.id,
                tipo: 'reunion',  // Siempre establecer como 'reunion' para este componente
                asistentes: asistentes.map(id => ({
                    beneficiario_id: id,
                    asistio: true,
                    observaciones: 'Asistió a la reunión'
                }))
            };

            // Llamar al servicio correspondiente según sea creación o actualización
            let response;
            if (id) {
                response = await updateActividad(id, reunionData);
            } else {
                response = await createActividad(reunionData);
            }

            // Mostrar mensaje de éxito
            if (response && (response.message || response._id)) {
                navigate('/funcionario/actividades', { 
                    state: { 
                        message: id ? 'Reunión actualizada correctamente' : 'Reunión creada correctamente',
                        severity: 'success'
                    } 
                });
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }
        } catch (error) {
            let errorMessage = 'Error al guardar la reunión. Por favor, intente nuevamente.';
            
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = 'Datos inválidos. Por favor, verifique la información ingresada.';
                } else if (error.response.status === 401) {
                    errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
                } else if (error.response.status === 403) {
                    errorMessage = 'No tiene permisos para realizar esta acción.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Recurso no encontrado.';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión a Internet.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
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

    const pageTitle = id ? 'Editar Reunión' : 'Nueva Reunión';
    const pageDescription = (
        <Typography variant="h5" component="h1">
            {id ? 'Edita los detalles de la reunión' : 'Crea una nueva reunión y registra los asistentes'}
        </Typography>
    );

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
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
                        👈 Volver al listado
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
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
                                        Información Básica
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Tema de la reunión"
                                                name="tema"
                                                value={formData.tema}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Reunión de coordinación del equipo"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Objetivo"
                                                name="objetivo"
                                                value={formData.objetivo}
                                                onChange={handleChange}
                                                multiline
                                                rows={4}
                                                required
                                                margin="normal"
                                                placeholder="Describa el objetivo principal de la reunión"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Lugar"
                                                name="lugar"
                                                value={formData.lugar}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Sala de juntas, Piso 3"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Dependencia"
                                                name="dependencia"
                                                value={formData.dependencia}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Departamento de Recursos Humanos"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <DatePicker
                                                    label="Fecha de la reunión"
                                                    value={formData.fecha}
                                                    onChange={(date) => handleDateChange(date, 'fecha')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <TimePicker
                                                    label="Hora de inicio"
                                                    value={formData.hora_inicio ? parse(formData.hora_inicio, 'HH:mm', new Date()) : null}
                                                    onChange={(time) => handleTimeChange(time, 'hora_inicio')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <TimePicker
                                                    label="Hora de fin"
                                                    value={formData.hora_fin ? parse(formData.hora_fin, 'HH:mm', new Date()) : null}
                                                    onChange={(time) => handleTimeChange(time, 'hora_fin')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Línea de Trabajo"
                                                value={user?.linea_trabajo_nombre || 'No asignada'}
                                                disabled
                                                margin="normal"
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                            <input 
                                                type="hidden" 
                                                name="linea_trabajo_id" 
                                                value={user?.linea_trabajo_id || ''} 
                                            />
                                        </Grid>
                                        
                                     
                                        
                                        <Grid item xs={12}>
                                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                                <Button 
                                                    variant="contained"
                                                    color="success"
                                                    type="submit"
                                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Guardando...' : 'Guardar Reunión'}
                                                </Button>
                                            </Box>
                                        </Grid>
                                        
                                     


                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography 
                                        variant="h6"
                                        sx={{
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: 1,
                                            textAlign: 'center',
                                            mb: 2
                                        }}
                                    >
                                        <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        Asistentes
                                    </Typography>
                                    
                                    {/* Lista de asistentes disponibles */}
                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2">
                                                Seleccionar asistentes
                                                {asistentesFiltrados.length > 0 && (
                                                    <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                        ({asistentesFiltrados.length} disponibles)
                                                    </Typography>
                                                )}
                                            </Typography>
                                            {asistentesFiltrados.length > 0 && (
                                                <Button 
                                                    size="small" 
                                                    onClick={() => {
                                                        if (asistentes.length === asistentesFiltrados.length) {
                                                            setAsistentes([]);
                                                        } else {
                                                            setAsistentes(asistentesFiltrados.map(a => a._id));
                                                        }
                                                    }}
                                                >
                                                    {asistentes.length === asistentesFiltrados.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                                                </Button>
                                            )}
                                        </Box>
                                        
                                        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                                            {asistentesFiltrados.length > 0 ? (
                                                <List dense>
                                                    {asistentesFiltrados.map((asistente) => (
                                                        <ListItem 
                                                            key={asistente._id}
                                                            dense
                                                            button
                                                            onClick={() => {
                                                                const nuevosAsistentes = asistentes.includes(asistente._id)
                                                                    ? asistentes.filter(id => id !== asistente._id)
                                                                    : [...asistentes, asistente._id];
                                                                setAsistentes(nuevosAsistentes);
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <Checkbox
                                                                    edge="start"
                                                                    checked={asistentes.includes(asistente._id)}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={asistente.nombre}
                                                                secondary={asistente.cargo || 'Sin cargo'}
                                                                secondaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        No hay asistentes disponibles
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Paper>
                                    </Box>
                                    
                                    {/* Lista de asistentes seleccionados */}
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2">
                                                Asistentes seleccionados
                                                {asistentes.length > 0 && (
                                                    <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                        ({asistentes.length} seleccionados)
                                                    </Typography>
                                                )}
                                            </Typography>
                                            {asistentes.length > 0 && (
                                                <Button 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => setAsistentes([])}
                                                    startIcon={<ClearAllIcon />}
                                                >
                                                    Limpiar
                                                </Button>
                                            )}
                                        </Box>
                                        
                                        {asistentes.length > 0 ? (
                                            <Paper variant="outlined">
                                                <List dense>
                                                    {asistentes.map(asistenteId => {
                                                        const asistente = asistentesFiltrados.find(a => a._id === asistenteId);
                                                        if (!asistente) return null;
                                                        
                                                        return (
                                                            <ListItem 
                                                                key={asistenteId}
                                                                secondaryAction={
                                                                    <IconButton 
                                                                        edge="end" 
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setAsistentes(asistentes.filter(id => id !== asistenteId));
                                                                        }}
                                                                        color="error"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                }
                                                                sx={{
                                                                    '&:hover': {
                                                                        backgroundColor: 'action.hover',
                                                                        borderRadius: 1
                                                                    },
                                                                    '& .MuiListItemSecondaryAction-root': {
                                                                        right: '8px'
                                                                    }
                                                                }}
                                                            >
                                                                <ListItemText 
                                                                    primary={asistente.nombre}
                                                                    secondary={asistente.cargo || 'Sin cargo'}
                                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                                />
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            </Paper>
                                        ) : (
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    No hay asistentes seleccionados
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </PageLayout>
    );
};

export default NuevaReunion;
