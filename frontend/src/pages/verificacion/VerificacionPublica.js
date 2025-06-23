import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Box, 
    Alert, 
    Card, 
    CardContent,
    CircularProgress,
    Grid,
    Divider
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const VerificacionPublica = () => {
    const { documento: urlDocumento } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [documento, setDocumento] = useState(urlDocumento || '');
    const [codigoVerificacion, setCodigoVerificacion] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const codigoParam = searchParams.get('codigo');
        
        if (codigoParam) {
            setCodigoVerificacion(codigoParam);
            // Usar setTimeout para asegurar que el estado se actualice antes de llamar a handleVerificar
            const timer = setTimeout(() => {
                handleVerificar();
            }, 0);
            
            return () => clearTimeout(timer);
        }
    }, [location.search]);

    const handleVerificar = async (e) => {
        if (e) e.preventDefault();
        
        try {
            setError(null);
            setResultado(null);
            setCargando(true);

            // Si no hay código de verificación, mostrar error
            if (!codigoVerificacion) {
                throw new Error('Por favor ingrese el código de verificación');
            }

            // Validar que se proporcione documento
            if (!documento) {
                throw new Error('Por favor ingrese el número de documento');
            }

            // Construir la URL de verificación
            const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/beneficiario/verificar`;
            const params = new URLSearchParams();
            
            // Agregar parámetros requeridos
            params.append('documento', documento);
            params.append('codigo_verificacion', codigoVerificacion);

            // Construir la URL completa con parámetros
            const urlWithParams = `${apiUrl}?${params.toString()}`;

            console.log('Realizando petición a:', urlWithParams);

            // Realizar la petición
            console.log('Enviando petición a:', urlWithParams);
            const response = await axios.get(urlWithParams, {
                validateStatus: (status) => status < 500 // Aceptar códigos de estado < 500
            });

            console.log('Respuesta del servidor:', {
                status: response.status,
                data: response.data,
                headers: response.headers
            });

            // Verificar que la respuesta tenga los datos esperados
            if (response.status === 404) {
                throw new Error('Beneficiario no encontrado');
            }

            if (response.status === 400) {
                throw new Error(response.data?.msg || 'Código de verificación inválido');
            }

            if (response.status >= 400) {
                throw new Error(response.data?.msg || `Error en la verificación (${response.status})`);
            }

            if (!response.data) {
                throw new Error('No se recibieron datos del servidor');
            }

            setResultado(response.data);
            
            // Si la URL no tiene documento, actualizar la URL para incluir el documento
            if (!urlDocumento && response.data.beneficiario.documento) {
                navigate(`/verificar/beneficiario/${response.data.beneficiario.documento}?codigo=${codigoVerificacion}`, { replace: true });
            }
        } catch (err) {
            console.error('Error en verificación:', err);
            setError(err.response?.data?.msg || err.message || 'Error al verificar el registro');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Card>
                <CardContent>
                    <Box textAlign="center" mb={3}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Verificación de Registro
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            Ingrese el código de verificación para validar el registro del beneficiario
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {resultado ? (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Verificación Exitosa
                            </Alert>
                            <Box sx={{ 
                                p: 3, 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: 1,
                                borderLeft: '4px solid #28a745'
                            }}>
                                <Typography variant="h6" gutterBottom sx={{ 
                                    color: '#28a745',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <CheckCircleOutlineIcon />
                                    Datos del Beneficiario
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1">
                                            <Box component="span" sx={{ fontWeight: 'bold' }}>Nombre Completo:</Box>{' '}
                                            {resultado.beneficiario?.nombre_completo || 'No disponible'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1">
                                            <Box component="span" sx={{ fontWeight: 'bold' }}>Documento:</Box>{' '}
                                            {resultado.beneficiario?.numero_documento || 'No disponible'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1">
                                            <Box component="span" sx={{ fontWeight: 'bold' }}>Fecha de Registro:</Box>{' '}
                                            {resultado.beneficiario?.fecha_registro ? 
                                                new Date(resultado.beneficiario.fecha_registro).toLocaleString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'No disponible'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                        {resultado.msg || 'Registro verificado correctamente'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleVerificar}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Documento de Identidad"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value)}
                                disabled={!!urlDocumento}
                                required
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Código de Verificación"
                                value={codigoVerificacion}
                                onChange={(e) => setCodigoVerificacion(e.target.value)}
                                required
                            />
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={cargando}
                                    startIcon={cargando ? <CircularProgress size={24} /> : null}
                                >
                                    {cargando ? 'Verificando...' : 'Verificar Registro'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default VerificacionPublica;
