import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor de solicitudes
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
       
        return config;
    },
    (error) => {
       
        return Promise.reject(error);
    }
);

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
       
        
        // Manejar específicamente errores de red
        if (error.message === 'Network Error') {
            throw new Error('No se puede conectar con el servidor. Verifique su configuración de red y que el backend esté corriendo.');
        }
        
        return Promise.reject(error);
    }
);

const estadisticasService = {
    obtenerEstadisticasPorLinea: async (lineaTrabajoId) => {
        return await estadisticasService.obtenerEstadisticasBeneficiarios(lineaTrabajoId);
    },
    obtenerEstadisticasBeneficiarios: async (lineaTrabajoId) => {
        try {
 
            // Usar URL completa con el prefijo correcto de beneficiarios
            const urlCompleta = `${axiosInstance.defaults.baseURL}/api/beneficiario/estadisticas/${lineaTrabajoId}`;
         
            
            const response = await axiosInstance.get(urlCompleta);
            
           

            // Validar estructura de respuesta
            if (!response.data || !response.data.estadisticas) {
                throw new Error('Respuesta de estadísticas inválida');
            }

            return response.data.estadisticas;
        } catch (error) {
          
            
            throw error;
        }
    },
    obtenerEstadisticasGlobalesAdmin: async () => {
        try {
            const response = await axiosInstance.get('/api/beneficiario/estadisticas');
            if (!response.data || !response.data.estadisticas) {
                throw new Error('Respuesta inválida del servidor');
            }
            return response.data.estadisticas;
        } catch (error) {
          
            throw error;
        }
    },
    obtenerEstadisticasMensuales: async () => {
        try {
            const response = await axiosInstance.get('/beneficiarios/estadisticas/por-mes');
            // La respuesta es un array de objetos { mes: 'YYYY-MM', cantidad: N }
            if (!Array.isArray(response.data)) {
                throw new Error('Respuesta inválida del servidor para estadísticas mensuales');
            }
            return response.data;
        } catch (error) {
           
            throw error;
        }
    }
};

export default estadisticasService;