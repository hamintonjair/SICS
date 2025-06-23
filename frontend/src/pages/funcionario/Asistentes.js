import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    Card, 
    CardContent, 
    CardHeader, 
    Divider, 
    Grid, 
    IconButton, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TablePagination,
    TextField,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    FormControl,
    InputLabel,
    InputAdornment,
    Select,
    MenuItem,
    Toolbar,
    Input,
    TableSortLabel
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Search as SearchIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import axiosInstance from '../../utils/axiosConfig';
import PageLayout from '../../components/layout/PageLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Estilos para la firma
const signatureStyles = {
  signatureContainer: {
    width: '100%',
    overflow: 'auto',
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    '@media (max-width: 600px)': {
      transform: 'rotate(0deg)',
      height: '180px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }
  },
  signatureCanvas: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    touchAction: 'none',
    '@media (max-width: 600px)': {
      transform: 'rotate(0deg)',
      width: '90% !important',
      height: '150px !important',
    }
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
    '@media (max-width: 600px)': {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: '8px'
    }
  },
  dialogContent: {
    padding: '20px',
    '@media (max-width: 600px)': {
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  },
  dialogTitle: {
    bgcolor: 'primary.main', 
    color: 'white',
    '@media (max-width: 600px)': {
      textAlign: 'center',
      padding: '16px'
    }
  }
};

const Asistentes = () => {
    // Estados del componente
    const [asistentes, setAsistentes] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
    const [orientation, setOrientation] = useState(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    );
    const [filteredAsistentes, setFilteredAsistentes] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    
    // Estados para paginación y ordenamiento
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('nombre');
    
    // Estados para búsqueda y filtros
    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState({
        dependencia: '',
        tipo_participacion: ''
    });

    // Efecto para detectar cambios en el tamaño de la pantalla y orientación
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 600);
            setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Limpiar listeners al desmontar
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);
    
    // Estados para los diálogos
    const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
    const [signature, setSignature] = useState(null);
    const sigCanvas = useRef(null);
    const [signatureReady, setSignatureReady] = useState(false);
    
    // Estado del formulario de asistente
    const [asistente, setAsistente] = useState({
        tipo: 'funcionario',
        nombre: '',
        cedula: '',
        dependencia: '',
        cargo: '',
        tipo_participacion: 'SERVIDOR PÚBLICO',
        telefono: '',
        email: '',
        firma: null
    });
    
    const [errores, setErrores] = useState({});

    // Constantes y configuraciones
    const pageTitle = 'Registro de Asistentes';
    const pageDescription = 'Formulario para registro de asistentes a reuniones';
    
    const tiposParticipacion = [
        'SERVIDOR PÚBLICO',
        'CONTRATISTA',
        'CIUDADANO',
        'LÍDER COMUNITARIO',
        'ESTUDIANTE',
        'JOVEN LÍDER'
    ];

    const navigate = useNavigate();

    // Cargar asistentes con filtros
    const cargarAsistentes = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/asistente');
            const data = response.data.data || [];
            setAsistentes(data);
            setFilteredAsistentes(data);
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            const mensajeError = error.response?.data?.message || 'Error al cargar la lista de asistentes';
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };
    
    // Aplicar filtros y búsqueda
    const aplicarFiltros = () => {
        let result = [...asistentes];
        
        // Aplicar búsqueda
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            result = result.filter(asistente => 
                asistente.nombre.toLowerCase().includes(searchLower) ||
                asistente.cedula.includes(searchText) ||
                asistente.dependencia.toLowerCase().includes(searchLower) ||
                (asistente.email && asistente.email.toLowerCase().includes(searchLower))
            );
        }
        
        // Aplicar filtros
        if (filters.dependencia) {
            result = result.filter(a => a.dependencia === filters.dependencia);
        }
        
        if (filters.tipo_participacion) {
            result = result.filter(a => a.tipo_participacion === filters.tipo_participacion);
        }
        
        setFilteredAsistentes(result);
        setPage(0); // Resetear a la primera página al aplicar filtros
    };
    
    // Ordenar asistentes
    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };
    
    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };
    
    const descendingComparator = (a, b, orderBy) => {
        if (b[orderBy] < a[orderBy]) return -1;
        if (b[orderBy] > a[orderBy]) return 1;
        return 0;
    };
    
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    // Manejadores de paginación
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    // Vaciar filtros
    const limpiarFiltros = () => {
        setSearchText('');
        setFilters({
            dependencia: '',
            tipo_participacion: ''
        });
    };
    
    // Efecto para aplicar filtros cuando cambian los valores de búsqueda o filtros
    useEffect(() => {
        if (asistentes.length > 0) {
            let result = [...asistentes];
            
            // Aplicar búsqueda
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                result = result.filter(asistente => 
                    (asistente.nombre && asistente.nombre.toLowerCase().includes(searchLower)) ||
                    (asistente.cedula && asistente.cedula.includes(searchText)) ||
                    (asistente.dependencia && asistente.dependencia.toLowerCase().includes(searchLower)) ||
                    (asistente.email && asistente.email.toLowerCase().includes(searchLower))
                );
            }
            
            // Aplicar filtros
            if (filters.dependencia) {
                result = result.filter(a => a.dependencia === filters.dependencia);
            }
            
            if (filters.tipo_participacion) {
                result = result.filter(a => a.tipo_participacion === filters.tipo_participacion);
            }
            
            setFilteredAsistentes(result);
            setPage(0); // Resetear a la primera página al aplicar filtros
        }
    }, [searchText, filters, asistentes]);

    useEffect(() => {
        cargarAsistentes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAsistente(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Validar cédula (7-10 dígitos numéricos)
    const validarCedula = (cedula) => {
        try {
            // Validar que sea un string con entre 7 y 10 dígitos numéricos
            return typeof cedula === 'string' && /^\d{7,10}$/.test(cedula);
        } catch (error) {
            console.error('Error al validar cédula:', error);
            return false;
        }
    };
    
    const validarFormulario = () => {
        const nuevosErrores = {};
        
        // Validar cédula única
        const cedulaExistente = asistentes.some(a => 
            a.cedula === asistente.cedula && a._id !== editingId
        );
        if (cedulaExistente) {
            nuevosErrores.cedula = 'Esta cédula ya está registrada';
        }
        
        // Validar formato de cédula (7-10 dígitos numéricos)
        if (asistente.cedula && !validarCedula(asistente.cedula)) {
            nuevosErrores.cedula = 'La cédula debe tener entre 7 y 10 dígitos numéricos';
        }
        
        // Validar email único si está presente
        if (asistente.email) {
            const emailExistente = asistentes.some(a => 
                a.email && a.email.toLowerCase() === asistente.email.toLowerCase() && a._id !== editingId
            );
            if (emailExistente) {
                nuevosErrores.email = 'Este correo electrónico ya está registrado';
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(asistente.email)) {
                nuevosErrores.email = 'Ingrese un correo electrónico válido';
            }
        }
        
        // Validar teléfono
        if (asistente.telefono && !/^[0-9]{7,10}$/.test(asistente.telefono)) {
            nuevosErrores.telefono = 'El teléfono debe tener entre 7 y 10 dígitos';
        }
        
        // Validar campos requeridos
        if (!asistente.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es requerido';
        }
        
        if (!asistente.cedula) {
            nuevosErrores.cedula = 'La cédula es requerida';
        } else if (!/^\d{7,10}$/.test(asistente.cedula)) {
            nuevosErrores.cedula = 'La cédula debe tener entre 7 y 10 dígitos';
        }
        
        if (!asistente.dependencia.trim()) {
            nuevosErrores.dependencia = 'La dependencia es requerida';
        }
        
        if (!asistente.cargo.trim()) {
            nuevosErrores.cargo = 'El cargo es requerido';
        }
        
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }
        
        try {
            if (editingId) {
                const { data } = await axiosInstance.put(`/api/asistente/${editingId}`, asistente);
                setSuccess(data.message || 'Asistente actualizado correctamente');
            } else {
                const { data } = await axiosInstance.post('/api/asistente', asistente);
                setSuccess(data.message || 'Asistente creado correctamente');
            }
            setOpenDialog(false);
            cargarAsistentes();
            // Resetear el formulario usando la lógica de handleOpenDialog
            setAsistente({
                tipo: 'funcionario',
                nombre: '',
                cedula: '',
                dependencia: '',
                cargo: '',
                tipo_participacion: 'SERVIDOR PÚBLICO',
                telefono: '',
                email: '',
                firma: null,
                linea_trabajo_id: ''
            });
            setSignature(null);
            setEditingId(null);
            setErrores({});
        } catch (error) {
            console.error('Error al guardar asistente:', error);
            const mensajeError = error.response?.data?.message || 'Error al guardar el asistente';
            setError(mensajeError);
        }
    };

    // Manejar la apertura del diálogo de nuevo asistente
    const handleOpenDialog = () => {
        setAsistente({
            tipo: 'funcionario',
            nombre: '',
            cedula: '',
            dependencia: '',
            cargo: '',
            tipo_participacion: 'SERVIDOR PÚBLICO',
            telefono: '',
            email: '',
            firma: null,
            linea_trabajo_id: ''
        });
        setSignature(null);
        setEditingId(null);
        setErrores({});
        setOpenDialog(true);
    };

    // Manejar la apertura del diálogo de firma
    const handleOpenSignatureDialog = () => {
        // Resetear el canvas de firma al abrir el diálogo
        if (sigCanvas.current) {
            // Limpiar el canvas
            sigCanvas.current.clear();
            // Si hay una firma guardada, restaurarla
            if (signature) {
                const image = new Image();
                image.src = signature;
                image.onload = () => {
                    const canvas = sigCanvas.current.getCanvas();
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                };
            }
        }
        // Reiniciar el estado de firma lista
        setSignatureReady(!!signature);
        // Abrir el diálogo
        setOpenSignatureDialog(true);
    };

    // Manejar el cierre del diálogo de firma
    const handleCloseSignatureDialog = () => {
        // No limpiar la firma existente al cerrar, solo cerrar el diálogo
        setOpenSignatureDialog(false);
    };

    // Manejar la limpieza de la firma
    const handleClearSignature = () => {
        try {
            if (!sigCanvas.current) {
                console.warn('El canvas de firma no está listo');
                return;
            }
            
            // Limpiar el canvas
            sigCanvas.current.clear();
            
            // Actualizar el estado de la firma
            setSignature(null);
            setSignatureReady(false);
            
            // Actualizar el estado del asistente para eliminar la firma
            setAsistente(prev => ({
                ...prev,
                firma: null
            }));
            
        } catch (error) {
            console.error('Error al limpiar la firma:', error);
            setError('Error al limpiar la firma. Por favor, inténtelo de nuevo.');
        }
    };

    // Manejar el guardado de la firma
    const handleSaveSignature = () => {
        try {
            if (!sigCanvas.current) {
                console.error('El canvas de firma no está disponible');
                setError('Error: El área de firma no está disponible');
                return;
            }
            
            if (sigCanvas.current.isEmpty()) {
                setError('Por favor, proporcione una firma válida');
                return;
            }
            
            // Obtener el canvas de firma
            const canvas = sigCanvas.current.getCanvas();
            
            // Crear un canvas temporal para mejorar la calidad
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Configurar el tamaño del canvas temporal (doble de resolución para mejor calidad)
            const scale = window.devicePixelRatio || 1;
            tempCanvas.width = canvas.width * scale;
            tempCanvas.height = canvas.height * scale;
            
            // Aplicar fondo blanco
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Dibujar la firma escalada
            tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Obtener la firma como imagen PNG
            const signatureData = tempCanvas.toDataURL('image/png');
            
            // Actualizar estados
            setSignature(signatureData);
            setAsistente(prev => ({
                ...prev,
                firma: signatureData
            }));
            
            // Cerrar el diálogo
            setOpenSignatureDialog(false);
            
            // Limpiar cualquier mensaje de error previo
            setError('');
            
        } catch (error) {
            console.error('Error al guardar la firma:', error);
            setError('Error al guardar la firma. Por favor, inténtelo de nuevo.');
        }
    };
    
    const handleRemoveSignature = () => {
        try {
            // Limpiar el canvas si está abierto
            if (sigCanvas.current) {
                sigCanvas.current.clear();
            }
            
            // Actualizar el estado de la firma
            setSignature(null);
            setSignatureReady(false);
            
            // Actualizar el estado del asistente
            setAsistente(prev => ({
                ...prev,
                firma: null
            }));
            
        } catch (error) {
            setError('Error al eliminar la firma. Por favor, inténtelo de nuevo.');
        }
    };

    const handleEdit = (asistente) => {
        try {
            // Actualizar el estado del asistente con los datos del asistente a editar
            const asistenteActualizado = {
                tipo: asistente.tipo || 'funcionario',
                nombre: asistente.nombre || '',
                cedula: asistente.cedula || '',
                dependencia: asistente.dependencia || '',
                cargo: asistente.cargo || '',
                tipo_participacion: asistente.tipo_participacion || 'SERVIDOR PÚBLICO',
                telefono: asistente.telefono || '',
                email: asistente.email || '',
                firma: asistente.firma || null,
                linea_trabajo_id: asistente.linea_trabajo_id || ''
            };
            
            // Actualizar el estado con los datos del asistente
            setAsistente(asistenteActualizado);
            
            // Si hay una firma, actualizar el estado de la firma
            if (asistente.firma) {
                setSignature(asistente.firma);
                setSignatureReady(true);
            } else {
                setSignature(null);
                setSignatureReady(false);
            }
            
            // Establecer el ID de edición y abrir el diálogo
            setEditingId(asistente._id);
            setOpenDialog(true);
            
        } catch (error) {
            setError('Error al cargar los datos del asistente. Por favor, inténtelo de nuevo.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este asistente?')) {
            try {
                const { data } = await axiosInstance.delete(`/api/asistente/${id}`);
                setSuccess(data.message || 'Asistente eliminado correctamente');
                cargarAsistentes();
            } catch (error) {
                const mensajeError = error.response?.data?.message || 'Error al eliminar el asistente';
                setError(mensajeError);
            }
        }
    };

    // La función resetForm ha sido eliminada y su lógica movida a handleOpenDialog

    // Estilos para el canvas de firma
    const styles = {
        signatureCanvas: {
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            height: '200px',
            backgroundColor: '#fff'
        },
        signaturePreview: {
            maxWidth: '100%',
            maxHeight: '100px',
            border: '1px solid #ddd',
            borderRadius: '4px'
        }
    };

    // Renderizar la tabla de asistentes
    const renderTable = () => {
        if (loading) {
            return <Typography>Cargando asistentes...</Typography>;
        }

        if (error) {
            return <Typography color="error">{error}</Typography>;
        }

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Cédula</TableCell>
                            <TableCell>Dependencia</TableCell>
                            <TableCell>Cargo</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAsistentes
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((asistente) => (
                                <TableRow key={asistente._id}>
                                    <TableCell>{asistente.nombre}</TableCell>
                                    <TableCell>{asistente.cedula}</TableCell>
                                    <TableCell>{asistente.dependencia}</TableCell>
                                    <TableCell>{asistente.cargo}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(asistente)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(asistente._id)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredAsistentes.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        );
    };

    // Renderizar el formulario
    const renderForm = () => {
        return (
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Nombre Completo"
                        name="nombre"
                        value={asistente.nombre}
                        onChange={handleInputChange}
                        error={!!errores.nombre}
                        helperText={errores.nombre}
                        margin="normal"
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Cédula"
                        name="cedula"
                        value={asistente.cedula}
                        onChange={(e) => {
                            // Solo permite números
                            const value = e.target.value.replace(/\D/g, '');
                            // Limita a 10 dígitos
                            if (value.length <= 10) {
                                handleInputChange({
                                    target: {
                                        name: 'cedula',
                                        value: value
                                    }
                                });
                            }
                        }}
                        error={!!errores.cedula}
                        helperText={errores.cedula || 'Mínimo 7, máximo 10 dígitos'}
                        margin="normal"
                        required
                        inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]{7,10}'
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Dependencia"
                        name="dependencia"
                        value={asistente.dependencia}
                        onChange={handleInputChange}
                        error={!!errores.dependencia}
                        helperText={errores.dependencia}
                        margin="normal"
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Cargo"
                        name="cargo"
                        value={asistente.cargo}
                        onChange={handleInputChange}
                        error={!!errores.cargo}
                        helperText={errores.cargo}
                        margin="normal"
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Tipo de Participación</InputLabel>
                        <Select
                            name="tipo_participacion"
                            value={asistente.tipo_participacion}
                            onChange={handleInputChange}
                            label="Tipo de Participación"
                        >
                            {tiposParticipacion.map((tipo) => (
                                <MenuItem key={tipo} value={tipo}>
                                    {tipo}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Teléfono"
                        name="telefono"
                        value={asistente.telefono}
                        onChange={handleInputChange}
                        error={!!errores.telefono}
                        helperText={errores.telefono || 'Opcional'}
                        margin="normal"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        value={asistente.email}
                        onChange={handleInputChange}
                        error={!!errores.email}
                        helperText={errores.email || 'Opcional'}
                        margin="normal"
                    />
                </Grid>
                <Grid item xs={12}>
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Firma Digital
                        </Typography>
                        {signature ? (
                            <Box>
                                <img 
                                    src={signature} 
                                    alt="Firma del asistente" 
                                    style={styles.signaturePreview}
                                />
                                <Box mt={1}>
                                    <Button 
                                        variant="outlined" 
                                        color="secondary" 
                                        onClick={handleOpenSignatureDialog}
                                        startIcon={<EditIcon />}
                                    >
                                        Cambiar Firma
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={handleRemoveSignature}
                                        startIcon={<DeleteIcon />}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        Eliminar Firma
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Button 
                                variant="outlined" 
                                onClick={handleOpenSignatureDialog}
                                startIcon={<AddIcon />}
                            >
                                Agregar Firma
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>
        );
    };

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box>
                <Card>
                    <CardHeader 
                        title="Listado de Asistentes"
                        action={
                            <Button 
                                variant="contained" 
                                color="success" 
                                startIcon={<AddIcon />}
                                onClick={handleOpenDialog}
                            >
                                Nuevo Asistente
                            </Button>
                        }
                    />
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Buscar..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchText && (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => setSearchText('')}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Dependencia</InputLabel>
                                    <Select
                                        value={filters.dependencia}
                                        onChange={(e) => setFilters({...filters, dependencia: e.target.value})}
                                        label="Dependencia"
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {Array.from(new Set(asistentes.map(a => a.dependencia))).map((dep, index) => (
                                            <MenuItem key={index} value={dep}>{dep}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Tipo de Participación</InputLabel>
                                    <Select
                                        value={filters.tipo_participacion}
                                        onChange={(e) => setFilters({...filters, tipo_participacion: e.target.value})}
                                        label="Tipo de Participación"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {tiposParticipacion.map((tipo, index) => (
                                            <MenuItem key={index} value={tipo}>{tipo}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    onClick={limpiarFiltros}
                                    startIcon={<ClearIcon />}
                                >
                                    Limpiar Filtros
                                </Button>
                            </Grid>
                        </Grid>
                        <Box mt={3}>
                            {renderTable()}
                        </Box>
                    </CardContent>
                </Card>

                {/* Diálogo para agregar/editar asistente */}
                <Dialog 
                    open={openDialog} 
                    onClose={() => setOpenDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <form onSubmit={handleSubmit}>
                        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            <Typography variant="h6" component="div">
                                {editingId ? 'Editar Asistente' : 'Nuevo Asistente'}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            {renderForm()}
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                onClick={() => {
                                    setOpenDialog(false);
                                    // Resetear el formulario al cancelar
                                    setAsistente({
                                        tipo: 'funcionario',
                                        nombre: '',
                                        cedula: '',
                                        dependencia: '',
                                        cargo: '',
                                        tipo_participacion: 'SERVIDOR PÚBLICO',
                                        telefono: '',
                                        email: '',
                                        firma: null,
                                        linea_trabajo_id: ''
                                    });
                                    setSignature(null);
                                    setEditingId(null);
                                    setErrores({});
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="success"
                                startIcon={<SaveIcon />}
                            >
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Diálogo para la firma digital */}
                <Dialog 
                    open={openSignatureDialog} 
                    onClose={handleCloseSignatureDialog}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        style: {
                            maxWidth: '800px',
                            margin: isMobile ? 0 : '16px',
                            width: isMobile ? '100%' : 'auto',
                            height: isMobile ? '100%' : 'auto',
                            maxHeight: isMobile ? 'none' : '90vh'
                        }
                    }}
                >
                    <DialogTitle sx={signatureStyles.dialogTitle}>
                        <Typography variant="h6" component="div">
                            {isMobile ? 'Firme en la pantalla' : 'Agregar Firma Digital'}
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={signatureStyles.dialogContent}>
                        <Box sx={signatureStyles.signatureContainer}>
                            {isMobile && (
                                <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
                                    Por favor, gire su dispositivo a modo horizontal para una mejor experiencia
                                </Typography>
                            )}
                            <SignatureCanvas
                                ref={sigCanvas}
                                onEnd={() => setSignatureReady(true)}
                                onBegin={() => setSignatureReady(true)}
                                penColor="black"
                                backgroundColor="rgba(255, 255, 255, 0.8)"
                                velocityFilterWeight={0.7}
                                minWidth={1.5}
                                maxWidth={2.5}
                                dotSize={1}
                                throttle={16}
                                canvasProps={{
                                    style: {
                                        ...signatureStyles.signatureCanvas,
                                        width: '100%',
                                        height: isMobile ? '150px' : '200px',
                                        touchAction: 'none',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#fff'
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={signatureStyles.buttonsContainer}>
                            <Button 
                                variant="outlined" 
                                onClick={handleClearSignature}
                                startIcon={<ClearIcon />}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Limpiar
                            </Button>
                            <Box>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleCloseSignatureDialog}
                                    startIcon={<CloseIcon />}
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{ mr: 1 }}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleSaveSignature}
                                    startIcon={<SaveIcon />}
                                    disabled={!signatureReady}
                                    size={isMobile ? 'small' : 'medium'}
                                >
                                    Guardar
                                </Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
        </PageLayout>
    );
};

export default Asistentes;
