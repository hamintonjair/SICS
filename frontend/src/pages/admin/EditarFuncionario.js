import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Grid, 
    Paper, 
    Typography,
    Alert,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import usuarioService from '../../services/usuarioService';
import funcionarioService from '../../services/funcionarioService';

const EditarFuncionario = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado inicial con todos los campos posibles
    const [funcionario, setFuncionario] = useState({
        nombre: '',
        email: '',
        telefono: '',
        secretaría: 'Administración General',
        linea_trabajo: '',
        nombreLineaTrabajo: '',
        rol: 'funcionario',
        estado: 'Activo',
        cambiarPassword: false,
        password: ''
    });

    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const secretarias = [
        'Administración General',
        'Secretaría de Hacienda',
        'Secretaría General',
        'Secretaría de Gobierno',
        'Secretaría de Educación',
        'Secretaría de Salud',
        'Secretaría de Inclusión y Cohesión Social',
        'Secretaría de Mujer, Género y Diversidad Sexual',
        'Secretaría de Cultura, Patrimonio y Turismo Étnico Local',
        'Secretaría de Desarrollo Económico y Agroindustrial',
        'Secretaría de Planeación',
        'Secretaría de Movilidad',
        'Secretaría de Infraestructura',
        'Secretaría de Medio Ambiente y Biodiversidad',
        'Secretaría de Turismo, Economía Naranja y Competitividad'
    ];

    useEffect(() => {
        const cargarDatosFuncionario = async () => {
            try {
                // Cargar líneas de trabajo
                const lineas = await usuarioService.obtenerLineasTrabajo();
                setLineasTrabajo(lineas);

                // Cargar datos del funcionario
                const funcionarioData = await funcionarioService.obtenerFuncionarioPorId(id);
                
                console.log('Datos de funcionario cargados:', funcionarioData);

                // Actualizar estado con datos completos
                setFuncionario({
                    nombre: funcionarioData.nombre || '',
                    email: funcionarioData.email || '',
                    telefono: funcionarioData.telefono || '',
                    secretaría: funcionarioData.secretaría || 'Administración General',
                    linea_trabajo: funcionarioData.linea_trabajo || '',
                    nombreLineaTrabajo: funcionarioData.nombreLineaTrabajo || '',
                    rol: funcionarioData.rol || 'funcionario',
                    estado: funcionarioData.estado || 'Activo',
                    cambiarPassword: false,
                    password: ''
                });

                setLoading(false);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                
                // Mensaje de error más detallado
                const mensajeError = error.mensaje || 'Error al cargar datos del funcionario';
                toast.error(mensajeError);
                
                // Mostrar detalles adicionales si están disponibles
                if (error.detalles && Object.keys(error.detalles).length > 0) {
                    console.error('Detalles del error:', error.detalles);
                    toast.error(JSON.stringify(error.detalles));
                }
                
                setLoading(false);
            }
        };

        cargarDatosFuncionario();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFuncionario(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

  

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Limpiar estados anteriores
        setError(null);
        setSuccess(null);
        
        // Validación de campos
        if (!funcionario.nombre || !funcionario.email) {
            setError('Por favor, complete todos los campos obligatorios');
            return;
        }

        try {
            // Preparar datos para actualización
            const datosActualizacion = {
                nombre: funcionario.nombre,
                email: funcionario.email,
                telefono: funcionario.telefono,
                secretaría: funcionario.secretaría,
                linea_trabajo: funcionario.linea_trabajo,
                rol: funcionario.rol,
                estado: funcionario.estado
            };

            // Agregar contraseña si se seleccionó cambiar
            if (funcionario.cambiarPassword && funcionario.password) {
                datosActualizacion.password = funcionario.password;
            }

            // Llamar al servicio de actualización
            await funcionarioService.actualizarFuncionario(id, datosActualizacion);
            
            // Establecer mensaje de éxito
            setSuccess('Funcionario actualizado exitosamente');
            
            // Recargar la lista de funcionarios
            await funcionarioService.obtenerFuncionarios();
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                navigate('/admin/funcionarios');
            }, 1500);

        } catch (error) {
            // Manejar errores
            const errorMensaje = error.response?.data?.mensaje || 
                                 error.mensaje || 
                                 'Error al actualizar funcionario';
            setError(errorMensaje);
        }
    };

    const handleCancelar = () => {
        navigate('/admin/funcionarios');
    };

    if (loading) {
        return <Typography>Cargando...</Typography>;
    }

    return (
        <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
            <Typography variant="h5" gutterBottom>
                Editar Funcionario
            </Typography>
            {error && (
                <Alert severity="error" sx={{ marginBottom: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ marginBottom: 2 }}>
                    {success}
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nombre Completo"
                            name="nombre"
                            value={funcionario.nombre}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Correo Electrónico"
                            name="email"
                            type="email"
                            value={funcionario.email}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Teléfono (Opcional)"
                            name="telefono"
                            value={funcionario.telefono}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Secretaría</InputLabel>
                            <Select
                                name="secretaría"
                                value={funcionario.secretaría}
                                label="Secretaría"
                                onChange={handleChange}
                                required
                            >
                                {secretarias.map((secretaria) => (
                                    <MenuItem key={secretaria} value={secretaria}>
                                        {secretaria}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Línea de Trabajo</InputLabel>
                            <Select
                                name="linea_trabajo"
                                value={funcionario.linea_trabajo}
                                label="Línea de Trabajo"
                                onChange={handleChange}
                                required
                            >
                                {lineasTrabajo.map((linea) => (
                                    <MenuItem 
                                        key={linea._id || linea.id} 
                                        value={linea._id || linea.id}
                                    >
                                        {linea.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Rol</InputLabel>
                            <Select
                                name="rol"
                                value={funcionario.rol}
                                label="Rol"
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="funcionario">Funcionario</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                name="estado"
                                value={funcionario.estado}
                                label="Estado"
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="Activo">Activo</MenuItem>
                                <MenuItem value="Inactivo">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="cambiarPassword"
                                    checked={funcionario.cambiarPassword}
                                    onChange={handleChange}
                                />
                            }
                            label="Cambiar Contraseña"
                        />
                    </Grid>
                    {funcionario.cambiarPassword && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nueva Contraseña"
                                name="password"
                                type="password"
                                value={funcionario.password}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                    )}
                    <Grid item xs={12} container spacing={2}>
                        <Grid item xs={6}>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                color="primary" 
                                type="submit"
                            >
                                Actualizar Funcionario
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                color="secondary" 
                                onClick={handleCancelar}
                            >
                                Cancelar
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default EditarFuncionario;
