import React, { useState } from 'react';
import { verificacionService } from '../../services/verificacionService';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Box, 
    Alert 
} from '@mui/material';

const VerificacionBeneficiario = () => {
    const [documento, setDocumento] = useState('');
    const [codigoVerificacion, setCodigoVerificacion] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);

    const handleVerificar = async () => {
        try {
            setError(null);
            setResultado(null);

            const data = await verificacionService.verificarBeneficiario(
                documento, 
                codigoVerificacion
            );

            setResultado(data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error de verificación');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                marginTop: 8, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}>
                <Typography variant="h4" gutterBottom>
                    Verificación de Beneficiario
                </Typography>

                <TextField
                    label="Número de Documento"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                />

                <TextField
                    label="Código de Verificación"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={codigoVerificacion}
                    onChange={(e) => setCodigoVerificacion(e.target.value)}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleVerificar}
                    sx={{ marginTop: 2 }}
                >
                    Verificar
                </Button>

                {error && (
                    <Alert severity="error" sx={{ marginTop: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                {resultado && (
                    <Box sx={{ marginTop: 2, width: '100%' }}>
                        <Typography variant="h6">Datos del Beneficiario</Typography>
                        <Typography>Nombre: {resultado.nombre_completo}</Typography>
                        <Typography>Documento: {resultado.numero_documento}</Typography>
                        <Typography>Línea de Trabajo: {resultado.linea_trabajo}</Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default VerificacionBeneficiario;
