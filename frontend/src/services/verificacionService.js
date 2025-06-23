import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const verificacionService = {
    async verificarBeneficiario(documento, codigoVerificacion) {
        try {
            const response = await axios.get(`${API_URL}/beneficiarios/verificar`, {
                params: { 
                    documento, 
                    codigo_verificacion: codigoVerificacion 
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al verificar beneficiario:', error);
            throw error;
        }
    }
};
