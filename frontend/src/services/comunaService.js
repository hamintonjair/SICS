import axiosInstance from '../config/axiosConfig';

export const obtenerComunas = async (timeout = 10000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await axiosInstance.get('/comunas', {
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.data.data || []; 
    } catch (error) {
        // Log más detallado del error
        console.error('Error completo al obtener Comunas:', {
            mensaje: error.message,
            respuesta: error.response?.data,
            estado: error.response?.status,
            esTimeout: error.name === 'AbortError'
        });
        
        // Manejar específicamente errores de autorización
        if (error.response?.status === 401) {
            // Notificar al usuario que necesita iniciar sesión
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
            window.location.href = '/login';
        }
        
        // Devolver un array vacío en caso de error
        return [];
    }
};

const comunaService = {
    crearComuna: async (comunaData) => {
        try {
            const response = await axiosInstance.post('/comunas', comunaData);
            return response.data.data; // Acceder al campo 'data'
        } catch (error) {
            console.error('Error al crear Comuna:', error.response?.data || error.message);
            throw error;
        }
    },

    obtenerComunas,

    obtenerComunaPorId: async (comunaId) => {
        try {
            const response = await axiosInstance.get(`/comunas/${comunaId}`);
            return response.data.data; // Acceder al campo 'data'
        } catch (error) {
            console.error('Error al obtener Comuna por ID:', error.response?.data || error.message);
            throw error;
        }
    },

    actualizarComuna: async (comunaId, comunaData) => {
        try {
            const response = await axiosInstance.put(`/comunas/${comunaId}`, comunaData);
            return response.data.data; // Acceder al campo 'data'
        } catch (error) {
            console.error('Error al actualizar Comuna:', error.response?.data || error.message);
            throw error;
        }
    },

    eliminarComuna: async (comunaId) => {
        try {
            const response = await axiosInstance.delete(`/comunas/${comunaId}`);
            return response.data.data; // Acceder al campo 'data'
        } catch (error) {
            console.error('Error al eliminar Comuna:', error.response?.data || error.message);
            throw error;
        }
    }
};

export default comunaService;
