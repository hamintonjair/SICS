import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    FormHelperText,
    Snackbar,
    Alert
} from '@mui/material';
import funcionarioService from '../../services/funcionarioService';
import lineaTrabajoService from '../../services/lineaTrabajoService';

const CrearFuncionario = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        lineaTrabajo: '',
        rol: 'funcionario',
        estado: 'Activo'
    });
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [errores, setErrores] = useState({});
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    // Cargar líneas de trabajo al montar el componente
    React.useEffect(() => {
        const cargarLineasTrabajo = async () => {
            try {
                const resultado = await lineaTrabajoService.obtenerLineasTrabajo();
                setLineasTrabajo(resultado);
            } catch (error) {
                console.error('Error al cargar líneas de trabajo:', error);
                setMensajeError('No se pudieron cargar las líneas de trabajo');
                setOpenSnackbar(true);
            }
        };
        cargarLineasTrabajo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Limpiar error específico al modificar el campo
        if (errores[name]) {
            setErrores(prevErrores => ({
                ...prevErrores,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await funcionarioService.crearFuncionario(formData);
            // Redirigir a la lista de funcionarios después de crear
            navigate('/admin/funcionarios');
        } catch (error) {
            // Manejar errores de validación
            if (error.camposError) {
                const errorMap = {};
                error.camposError.forEach(campoError => {
                    errorMap[campoError.campo] = campoError.mensajes;
                });
                setErrores(errorMap);
            }
            
            // Mostrar mensaje de error general
            setMensajeError(error.mensaje || 'Error al crear funcionario');
            setOpenSnackbar(true);
        }
    };

    const handleCancelar = () => {
        navigate('/admin/funcionarios');
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>
                Crear Funcionario
            </Typography>
            
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    error={!!errores.nombre}
                    helperText={errores.nombre?.[0]}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errores.email}
                    helperText={errores.email?.[0]}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errores.password}
                    helperText={errores.password?.[0]}
                />

                <FormControl 
                    fullWidth 
                    margin="normal" 
                    error={!!errores.lineaTrabajo}
                >
                    <InputLabel>Línea de Trabajo</InputLabel>
                    <Select
                        name="lineaTrabajo"
                        value={formData.lineaTrabajo}
                        label="Línea de Trabajo"
                        onChange={handleChange}
                    >
                        {lineasTrabajo.map(linea => (
                            <MenuItem key={linea._id} value={linea._id}>
                                {linea.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                    {errores.lineaTrabajo && (
                        <FormHelperText>{errores.lineaTrabajo[0]}</FormHelperText>
                    )}
                </FormControl>

                <FormControl 
                    fullWidth 
                    margin="normal"
                    error={!!errores.rol}
                >
                    <InputLabel>Rol</InputLabel>
                    <Select
                        name="rol"
                        value={formData.rol}
                        label="Rol"
                        onChange={handleChange}
                    >
                        <MenuItem value="funcionario">Funcionario</MenuItem>
                        <MenuItem value="admin">Administrador</MenuItem>
                        <MenuItem value="supervisor">Supervisor</MenuItem>
                    </Select>
                    {errores.rol && (
                        <FormHelperText>{errores.rol[0]}</FormHelperText>
                    )}
                </FormControl>

                <FormControl 
                    fullWidth 
                    margin="normal"
                    error={!!errores.estado}
                >
                    <InputLabel>Estado</InputLabel>
                    <Select
                        name="estado"
                        value={formData.estado}
                        label="Estado"
                        onChange={handleChange}
                    >
                        <MenuItem value="Activo">Activo</MenuItem>
                        <MenuItem value="Inactivo">Inactivo</MenuItem>
                    </Select>
                    {errores.estado && (
                        <FormHelperText>{errores.estado[0]}</FormHelperText>
                    )}
                </FormControl>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '20px' 
                }}>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                    >
                        Guardar
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary"
                        onClick={handleCancelar}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {mensajeError}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CrearFuncionario;
