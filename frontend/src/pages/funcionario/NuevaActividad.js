import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Alert,
    Box, 
    Button, 
    Card, 
    CardContent, 
    Checkbox, 
    FormControl, 
    FormControlLabel, 
    Grid, 
    IconButton, 
    InputLabel, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    MenuItem, 
    Select, 
    TextField, 
    Typography, 
    Divider,
    CircularProgress,
    Paper,
    Tooltip
} from '@mui/material';
import { 
    Save as SaveIcon, 
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate, parse, parseISO, format, isAfter, isBefore, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { debounce } from 'lodash';
import { 
    createActividad, 
    updateActividad, 
    getActividadById,
    registrarAsistencia
} from '../../services/actividadService';
import { obtenerBeneficiarios } from '../../services/beneficiarioService';
import { obtenerLineasTrabajo } from '../../services/lineaTrabajoService';
import PageLayout from '../../components/layout/PageLayout';

// Cache para almacenar los beneficiarios por línea de trabajo
const beneficiariosCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos de caché

const NuevaActividad = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState(null);
    // Estados para la gestión de beneficiarios
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [beneficiariosFiltrados, setBeneficiariosFiltrados] = useState([]);
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [asistentes, setAsistentes] = useState([]);
    const [loadingBeneficiarios, setLoadingBeneficiarios] = useState(false);
    
    // Estado para el formulario
    const [formData, setFormData] = useState({
        tema: '',
        objetivo: '',
        lugar: '',
        dependencia: '',
        fecha: new Date(),
        hora_inicio: '09:00',
        hora_fin: '10:00',
        observaciones: '',
        linea_trabajo_id: user?.linea_trabajo_id || ''
    });

    // Función para cargar beneficiarios con caché
    const cargarBeneficiarios = useCallback(async (lineaTrabajoId, forzarActualizacion = false) => {
        if (!lineaTrabajoId) return;

        // Verificar caché
        const ahora = Date.now();
        const cacheEntry = beneficiariosCache[lineaTrabajoId];
        
        if (!forzarActualizacion && cacheEntry && (ahora - cacheEntry.timestamp < CACHE_DURATION)) {
            setBeneficiarios(cacheEntry.data);
            setBeneficiariosFiltrados(cacheEntry.data);
            return;
        }

        setLoadingBeneficiarios(true);
        try {
            const response = await obtenerBeneficiarios({ 
                linea_trabajo: lineaTrabajoId,
                por_pagina: 1000,
                _t: ahora // Evitar caché del navegador
            });

            const data = response.beneficiarios || [];
            
            // Actualizar caché
            beneficiariosCache[lineaTrabajoId] = {
                data,
                timestamp: ahora
            };

            setBeneficiarios(data);
            setBeneficiariosFiltrados(data);
        } catch (error) {
            console.error('Error al cargar beneficiarios:', error);
            // Si hay caché, usarlo a pesar del error
            if (cacheEntry?.data) {
                setBeneficiarios(cacheEntry.data);
                setBeneficiariosFiltrados(cacheEntry.data);
            }
        } finally {
            setLoadingBeneficiarios(false);
        }
    }, []);

    // Efecto para cargar beneficiarios cuando cambia la línea de trabajo
    useEffect(() => {
        const lineaTrabajoId = formData.linea_trabajo_id || user?.linea_trabajo_id;
        if (lineaTrabajoId) {
            cargarBeneficiarios(lineaTrabajoId);
        }
    }, [formData.linea_trabajo_id, user?.linea_trabajo_id, cargarBeneficiarios]);

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
                    }
                } else if (user?.linea_trabajo_id) {
                    // Para nueva actividad, establecer la línea de trabajo del usuario
                    setFormData(prev => ({
                        ...prev,
                        linea_trabajo_id: user.linea_trabajo_id
                    }));
                    // Los beneficiarios se cargarán automáticamente por el efecto
                }
            } catch (err) {
                console.error('Error al cargar datos iniciales:', err);
                setError('No se pudieron cargar los datos necesarios');
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Función para filtrar beneficiarios localmente
    const filtrarBeneficiarios = useCallback((texto) => {
        if (!texto || !texto.trim()) {
            setBeneficiariosFiltrados(beneficiarios);
            return;
        }

        const textoBusqueda = texto.toLowerCase();
        const filtrados = beneficiarios.filter(beneficiario => 
            (beneficiario.nombre_completo?.toLowerCase().includes(textoBusqueda) ||
             beneficiario.numero_documento?.includes(textoBusqueda))
        );

        setBeneficiariosFiltrados(filtrados);
    }, [beneficiarios]);

    // Función para forzar la actualización de beneficiarios
    const actualizarListaBeneficiarios = useCallback(() => {
        const lineaTrabajoId = formData.linea_trabajo_id || user?.linea_trabajo_id;
        if (lineaTrabajoId) {
            cargarBeneficiarios(lineaTrabajoId, true);
        }
    }, [formData.linea_trabajo_id, user?.linea_trabajo_id, cargarBeneficiarios]);

    // Función para manejar el cambio de búsqueda con debounce
    const handleBuscarBeneficiario = useMemo(
        () => debounce((valor) => filtrarBeneficiarios(valor), 300),
        [filtrarBeneficiarios]
    );

    // Limpiar el debounce al desmontar
    useEffect(() => {
        return () => {
            handleBuscarBeneficiario.cancel();
        };
    }, [handleBuscarBeneficiario]);

    // Efecto para cargar beneficiarios cuando cambia la línea de trabajo
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const lineaTrabajoId = formData.linea_trabajo_id || user?.linea_trabajo_id;
                if (lineaTrabajoId) {
                    await cargarBeneficiarios(lineaTrabajoId);
                }
            } catch (error) {
                console.error('Error al cargar beneficiarios:', error);
            }
        };
        
        cargarDatos();
    }, [formData.linea_trabajo_id, user?.linea_trabajo_id, cargarBeneficiarios]);

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
        
        // Asegurarse de que la fecha sea un objeto Date válido
        const fechaValida = date instanceof Date && !isNaN(date) ? date : new Date();
        
        setFormData(prev => ({
            ...prev,
            [field]: fechaValida
        }));
    };
    
    const handleTimeChange = (time, field) => {
        // Si time es null o no es una fecha válida, usar la hora actual
        const horaValida = time && !isNaN(new Date(time)) ? 
            format(time, 'HH:mm') : 
            field === 'hora_inicio' ? '09:00' : '10:00';
            
        setFormData(prev => ({
            ...prev,
            [field]: horaValida
        }));
    };
    
    // Función para validar los datos del formulario
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
            throw new Error('La fecha de la actividad no es válida');
        }
        
        if (!formData.hora_inicio || !formData.hora_fin) {
            throw new Error('Las horas de inicio y fin son requeridas');
        }
        
        if (!user?.linea_trabajo_id) {
            throw new Error('No se ha podido determinar la línea de trabajo');
        }
        
        return true;
    };
    
    // Función para verificar si un beneficiario ya está en otra actividad en la misma fecha
    const estaEnOtraActividad = async (beneficiarioId, fecha) => {
        try {
            // Aquí deberías implementar la lógica para verificar si el beneficiario
            // ya está registrado en otra actividad en la misma fecha
            // Por ahora, retornamos false para no bloquear la selección
            return false;
        } catch (error) {
            return false;
        }
    };
    
    const handleLineaTrabajoChange = (e) => {
        const lineaTrabajoId = e.target.value;
        const newFormData = {
            ...formData,
            linea_trabajo_id: lineaTrabajoId
        };
        setFormData(newFormData);
        
        // No es necesario filtrar aquí ya que el efecto se encargará de ello
    };



    const eliminarAsistente = (asistenteId) => {
        setAsistentes(asistentes.filter(id => id !== asistenteId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Validar el formulario
            validarFormulario();
            
            // Validar que haya al menos un asistente
            if (asistentes.length === 0) {
                throw new Error('Debe seleccionar al menos un asistente para la actividad');
            }

            // Preparar los datos para enviar al backend
            const actividadData = {
                tema: formData.tema.trim(),
                objetivo: formData.objetivo.trim(),
                lugar: formData.lugar.trim(),
                dependencia: formData.dependencia.trim(),
                fecha: format(formData.fecha, 'yyyy-MM-dd'),
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                linea_trabajo_id: user.linea_trabajo_id,
                funcionario_id: user.id, // Asegurarse de que user.id esté disponible
                creado_por: user.id, // Mismo ID del funcionario
                tipo: 'actividad',  // Siempre establecer como 'actividad' para este componente
                observaciones: formData.observaciones?.trim() || '',
                asistentes: asistentes.map(id => ({
                    beneficiario_id: id,
                    asistio: true,
                    observaciones: ''
                }))
            };

            // Llamar al servicio correspondiente según sea creación o actualización
            let response;
            if (id) {
                response = await updateActividad(id, actividadData);
            } else {
                response = await createActividad(actividadData);
            }

            // Mostrar mensaje de éxito
            if (response && (response.message || response._id)) {
                // Redirigir a la lista de actividades con mensaje de éxito
                navigate('/funcionario/actividades', { 
                    state: { 
                        message: id ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente',
                        severity: 'success'
                    } 
                });
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }
        } catch (error) {
            
            // Manejar errores específicos de la API
            let errorMessage = 'Error al guardar la actividad. Por favor, intente nuevamente.';
            
            if (error.response) {
                // El servidor respondió con un estado de error
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
                // La petición fue hecha pero no se recibió respuesta
                errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión a Internet.';
            } else if (error.message) {
                // Error en el mensaje de validación
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            
            // Desplazarse al principio del formulario para mostrar el error
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

    const pageTitle = id ? 'Editar Actividad' : 'Nueva Actividad';
    const pageDescription = (
        <Typography variant="h5" component="h1">
            {id ? 'Edita los detalles de la actividad' : 'Crea una nueva actividad para registrar asistentes'}
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
  {'👈  '+ 'Volver atras'}                </Typography>
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
                                            label="Tema de la actividad"
                                            name="tema"
                                            value={formData.tema}
                                            onChange={handleChange}
                                            required
                                            margin="normal"
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
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={4}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                            <DatePicker
                                                label="Fecha de la actividad"
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
                                                {saving ? 'Guardando...' : 'Guardar Actividad'}
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
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
                                    <Typography 
                                        variant="h6"
                                        sx={{
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: 1,
                                            flex: '0 0 auto',
                                            whiteSpace: 'nowrap',
                                            minWidth: '120px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Asistentes
                                    </Typography>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                        <DatePicker
                                            label="Filtrar por fecha"
                                            value={filtroFecha}
                                            onChange={(date) => {
                                                setFiltroFecha(date);
                                                cargarBeneficiarios(date ? { fecha: format(date, 'yyyy-MM-dd') } : {});
                                            }}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    size="small"
                                                    sx={{ 
                                                        flex: '1 1 auto',
                                                        maxWidth: '300px',
                                                        '& .MuiFormHelperText-root': {
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            width: '100%',
                                                            display: 'block'
                                                        }
                                                    }}
                                                    helperText="Filtrar por fecha de atención"
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box mb={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Beneficiarios disponibles ({beneficiariosFiltrados.length})
                                    </Typography>
                                    
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Button 
                                            size="small"
                                            onClick={() => {
                                                // Agregar todos los beneficiarios filtrados que no estén ya en asistentes
                                                const nuevosAsistentes = [...new Set([...asistentes, ...beneficiariosFiltrados
                                                    .filter(b => !asistentes.includes(b._id))
                                                    .map(b => b._id)
                                                ])];
                                                setAsistentes(nuevosAsistentes);
                                            }}
                                            disabled={beneficiariosFiltrados.length === 0}
                                        >
                                            Seleccionar todos
                                        </Button>
                                        <Button 
                                            size="small" 
                                            color="error"
                                            onClick={() => {
                                                // Mantener solo los asistentes que no estén en los beneficiarios filtrados
                                                const nuevosAsistentes = asistentes.filter(
                                                    id => !beneficiariosFiltrados.some(b => b._id === id)
                                                );
                                                setAsistentes(nuevosAsistentes);
                                            }}
                                            disabled={asistentes.length === 0}
                                        >
                                            Deseleccionar todos
                                        </Button>
                                    </Box>
                                    
                                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1, mb: 2 }}>
                                        {beneficiariosFiltrados.length > 0 ? (
                                            <List dense>
                                                {beneficiariosFiltrados.map((beneficiario) => (
                                                    <ListItem 
                                                        key={beneficiario._id} 
                                                        dense 
                                                        button
                                                        onClick={() => {
                                                            const nuevosAsistentes = asistentes.includes(beneficiario._id)
                                                                ? asistentes.filter(id => id !== beneficiario._id)
                                                                : [...asistentes, beneficiario._id];
                                                            setAsistentes(nuevosAsistentes);
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <Checkbox
                                                                edge="start"
                                                                checked={asistentes.includes(beneficiario._id)}
                                                                tabIndex={-1}
                                                                disableRipple
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={`${beneficiario.nombre_completo
                                                            }`} 
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary" align="center" sx={{ p: 2 }}>
                                                No hay beneficiarios disponibles
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2">
                                        Asistentes seleccionados ({asistentes.length})
                                    </Typography>
                                    {asistentes.length > 0 && (
                                        <Button 
                                            size="small" 
                                            color="error"
                                            onClick={() => setAsistentes([])}
                                            startIcon={<ClearAllIcon />}
                                        >
                                            Limpiar todo
                                        </Button>
                                    )}
                                </Box>
                                
                                <Box sx={{ 
                                    maxHeight: 200, 
                                    overflow: 'auto',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    p: 1
                                }}>
                                    {asistentes.length > 0 ? (
                                        <List dense>
                                            {asistentes.map((asistenteId) => {
                                                const asistente = beneficiarios.find(b => b._id === asistenteId);
                                                if (!asistente) return null;
                                                
                                                return (
                                                    <ListItem 
                                                        key={asistenteId}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                                borderRadius: 1
                                                            },
                                                            '& .MuiListItemSecondaryAction-root': {
                                                                right: '8px'
                                                            }
                                                        }}
                                                        secondaryAction={
                                                            <IconButton 
                                                                edge="end" 
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    eliminarAsistente(asistenteId);
                                                                }}
                                                                color="error"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        }
                                                    >
                                                        <ListItemText 
                                                            primary={`${asistente.nombre_completo}`} 
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary" align="center" sx={{ p: 2 }}>
                                            No hay asistentes seleccionados
                                        </Typography>
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

export default NuevaActividad;
