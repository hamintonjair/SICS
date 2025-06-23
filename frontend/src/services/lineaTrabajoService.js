import axiosInstance from '../config/axiosConfig';

export const obtenerNombreLineaTrabajo = async (nombreLineaTrabajo, timeout = 10000) => {
    try {
        // Codificar el nombre de la línea de trabajo para manejar espacios y caracteres especiales
        const lineaTrabajoEncoded = encodeURIComponent(nombreLineaTrabajo);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await axiosInstance.get(`/lineas-trabajo/${lineaTrabajoEncoded}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        // Devolver el ID de la línea de trabajo
        return response.data._id;
    } catch (error) {
        console.error('Error detallado al obtener línea de trabajo:', {
            mensaje: error.message,
            respuesta: error.response?.data,
            estado: error.response?.status,
            nombreLineaTrabajo: nombreLineaTrabajo,
            esTimeout: error.name === 'AbortError'
        });
        
        // Devolver un valor por defecto o manejar el error
        return nombreLineaTrabajo;
    }
};

// Función para obtener todas las líneas de trabajo
export const obtenerLineasTrabajo = async (timeout = 10000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await axiosInstance.get('/lineas-trabajo', {
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.data;
    } catch (error) {
        console.error('Error al obtener líneas de trabajo:', {
            mensaje: error.message,
            respuesta: error.response?.data,
            estado: error.response?.status,
            esTimeout: error.name === 'AbortError'
        });
        
        // Devolver un array vacío en caso de error
        return [];
    }
};

const lineaTrabajoService = {
    obtenerNombreLineaTrabajo,
    obtenerLineasTrabajo
};

export default lineaTrabajoService;
