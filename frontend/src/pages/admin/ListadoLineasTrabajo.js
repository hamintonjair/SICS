import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Add as AddIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../../services/usuarioService';

const ListadoLineasTrabajo = () => {
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [error, setError] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [loadingOverlay, setLoadingOverlay] = useState(false);
    const navigate = useNavigate();

    // Función auxiliar para extraer ID de una línea de trabajo
    const extraerIdLineaTrabajo = (linea) => {
     
        // Verificar si la línea es null o undefined
        if (!linea) {
            console.warn('Línea de trabajo es null o undefined');
            console.groupEnd();
            return null;
        }

        // Intentar extraer ID de diferentes campos
        const posiblesIds = [
            linea._id,  // ID de MongoDB
            linea.id,   // ID genérico
            linea['$oid'],  // Formato específico de MongoDB
            linea.identificador,
            linea.identificacion
        ];

        // Registro de posibles IDs
      
        // Filtrar IDs no nulos y no indefinidos
        const idsValidos = posiblesIds.filter(id => {
            const esValido = id !== null && 
                             id !== undefined && 
                             id !== 'undefined' && 
                             (typeof id === 'string' ? id.trim() !== '' : true);
            
            // Registro de validez de cada ID
            
            return esValido;
        });

        // Registro de IDs válidos
      
        // Devolver el primer ID válido o null
        const idFinal = idsValidos.length > 0 ? idsValidos[0] : null;
        
      

        return idFinal;
    };

    useEffect(() => {
        const cargarLineasTrabajo = async () => {
            setLoadingOverlay(true);
            try {
                const data = await usuarioService.obtenerLineasTrabajo();
                
                // Asegurar que cada línea tenga un ID válido
                const lineasConId = data.map(linea => {
                    const lineaId = extraerIdLineaTrabajo(linea);
                    
                    if (!lineaId) {
                        console.warn('Línea de trabajo sin ID válido:', linea);
                    }
                    
                    return {
                        ...linea,
                        _id: lineaId,
                        id: lineaId
                    };
                });
                
                setLineasTrabajo(lineasConId);
            } catch (error) {
                setError('No se pudieron cargar las líneas de trabajo');
            } finally {
                setLoadingOverlay(false);
            }
        };

        cargarLineasTrabajo();
    }, []);

    const handleEliminar = async () => {
        try {
            const lineaId = extraerIdLineaTrabajo(lineaSeleccionada);
            
            if (!lineaId) {
                setError('No se puede eliminar: ID de línea de trabajo no válido');
                setOpenSnackbar(true);
                return;
            }
            
            await usuarioService.eliminarLineaTrabajo(lineaId);
            
            setLineasTrabajo(prev => prev.filter(l => extraerIdLineaTrabajo(l) !== lineaId));
            setOpenConfirmDialog(false);
        } catch (error) {
            console.error('Error al eliminar línea de trabajo:', error);
            setError('No se pudo eliminar la línea de trabajo');
            setOpenSnackbar(true);
        }
    };

    const confirmarEliminacion = (linea) => {
        setLineaSeleccionada(linea);
        setOpenConfirmDialog(true);
    };

    const handleEditar = async (linea) => {
        console.group('Diagnóstico de edición de línea de trabajo');
    
        
        try {
            // Intentar obtener el ID de la línea de trabajo
            const lineaId = extraerIdLineaTrabajo(linea);
            
            
            if (!lineaId) {
                setError('No se puede editar: ID de línea de trabajo no válido');
                setOpenSnackbar(true);
                
                // Intentar recuperar el ID desde el backend
                try {
                    const lineaConId = await usuarioService.obtenerLineaTrabajoPorNombre(linea.nombre);
                    
                    if (lineaConId && lineaConId._id) {
                        navigate(`/admin/lineas-trabajo/editar/${lineaConId._id}`);
                    } else {
                        console.error('No se pudo recuperar el ID de la línea de trabajo');
                        setError('No se pudo encontrar el ID de la línea de trabajo');
                        setOpenSnackbar(true);
                    }
                } catch (error) {
                    console.error('Error al recuperar la línea de trabajo:', error);
                    setError('Error al buscar la línea de trabajo');
                    setOpenSnackbar(true);
                }
                
                console.groupEnd();
                return;
            }
            
            navigate(`/admin/lineas-trabajo/editar/${lineaId}`);
            
        } catch (error) {
            console.error('Error inesperado en handleEditar:', error);
            setError('Error inesperado al editar línea de trabajo');
            setOpenSnackbar(true);
            console.groupEnd();
        }
    };

    const handleNuevaLineaTrabajo = () => {
        navigate('/admin/lineas-trabajo/crear');
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <div>
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
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>
            
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2 
                }}
            >
                <Typography variant="h5">
                
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleNuevaLineaTrabajo}
                >
                    Nueva Línea de Trabajo
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
<TableBody>
    {lineasTrabajo.map((linea, idx) => {
        const lineaId = extraerIdLineaTrabajo(linea);
        // Si no hay id válido, usa nombre+idx como key única
        const key = lineaId || (linea.nombre ? `nombre-${linea.nombre}-${idx}` : `idx-${idx}`);
        return (
            <TableRow key={key}>
                <TableCell>{linea.nombre}</TableCell>
                <TableCell>{linea.descripcion}</TableCell>
                <TableCell>
                    <IconButton 
                        color="primary" 
                        onClick={() => handleEditar(linea)}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton 
                        color="error" 
                        onClick={() => confirmarEliminacion(linea)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
        );
    })}
</TableBody>
        </Table>
    </TableContainer>

            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    ¿Está seguro que desea eliminar la línea de trabajo {lineaSeleccionada?.nombre}?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleEliminar} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ListadoLineasTrabajo;
