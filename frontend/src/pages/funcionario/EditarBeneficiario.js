import React, { useState, useEffect } from 'react';
import { 
    Typography, 
    TextField, 
    Button, 
    Grid, 
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import beneficiarioService from '../../services/beneficiarioService';
import usuarioService from '../../services/usuarioService';
import { useAuth } from '../../context/AuthContext';

const EditarBeneficiario = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [beneficiario, setBeneficiario] = useState({
        nombre_completo: '',
        tipo_documento: '',
        numero_documento: '',
        genero: '',
        fecha_nacimiento: '',
        numero_celular: '',
        correo_electronico: '',
        
        // Datos socioculturales
        etnia: '',
        comuna: '',
        barrio: '',
        
        // Discapacidad
        tiene_discapacidad: '',
        tipo_discapacidad: '',
        
        // Conflicto armado
        victima_conflicto: '',
        
        // Familia
        hijos_a_cargo: '',
        
        // Datos educativos y laborales
        estudia_actualmente: '',
        nivel_educativo: '',
        situacion_laboral: '',
        tipo_vivienda: '',
        
        // Ayuda Humanitaria
        ayuda_humanitaria: '',
        descripcion_ayuda_humanitaria: '',
        
        // Línea de trabajo
        linea_trabajo: user?.linea_trabajo || '',
        
        // Habilidades básicas
        sabe_leer: '',
        sabe_escribir: ''
    });
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Cargar datos del beneficiario
                const beneficiarioDetalle = await beneficiarioService.obtenerDetalleBeneficiario(id);
                
                // Cargar líneas de trabajo
                const lineasTrabajoResponse = await usuarioService.obtenerLineasTrabajo();
                setLineasTrabajo(lineasTrabajoResponse);

                // Mapear datos del beneficiario al estado
                setBeneficiario({
                    nombre_completo: beneficiarioDetalle.nombre_completo,
                    tipo_documento: beneficiarioDetalle.tipo_documento,
                    numero_documento: beneficiarioDetalle.numero_documento,
                    genero: beneficiarioDetalle.genero,
                    fecha_nacimiento: beneficiarioDetalle.fecha_nacimiento,
                    numero_celular: beneficiarioDetalle.numero_celular,
                    correo_electronico: beneficiarioDetalle.correo_electronico,
                    
                    // Datos socioculturales
                    etnia: beneficiarioDetalle.etnia,
                    comuna: beneficiarioDetalle.comuna,
                    barrio: beneficiarioDetalle.barrio,
                    
                    // Discapacidad
                    tiene_discapacidad: beneficiarioDetalle.tiene_discapacidad,
                    tipo_discapacidad: beneficiarioDetalle.tipo_discapacidad,
                    
                    // Conflicto armado
                    victima_conflicto: beneficiarioDetalle.victima_conflicto,
                    
                    // Familia
                    hijos_a_cargo: beneficiarioDetalle.hijos_a_cargo,
                    
                    // Datos educativos y laborales
                    estudia_actualmente: beneficiarioDetalle.estudia_actualmente,
                    nivel_educativo: beneficiarioDetalle.nivel_educativo,
                    situacion_laboral: beneficiarioDetalle.situacion_laboral,
                    tipo_vivienda: beneficiarioDetalle.tipo_vivienda,
                    
                    // Ayuda Humanitaria
                    ayuda_humanitaria: beneficiarioDetalle.ayuda_humanitaria,
                    descripcion_ayuda_humanitaria: beneficiarioDetalle.descripcion_ayuda_humanitaria,
                    
                    // Línea de trabajo
                    linea_trabajo: beneficiarioDetalle.linea_trabajo || user?.linea_trabajo,
                    
                    // Habilidades básicas
                    sabe_leer: beneficiarioDetalle.sabe_leer,
                    sabe_escribir: beneficiarioDetalle.sabe_escribir
                });

                setLoading(false);
            } catch (error) {
                console.error('Error al cargar datos del beneficiario:', error);
                setError('No se pudieron cargar los datos del beneficiario');
                setLoading(false);
            }
        };

        cargarDatos();
    }, [id, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBeneficiario(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Preparar datos para actualización
            const datosParaActualizar = {
                // Datos personales
                nombre_completo: beneficiario.nombre_completo,
                tipo_documento: beneficiario.tipo_documento,
                numero_documento: beneficiario.numero_documento,
                genero: beneficiario.genero,
                fecha_nacimiento: beneficiario.fecha_nacimiento,

                // Contacto
                numero_celular: beneficiario.numero_celular,
                correo_electronico: beneficiario.correo_electronico,

                // Datos socioculturales
                etnia: beneficiario.etnia,
                comuna: beneficiario.comuna,
                barrio: beneficiario.barrio,

                // Discapacidad
                tiene_discapacidad: beneficiario.tiene_discapacidad,
                tipo_discapacidad: beneficiario.tipo_discapacidad,

                // Conflicto armado
                victima_conflicto: beneficiario.victima_conflicto,

                // Familia
                hijos_a_cargo: parseInt(beneficiario.hijos_a_cargo, 10) || 0,

                // Datos educativos y laborales
                estudia_actualmente: beneficiario.estudia_actualmente,
                nivel_educativo: beneficiario.nivel_educativo,
                situacion_laboral: beneficiario.situacion_laboral,
                tipo_vivienda: beneficiario.tipo_vivienda,

                // Ayuda Humanitaria
                ayuda_humanitaria: beneficiario.ayuda_humanitaria,
                descripcion_ayuda_humanitaria: beneficiario.descripcion_ayuda_humanitaria,

                // Línea de trabajo
                linea_trabajo: beneficiario.linea_trabajo,

                // Habilidades básicas
                sabe_leer: beneficiario.sabe_leer,
                sabe_escribir: beneficiario.sabe_escribir,

                // Datos del funcionario
                funcionario_id: user.id,
                funcionario_nombre: user.nombre
            };

            console.log('Datos para actualizar:', datosParaActualizar);

            // Llamar al servicio de actualización
            const respuesta = await beneficiarioService.actualizarBeneficiario(id, datosParaActualizar);
            
            // Mostrar mensaje de éxito
            setSuccess('Beneficiario actualizado exitosamente');
            
            // Navegar de vuelta a la lista de beneficiarios
            navigate('/funcionario/beneficiarios', {
                state: { 
                    beneficiarioActualizado: respuesta 
                }
            });
        } catch (error) {
            console.error('Error al actualizar beneficiario:', error);
            
            // Mostrar mensaje de error
            setError(
                error.response?.data?.msg || 
                'No se pudo actualizar el beneficiario. Intente nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = () => {
        navigate('/funcionario/beneficiarios');
    };

    if (loading) {
        return <Typography>Cargando...</Typography>;
    }

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
                            name="nombre_completo"
                            value={beneficiario.nombre_completo}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tipo de Documento"
                            name="tipo_documento"
                            value={beneficiario.tipo_documento}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número de Documento"
                            name="numero_documento"
                            value={beneficiario.numero_documento}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Género"
                            name="genero"
                            value={beneficiario.genero}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Fecha de Nacimiento"
                            name="fecha_nacimiento"
                            type="date"
                            value={beneficiario.fecha_nacimiento}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número de Celular"
                            name="numero_celular"
                            type="tel"
                            value={beneficiario.numero_celular}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Correo Electrónico"
                            name="correo_electronico"
                            type="email"
                            value={beneficiario.correo_electronico}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Etnia"
                            name="etnia"
                            value={beneficiario.etnia}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Comuna"
                            name="comuna"
                            value={beneficiario.comuna}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Barrio"
                            name="barrio"
                            value={beneficiario.barrio}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tiene Discapacidad"
                            name="tiene_discapacidad"
                            value={beneficiario.tiene_discapacidad}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tipo de Discapacidad"
                            name="tipo_discapacidad"
                            value={beneficiario.tipo_discapacidad}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Victima de Conflicto"
                            name="victima_conflicto"
                            value={beneficiario.victima_conflicto}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Hijos a Cargo"
                            name="hijos_a_cargo"
                            value={beneficiario.hijos_a_cargo}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Estudia Actualmente"
                            name="estudia_actualmente"
                            value={beneficiario.estudia_actualmente}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nivel Educativo"
                            name="nivel_educativo"
                            value={beneficiario.nivel_educativo}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Situación Laboral"
                            name="situacion_laboral"
                            value={beneficiario.situacion_laboral}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tipo de Vivienda"
                            name="tipo_vivienda"
                            value={beneficiario.tipo_vivienda}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Ayuda Humanitaria"
                            name="ayuda_humanitaria"
                            value={beneficiario.ayuda_humanitaria}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Descripción de Ayuda Humanitaria"
                            name="descripcion_ayuda_humanitaria"
                            value={beneficiario.descripcion_ayuda_humanitaria}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Línea de Trabajo</InputLabel>
                            <Select
                                name="linea_trabajo"
                                value={beneficiario.linea_trabajo}
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
                            label="Sabe Leer"
                            name="sabe_leer"
                            value={beneficiario.sabe_leer}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Sabe Escribir"
                            name="sabe_escribir"
                            value={beneficiario.sabe_escribir}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
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
