// React y hooks
import React, { useState, useEffect, useCallback } from 'react';

// MUI - Componentes de UI
import { 
    Container, Typography, Box,  Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, TextField,
    TablePagination, Tooltip, Dialog, DialogTitle, DialogContent,
    List, ListItem, ListItemText, Grid, CircularProgress
} from '@mui/material';

// MUI - Iconos
import {
    Edit as EditIcon, 
    Close as CloseIcon
} from '@mui/icons-material';

// React Router
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';

// Contextos
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';

// Servicios
import { 
    listarBeneficiarios, 
    obtenerDetallesBeneficiario
} from '../../services/beneficiarioService';


export default function ListadoBeneficiarios() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
   

    // Estados para manejo de beneficiarios
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [totalBeneficiarios, setTotalBeneficiarios] = useState(0);
    const [filtro, setFiltro] = useState('');
    const [lineaTrabajo, setLineaTrabajo] = useState('');
    const [paginacion, setPaginacion] = useState({
        pagina: 0,
        porPagina: 10
    });
    const handleNuevoRegistro = () => {
        navigate('/funcionario/registro-poblacion');
    };
    // Estados para diálogos
    const [formulariosBeneficiario, setFormulariosBeneficiario] = useState([]);
    const [detallesBeneficiario, setDetallesBeneficiario] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const pageTitle = 'Listado de personas registradas en el programa';
    const pageDescription =  <Typography variant="h5" gutterBottom>
        {lineaTrabajo || user?.linea_trabajo}
   </Typography>;
    // Estado para overlay de carga
    const [loadingOverlay, setLoadingOverlay] = useState(false);

    // Cargar beneficiarios con useCallback para optimizar
    const cargarBeneficiarios = useCallback(async () => {
        setLoadingOverlay(true);
        try {
          

            const { data, total } = await listarBeneficiarios(
                paginacion.pagina + 1,
                paginacion.porPagina,
                filtro,
                user.linea_trabajo
            );            


            setBeneficiarios(data);
            setTotalBeneficiarios(total);

            // Establecer línea de trabajo del primer beneficiario o de la sesión
            const nombreLineaTrabajo = data.length > 0 
                ? (data[0].nombre_linea_trabajo || data[0].linea_trabajo)
                : user.linea_trabajo;
            
            setLineaTrabajo(nombreLineaTrabajo);

        } catch (error) {
        
            enqueueSnackbar('Error al cargar beneficiarios', { variant: 'error' });
        } finally {
            setLoadingOverlay(false);
        }
    }, [paginacion.pagina, paginacion.porPagina, filtro, user, enqueueSnackbar]);

    // Efecto para cargar beneficiarios
    useEffect(() => {
       

        if (user?.linea_trabajo) {
            cargarBeneficiarios();
        } else {
            console.warn('No se puede cargar beneficiarios: usuario sin línea de trabajo');
        }
    }, [cargarBeneficiarios, user]);

    // Manejadores de eventos
    const handleEditar = useCallback(async (beneficiario) => {
        try {
            // Obtener detalles completos del beneficiario
            const detalles = await obtenerDetallesBeneficiario(beneficiario._id);
            
            // Navegar al formulario de registro en modo edición
            navigate('/funcionario/registro-poblacion', { 
                state: { 
                    beneficiario: detalles,
                    modoEdicion: true 
                } 
            });
        } catch (error) {
            enqueueSnackbar('Error al obtener información del beneficiario', { variant: 'error' });
            console.error(error);
        }
    }, [navigate, enqueueSnackbar]);

    const handleCerrarDialog = () => {
        setDialogOpen(false);
        setFormulariosBeneficiario([]);
        setDetallesBeneficiario(null);
    };

    const handleCambioPagina = useCallback((event, nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }));
    }, []);

    const handleCambioPorPagina = useCallback((event) => {
        setPaginacion(prev => ({ 
            ...prev, 
            porPagina: parseInt(event.target.value, 10),
            pagina: 0 
        }));
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
                {/* <Typography variant="h5" gutterBottom>
                     {lineaTrabajo || user?.linea_trabajo}
                </Typography> */}

                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2 
                }}>
                    {/* Eliminado título duplicado y botón */}
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Filtros y controles de búsqueda */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Buscar habitante"
                            variant="outlined"
                            value={filtro}
                            onChange={(event) => {
                                setFiltro(event.target.value);
                                setPaginacion(prev => ({ ...prev, pagina: 0 }));
                            }}
                        />
                    </Grid>

                    {/* Resto del código de filtros */}
                </Grid>
                <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={handleNuevoRegistro}
                    >
                        Nuevo Registro
                    </Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre Funcionario</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Línea de Trabajo</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre Beneficiario</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Fecha de Registro</TableCell>
                                <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {beneficiarios.map((beneficiario) => (
                                <TableRow key={beneficiario._id}>
                                    <TableCell>{beneficiario.funcionario_nombre}</TableCell>
                                    <TableCell>{beneficiario.nombre_linea_trabajo || beneficiario.linea_trabajo}</TableCell>
                                    <TableCell>{beneficiario.nombre_completo}</TableCell>
                                    <TableCell>
                                        {new Date(beneficiario.fecha_registro).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Editar">
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleEditar(beneficiario)}
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

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalBeneficiarios}
                    rowsPerPage={paginacion.porPagina}
                    page={paginacion.pagina}
                    onPageChange={handleCambioPagina}
                    onRowsPerPageChange={handleCambioPorPagina}
                    labelRowsPerPage="Beneficiarios por página"
                    labelDisplayedRows={({ from, to, count }) => 
                        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                />

                {/* Diálogo de Detalles y Formularios */}
                <Dialog 
                    open={dialogOpen} 
                    onClose={handleCerrarDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Detalles del Beneficiario
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
                        {detallesBeneficiario && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Información Personal</Typography>
                                <Typography>Nombre: {detallesBeneficiario.nombre_completo}</Typography>
                                <Typography>Documento: {detallesBeneficiario.numero_documento}</Typography>
                            </Box>
                        )}

                        <Typography variant="h6">Formularios Registrados</Typography>
                        {formulariosBeneficiario.length > 0 ? (
                            <List>
                                {formulariosBeneficiario.map((formulario, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={`Formulario ${index + 1}`}
                                            secondary={`Fecha: ${new Date(formulario.fecha_registro).toLocaleString()}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>No hay formularios registrados</Typography>
                        )}
                    </DialogContent>
                </Dialog>
            </Container>
        </Box>
        </PageLayout>
    );
}
