import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VerificacionRegistro = () => {
    const { codigo } = useParams();
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verificarRegistro = async () => {
            try {
                const response = await axios.get(`${API_URL}/verificacion/verificar/${codigo}`);
                setDatos(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Error al verificar el registro');
                setLoading(false);
            }
        };

        verificarRegistro();
    }, [codigo]);

    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
                    <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h5" color="error" gutterBottom>
                        Error de Verificación
                    </Typography>
                    <Typography color="text.secondary">
                        {error}
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Box textAlign="center" mb={3}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Registro Verificado
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>Beneficiario:</strong> {datos.beneficiario.nombre}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Documento:</strong> {datos.beneficiario.documento}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Fecha de Registro:</strong>{' '}
                        {new Date(datos.beneficiario.fecha_registro).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Registrado por:</strong> {datos.beneficiario.funcionario}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                    <Typography variant="body1" gutterBottom>
                        <strong>Tipo de Verificación:</strong>{' '}
                        {datos.beneficiario.verificacion.tipo === 'huella_digital' 
                            ? 'Huella Digital' 
                            : 'Firma Digital'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Estado:</strong>{' '}
                        <span style={{ color: datos.beneficiario.verificacion.estado === 'verificado' ? 'green' : 'orange' }}>
                            {datos.beneficiario.verificacion.estado === 'verificado' ? 'Verificado' : 'Pendiente'}
                        </span>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Fecha de Verificación:</strong>{' '}
                        {new Date(datos.beneficiario.verificacion.fecha).toLocaleDateString()}
                    </Typography>
                </Box>

                <Box mt={3} textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                        Código de Verificación: {codigo}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default VerificacionRegistro;
