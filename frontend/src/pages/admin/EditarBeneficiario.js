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
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import beneficiarioService from '../../services/beneficiarioService';
import usuarioService from '../../services/usuarioService';

const EditarBeneficiario = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [beneficiario, setBeneficiario] = useState({
        nombre: '',
        identificacion: '',
        lineaTrabajo: '',
        fechaNacimiento: '',
        genero: '',
        direccion: '',
        telefono: '',
        tiene_discapacidad: false,
        tipo_discapacidad: '',
        nombre_cuidadora: '',
        labora_cuidadora: false
    });
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [beneficiarioData, lineasTrabajoData] = await Promise.all([
                    beneficiarioService.obtenerBeneficiarioPorId(id),
                    usuarioService.obtenerLineasTrabajo()
                ]);

                // Formatear fecha de nacimiento
                const fechaFormateada = beneficiarioData.fechaNacimiento 
                    ? new Date(beneficiarioData.fechaNacimiento).toISOString().split('T')[0]
                    : '';

                setBeneficiario({
                    ...beneficiarioData,
                    fechaNacimiento: fechaFormateada,
                    lineaTrabajo: beneficiarioData.lineaTrabajo?._id || ''
                });
                setLineasTrabajo(lineasTrabajoData);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                setError('Error al cargar los datos del beneficiario');
            }
        };

        cargarDatos();
    }, [id]);

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
            await beneficiarioService.actualizarBeneficiario(id, beneficiario);
            setSuccess('Beneficiario actualizado exitosamente');
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                navigate('/admin/beneficiarios');
            }, 1500);
        } catch (error) {
            setError(error.response?.data?.mensaje || 'Error al actualizar beneficiario');
        }
    };

    const handleCancelar = () => {
        navigate('/admin/beneficiarios');
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Editar Beneficiario
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
                    {/* Discapacidad y cuidadora */}
                    {beneficiario.tiene_discapacidad && (
                        <>
                            <Grid item xs={12} sm={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Discapacidad</InputLabel>
                                    <Select
                                        name="tipo_discapacidad"
                                        value={beneficiario.tipo_discapacidad}
                                        label="Tipo de Discapacidad"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="">Seleccione...</MenuItem>
                                        <MenuItem value="Física">Física</MenuItem>
                                        <MenuItem value="Visual">Visual</MenuItem>
                                        <MenuItem value="Auditiva">Auditiva</MenuItem>
                                        <MenuItem value="Cognitiva">Cognitiva</MenuItem>
                                        <MenuItem value="Múltiple">Múltiple</MenuItem>
                                        <MenuItem value="Ninguna">Ninguna</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre de la Cuidadora"
                                    name="nombre_cuidadora"
                                    value={beneficiario.nombre_cuidadora}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={12} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name="labora_cuidadora"
                                            checked={!!beneficiario.labora_cuidadora}
                                            onChange={e => setBeneficiario(prev => ({
                                                ...prev,
                                                labora_cuidadora: e.target.checked
                                            }))}
                                        />
                                    }
                                    label="¿Labora la Cuidadora?"
                                />
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                            >
                                Actualizar Beneficiario
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="secondary"
                                onClick={handleCancelar}
                            >
                                Cancelar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default EditarBeneficiario;
