import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Grid, 
    Typography, 
    Container,
    FormHelperText,
    Alert
} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { obtenerLineasTrabajo } from '../../services/usuarioService';
import { crearFuncionario } from '../../services/funcionarioService';

export default function RegistroFuncionarios() {
    const navigate = useNavigate();
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [funcionario, setFuncionario] = useState({
        nombre: '',
        email: '',
        password: '',
        secretaría: 'Administración General', // Usar tilde
        linea_trabajo: null,
        rol: 'funcionario',
        estado: 'Activo',
        telefono: ''
    });
    const [errores, setErrores] = useState({});
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarLineasTrabajo = async () => {
            try {
                const lineas = await obtenerLineasTrabajo();
                
                if (lineas && lineas.length > 0) {
                    setLineasTrabajo(lineas);
                    setFuncionario(prev => ({
                        ...prev,
                        linea_trabajo: lineas[0].id
                    }));
                } else {
                    console.warn('No se encontraron líneas de trabajo');
                    setError('No hay líneas de trabajo disponibles');
                }
            } catch (error) {
                console.error('Error al cargar líneas de trabajo:', error);
                setError('No se pudieron cargar las líneas de trabajo');
                
                // Establecer un estado de error o mensaje
                setLineasTrabajo([]);
            }
        };

        cargarLineasTrabajo();
    }, []);

    useEffect(() => {
        let timeoutId;
        if (success || error) {
            timeoutId = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [success, error]);

    const handleChange = (e) => {
        const { name, value } = e.target;
      
        // Validar que el valor sea válido para línea de trabajo
        if (name === 'linea_trabajo') {
            const lineaValida = lineasTrabajo.some(linea => linea.id === value);
            if (!lineaValida) {
                console.warn('Línea de trabajo inválida:', value);
                return;
            }
        }

        setFuncionario(prev => {
            const nuevoEstado = {
                ...prev,
                [name]: value
            };
            
        
            
            return nuevoEstado;
        });
        
        // Limpiar error específico cuando se modifica el campo
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!funcionario.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        }

        if (!funcionario.email.trim()) {
            nuevosErrores.email = 'El correo electrónico es obligatorio';
        } else if (!/\S+@\S+\.\S+/.test(funcionario.email)) {
            nuevosErrores.email = 'Correo electrónico inválido';
        }

        if (!funcionario.password.trim()) {
            nuevosErrores.password = 'La contraseña es obligatoria';
        } else if (funcionario.password.length < 8) {
            nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        if (!funcionario.linea_trabajo) {
            nuevosErrores.linea_trabajo = 'Debe seleccionar una línea de trabajo';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Limpiar errores previos
        setErrores({});
        setError('');
        setSuccess('');
        
        // Validar formulario usando validarFormulario()
        if (!validarFormulario()) {
            return;
        }

        // Validaciones adicionales
        const erroresValidacion = {};

        // Validar línea de trabajo
        if (!lineasTrabajo.some(linea => linea.id === funcionario.linea_trabajo)) {
            erroresValidacion.linea_trabajo = 'Debe seleccionar una línea de trabajo válida';
            setError('Debe seleccionar una línea de trabajo válida');
        }

        // Si hay errores de validación, mostrarlos
        if (Object.keys(erroresValidacion).length > 0) {
            setErrores(prev => ({
                ...prev,
                ...erroresValidacion
            }));
            return;
        }

        try {
            const funcionarioData = {
                ...funcionario,
                linea_trabajo: funcionario.linea_trabajo
            };

            
            const response = await crearFuncionario(funcionarioData);
                        
            setSuccess('Funcionario registrado exitosamente');
            
            // Limpiar formulario
            setFuncionario({
                nombre: '',
                email: '',
                password: '',
                secretaría: 'Administración General',
                linea_trabajo: lineasTrabajo.length > 0 ? lineasTrabajo[0].id : null,
                rol: 'funcionario',
                estado: 'Activo',
                telefono: ''
            });
            
            // Resetear errores
            setErrores({});
            setError('');
            
            // Navegar a la lista de funcionarios
            navigate('/admin/funcionarios');
        } catch (error) {

            // Limpiar mensajes previos
            setErrores({});
            setSuccess('');
        
            // Obtener mensaje directamente del objeto error
            const errorMessage = error.mensaje || error.msg || error.error || 'Ocurrió un error al registrar el funcionario';
            const detallesError = error.detalles || {};
        
            // Manejar errores de validación por campos
            if (Object.keys(detallesError).length > 0) {
                const erroresServidor = {};
                Object.entries(detallesError).forEach(([campo, mensajes]) => {
                    erroresServidor[campo] = Array.isArray(mensajes) ? mensajes[0] : 'Error de validación';
                });
        
                setErrores(prev => ({
                    ...prev,
                    ...erroresServidor
                }));
        
                const primerError = Object.values(erroresServidor)[0];
                setError(primerError);
            } else {
                // Mensaje general
                setErrores({ general: errorMessage });
                setError(errorMessage);
            }
        }
       
    };

    return (
        <Container maxWidth="sm">
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}


            
            <Typography variant="h5" gutterBottom>
                Registro de Funcionarios
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Nombre Completo"
                            name="nombre"
                            value={funcionario.nombre}
                            onChange={handleChange}
                            error={!!errores.nombre}
                            helperText={errores.nombre}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Correo Electrónico"
                            name="email"
                            type="email"
                            value={funcionario.email}
                            onChange={handleChange}
                            error={!!errores.email}
                            helperText={errores.email}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={funcionario.password}
                            onChange={handleChange}
                            error={!!errores.password}
                            helperText={errores.password}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Teléfono (Opcional)"
                            name="telefono"
                            value={funcionario.telefono}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth error={!!errores.secretaría}>
                            <InputLabel>Secretaría</InputLabel>
                            <Select
                                name="secretaría"
                                value={funcionario.secretaría}
                                label="Secretaría"
                                onChange={handleChange}
                            >
                                <MenuItem value="Administración General">Administración General</MenuItem>
                                <MenuItem value="Secretaría de Hacienda">Secretaría de Hacienda</MenuItem>
                                <MenuItem value="Secretaría General">Secretaría General</MenuItem>
                                <MenuItem value="Secretaría de Gobierno">Secretaría de Gobierno</MenuItem>
                                <MenuItem value="Secretaría de Educación">Secretaría de Educación</MenuItem>
                                <MenuItem value="Secretaría de Salud">Secretaría de Salud</MenuItem>
                                <MenuItem value="Secretaría de Inclusión y Cohesión Social">Secretaría de Inclusión y Cohesión Social</MenuItem>
                                <MenuItem value="Secretaría de Mujer, Género y Diversidad Sexual">Secretaría de Mujer, Género y Diversidad Sexual</MenuItem>
                                <MenuItem value="Secretaría de Cultura, Patrimonio y Turismo Étnico Local">Secretaría de Cultura, Patrimonio y Turismo Étnico Local</MenuItem>
                                <MenuItem value="Secretaría de Desarrollo Económico y Agroindustrial">Secretaría de Desarrollo Económico y Agroindustrial</MenuItem>
                                <MenuItem value="Secretaría de Planeación">Secretaría de Planeación</MenuItem>
                                <MenuItem value="Secretaría de Movilidad">Secretaría de Movilidad</MenuItem>
                                <MenuItem value="Secretaría de Infraestructura">Secretaría de Infraestructura</MenuItem>
                                <MenuItem value="Secretaría de Medio Ambiente y Biodiversidad">Secretaría de Medio Ambiente y Biodiversidad</MenuItem>
                                <MenuItem value="Secretaría de Turismo, Economía Naranja y Competitividad">Secretaría de Turismo, Economía Naranja y Competitividad</MenuItem>

                            </Select>
                            {errores.secretaría && <FormHelperText>{errores.secretaría}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth error={!!errores.linea_trabajo}>
                            <InputLabel>Línea de Trabajo</InputLabel>
                            <Select
                                name="linea_trabajo"
                                value={funcionario.linea_trabajo || ''}
                                label="Línea de Trabajo"
                                onChange={handleChange}
                                renderValue={(selected) => {
                                    console.log('Valor seleccionado renderValue:', selected);
                                    console.log('Líneas de trabajo disponibles:', lineasTrabajo);
                                    
                                    const lineaSeleccionada = lineasTrabajo.find(linea => linea.id === selected);
                                    
                                    console.log('Línea seleccionada:', lineaSeleccionada);
                                    
                                    return lineaSeleccionada 
                                        ? lineaSeleccionada.nombre 
                                        : 'Seleccionar línea de trabajo';
                                }}
                            >
                                {lineasTrabajo.length === 0 ? (
                                    <MenuItem disabled>
                                        No hay líneas de trabajo disponibles
                                    </MenuItem>
                                ) : (
                                    lineasTrabajo.map(linea => {
                                        console.log('Generando MenuItem para:', linea);
                                        return (
                                            <MenuItem 
                                                key={linea.id} 
                                                value={linea.id}
                                            >
                                                {linea.nombre}
                                            </MenuItem>
                                        );
                                    })
                                )}
                            </Select>
                            {errores.linea_trabajo && <FormHelperText>{errores.linea_trabajo}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Rol</InputLabel>
                            <Select
                                name="rol"
                                value={funcionario.rol}
                                label="Rol"
                                onChange={handleChange}
                            >
                                <MenuItem value="funcionario">Funcionario</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                name="estado"
                                value={funcionario.estado}
                                label="Estado"
                                onChange={handleChange}
                            >
                                <MenuItem value="Activo">Activo</MenuItem>
                                <MenuItem value="Inactivo">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="success" 
                            fullWidth
                        >
                            Registrar Funcionario
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Container>
    );
}
