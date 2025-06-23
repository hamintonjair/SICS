// Script de prueba para verificar la conexión con el backend
import axios from 'axios';
import { API_URL } from './config';

const testBackendConnection = async () => {
    try {
    
        try {
            const authResponse = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@example.com', // Reemplaza con credenciales válidas
                password: 'password123'     // Reemplaza con la contraseña correcta
            });
         
            const token = authResponse.data.token;
            const protectedResponse = await axios.get(`${API_URL}/actividades`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
        } catch (authError) {
            console.error('Error en autenticación o ruta protegida:', authError.response?.data || authError.message);
        }
        
    } catch (error) {
        console.error('Error general de conexión:', error.message);
        if (error.response) {
            console.error('Detalles del error:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        }
    }
};

// Ejecutar la prueba
testBackendConnection();
