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
    IconButton,
    Box,
    Chip,
    CircularProgress
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import funcionarioService from '../../services/funcionarioService';

const ListadoFuncionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const cargarFuncionarios = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await funcionarioService.obtenerFuncionarios();
            setFuncionarios(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar funcionarios:', {
                mensaje: err.mensaje || 'Error desconocido',
                detalles: err.detalles || {}
            });
            setError('Error al cargar los funcionarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarFuncionarios();
    }, []);

    const handleEditar = (id) => {
        navigate(`/admin/funcionarios/editar/${id}`);
    };

    const handleNuevoFuncionario = () => {
        navigate('/admin/funcionarios/registro');
    };

    const handleEliminar = async (id) => {
        try {
            await funcionarioService.eliminarFuncionario(id);
            // Recargar la lista de funcionarios
            cargarFuncionarios();
        } catch (error) {
            console.error('Error al eliminar funcionario:', error);
        }
    };

    return (
        <div>
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Box sx={{ p: 2, color: 'error.main' }}>
                    {error}
                </Box>
            )}
            
            {!loading && !error && funcionarios.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    No hay funcionarios registrados
                </Box>
            )}
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
                    color="success" 
                    startIcon={<AddIcon />}
                    onClick={handleNuevoFuncionario}
                >
                    Nuevo Funcionario
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Secretaría</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Línea de Trabajo</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Rol</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {funcionarios.map((funcionario) => {
                            const uniqueKey = funcionario._id || funcionario.id || Math.random().toString(36).substr(2, 9);
                            return (
                            <TableRow key={uniqueKey}>
                                <TableCell>{funcionario.secretaría}</TableCell>
                                <TableCell>{funcionario.nombre}</TableCell>
                                <TableCell>{funcionario.email}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={
                                            funcionario.nombreLineaTrabajo || 
                                            funcionario.lineaTrabajo?.nombre || 
                                            'Sin línea'
                                        }
                                        color="primary" 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>{funcionario.rol}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={funcionario.estado} 
                                        color={funcionario.estado === 'Activo' ? 'success' : 'error'}
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => handleEditar(funcionario._id || funcionario.id)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    {funcionario.rol !== 'admin' && (
                                        <IconButton 
                                            color="error" 
                                            onClick={() => handleEliminar(funcionario._id || funcionario.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ListadoFuncionarios;
