import React, { useState, useEffect } from 'react';
import { 
    Typography, 
    TextField, 
    Button, 
    Grid, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Box,
    Alert
} from '@mui/material';
import beneficiarioService from '../../services/beneficiarioService';
import usuarioService from '../../services/usuarioService';

const RegistroBeneficiarios = () => {
    const [beneficiario, setBeneficiario] = useState({
        nombre: '',
        identificacion: '',
        lineaTrabajo: '',
        fechaNacimiento: '',
        genero: '',
        direccion: '',
        telefono: ''
    });
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const cargarLineasTrabajo = async () => {
            try {
                const data = await usuarioService.obtenerLineasTrabajo();
                setLineasTrabajo(data);
            } catch (error) {
                console.error('Error al cargar líneas de trabajo:', error);
            }
        };

        cargarLineasTrabajo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBeneficiario(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            await beneficiarioService.crearBeneficiario(beneficiario);
            setSuccess('Habitante registrado exitosamente');
            // Limpiar formulario
            setBeneficiario({
                nombre: '',
                identificacion: '',
                lineaTrabajo: '',
                fechaNacimiento: '',
                genero: '',
                direccion: '',
                telefono: ''
            });
        } catch (error) {
            setError(error.response?.data?.mensaje || 'Error al registrar habitante');
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Registro de Habitantes
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
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
                            value={beneficiario.nombre}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Identificación"
                            name="identificacion"
                            value={beneficiario.identificacion}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Línea de Trabajo</InputLabel>
                            <Select
                                name="lineaTrabajo"
                                value={beneficiario.lineaTrabajo}
                                label="Línea de Trabajo"
                                onChange={handleChange}
                                required
                            >
                                {lineasTrabajo.map((linea) => (
                                    <MenuItem key={linea._id} value={linea._id}>
                                        {linea.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Fecha de Nacimiento"
                            name="fechaNacimiento"
                            type="date"
                            value={beneficiario.fechaNacimiento}
                            onChange={handleChange}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Género</InputLabel>
                            <Select
                                name="genero"
                                value={beneficiario.genero}
                                label="Género"
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="masculino">Masculino</MenuItem>
                                <MenuItem value="femenino">Femenino</MenuItem>
                                <MenuItem value="otro">Otro</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Dirección"
                            name="direccion"
                            value={beneficiario.direccion}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            name="telefono"
                            type="tel"
                            value={beneficiario.telefono}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="success"
                        >
                            Registrar Beneficiario
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default RegistroBeneficiarios;
