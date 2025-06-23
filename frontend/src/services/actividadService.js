import axios from 'axios';
import { API_URL } from '../config';
import { getToken } from '../utils/auth';

// Crear una instancia de axios con configuración base
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir token de autorización
axiosInstance.interceptors.request.use(
    config => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Interceptor de respuestas para manejar errores 401
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token inválido o expirado
            console.error('Error 401 - No autorizado. Redirigiendo a login...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const ACTIVIDADES_API = `${API_URL}/actividades`;

/**
 * Obtiene todas las actividades
 * @returns {Promise<Array>} Lista de actividades
 */
export const getActividades = async (filtros = {}) => {
    try {
        const response = await axiosInstance.get(ACTIVIDADES_API, { 
            params: filtros
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        throw new Error('No se pudieron cargar las actividades');
    }
};

/**
 * Obtiene una actividad por su ID
 * @param {string} id - ID de la actividad
 * @returns {Promise<Object>} Datos de la actividad
 */
export const getActividadById = async (id) => {
    try {
        const response = await axiosInstance.get(`${ACTIVIDADES_API}/${id}`);
        return response.data.data || response.data; // Asegurarse de devolver los datos correctamente
    } catch (error) {
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        throw new Error(error.response?.data?.message || 'No se pudo cargar la actividad');
    }
};

/**
 * Crea una nueva actividad
 * @param {Object} actividadData - Datos de la actividad
 * @returns {Promise<Object>} Actividad creada
 */
export const createActividad = async (actividadData) => {
    try {
        // Usar un ID de usuario fijo temporalmente
        const userId = JSON.parse(localStorage.getItem('user') || '{}');

        // Asegurarse de que los campos requeridos estén presentes
        if (!actividadData.tema || !actividadData.objetivo || !actividadData.lugar || 
            !actividadData.dependencia || !actividadData.fecha || 
            !actividadData.hora_inicio || !actividadData.hora_fin || 
            !actividadData.linea_trabajo_id) {
            throw new Error('Todos los campos obligatorios son requeridos');
        }
        
        // Formatear la fecha si es necesario
        let fecha = actividadData.fecha;
        if (fecha instanceof Date) {
            fecha = fecha.toISOString().split('T')[0];
        }
        
        // Crear el objeto de datos a enviar
        const ahora = new Date().toISOString();
        const datosEnviar = {
            tema: actividadData.tema,
            objetivo: actividadData.objetivo,
            lugar: actividadData.lugar,
            dependencia: actividadData.dependencia,
            fecha: fecha,
            hora_inicio: actividadData.hora_inicio,
            hora_fin: actividadData.hora_fin,
            linea_trabajo_id: actividadData.linea_trabajo_id,
            funcionario_id: userId,
            creado_por: userId,
            fecha_creacion: ahora,
            fecha_actualizacion: ahora,
            asistentes: actividadData.asistentes || [],
            tipo: actividadData.tipo || 'actividad', // Incluir el tipo, con 'actividad' como valor por defecto
            es_reunion: actividadData.es_reunion || false // Incluir es_reunion si está presente
        };
        
     
        const response = await axiosInstance.post(ACTIVIDADES_API, datosEnviar, {
            validateStatus: function (status) {
                return status < 500; // Resolver solo si el código de estado es menor que 500
            }
        });

        if (response.status >= 400) {
            // Si hay un error de validación, mostrar detalles
            let errorMessage = 'Error al crear la actividad';
            if (response.data && response.data.message) {
                errorMessage = response.data.message;
                if (response.data.errors) {
                    errorMessage += ': ' + Object.values(response.data.errors).join(', ');
                }
            } else if (response.data && response.data.error) {
                errorMessage = response.data.error;
            }
            
            console.error('Error en la respuesta del servidor:', {
                status: response.status,
                data: response.data,
                detalles: errorMessage
            });
            
            throw new Error(errorMessage);
        }

        return response.data;
    } catch (error) {
        console.error('Error en createActividad:', {
            message: error.message,
            response: error.response?.data,
            request: error.request,
            config: error.config
        });
        
        if (error.response && error.response.status === 401) {
            // Manejar error de autenticación
            const authError = new Error(`Error de autenticación: ${error.response.data?.message || 'Token inválido o expirado'}`);
            authError.code = 'AUTH_ERROR';
            throw authError;
        }
        
        // Si el error ya tiene un mensaje, lanzarlo directamente
        if (error.message && error.message !== 'Request failed with status code 401') {
            throw error;
        }
        
        // Si no, lanzar un error genérico
        throw new Error('Error al crear la actividad. Por favor, inténtalo de nuevo.');
    }
};

/**
 * Actualiza una actividad existente
 * @param {string} id - ID de la actividad
 * @param {Object} actividadData - Datos actualizados de la actividad
 * @returns {Promise<Object>} Actividad actualizada
 */
// ID de usuario fijo temporalmente
const USER_ID = '67fe7265e59ba1b14f0a19bd';

export const updateActividad = async (id, actividadData) => {
    try {
        // Validar campos requeridos
        const camposRequeridos = ['tema', 'objetivo', 'lugar', 'dependencia', 'fecha', 'hora_inicio', 'hora_fin'];
        const faltantes = camposRequeridos.filter(campo => !actividadData[campo]);
        
        if (faltantes.length > 0) {
            throw new Error(`Faltan campos requeridos: ${faltantes.join(', ')}`);
        }
        
        const response = await axiosInstance.put(`${ACTIVIDADES_API}/${id}`, actividadData);
        
        return response.data;
    } catch (error) {
        
        if (error.response) {
            // El servidor respondió con un estado fuera del rango 2xx
            console.error('Detalles del error:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
            
            // Proporcionar un mensaje más descriptivo basado en la respuesta del servidor
            const errorMessage = error.response.data?.message || 'Error en el servidor';
            const serverError = new Error(`Error al actualizar la actividad: ${errorMessage}`);
            serverError.status = error.response.status;
            throw serverError;
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            console.error('No se recibió respuesta del servidor:', error.request);
            throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.');
        } else {
            // Algo pasó en la configuración de la solicitud
            console.error('Error al configurar la solicitud:', error.message);
            throw new Error(`Error al procesar la solicitud: ${error.message}`);
        }
    }
};

/**
 * Elimina una actividad
 * @param {string} id - ID de la actividad a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteActividad = async (id) => {
    try {
        const response = await axiosInstance.delete(`${ACTIVIDADES_API}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar la actividad:', error);
        
        if (error.response && error.response.status === 401) {
            const authError = new Error(`Error de autenticación: ${error.response.data?.message || 'Token inválido o expirado'}`);
            authError.code = 'AUTH_ERROR';
            throw authError;
        }
        
        throw new Error(error.response?.data?.message || 'No se pudo eliminar la actividad');
    }
};

/**
 * Registra la asistencia a una actividad
 * @param {string} actividadId - ID de la actividad
 * @param {Array} asistentes - Lista de asistentes
 * @returns {Promise<Object>} Resultado del registro
 */
export const registrarAsistencia = async (actividadId, asistentes) => {
    try {

        // Validar que la lista de asistentes sea un array
        if (!Array.isArray(asistentes)) {
            throw new Error('La lista de asistentes debe ser un arreglo');
        }
        
        // Validar que cada asistente tenga los campos requeridos
        const asistentesValidos = asistentes.every(asistente => 
            asistente.beneficiario_id && 
            typeof asistente.asistio !== 'undefined'
        );
        
        if (!asistentesValidos) {
            throw new Error('Cada asistente debe tener un beneficiario_id y el estado de asistencia');
        }
        
        // Preparar datos para enviar
        const datosEnviar = {
            asistentes,
            registrado_por: USER_ID, // Usar el ID de usuario fijo
            fecha_registro: new Date().toISOString()
        };
        
        const response = await axiosInstance.post(
            `${ACTIVIDADES_API}/${actividadId}/asistencia`, 
            datosEnviar,
            {
                validateStatus: function (status) {
                    return status < 500; // Resolver solo si el código de estado es menor que 500
                }
            }
        );

        if (response.status >= 400) {
            // Si hay un error de validación, mostrar detalles
            let errorMessage = 'Error al registrar la asistencia';
            if (response.data && response.data.message) {
                errorMessage = response.data.message;
                if (response.data.errors) {
                    errorMessage += ': ' + Object.values(response.data.errors).join(', ');
                }
            } else if (response.data && response.data.error) {
                errorMessage = response.data.error;
            }
            
            console.error('Error en la respuesta del servidor:', {
                status: response.status,
                data: response.data,
                detalles: errorMessage
            });
            
            throw new Error(errorMessage);
        }
        
        return response.data;
    } catch (error) {
        console.error('Error en registrarAsistencia:', {
            message: error.message,
            response: error.response?.data,
            request: error.request,
            config: error.config
        });
        
        if (error.response && error.response.status === 401) {
            const authError = new Error(`Error de autenticación: ${error.response.data?.message || 'Token inválido o expirado'}`);
            authError.code = 'AUTH_ERROR';
            throw authError;
        }
        
        // Si el error ya tiene un mensaje, lanzarlo directamente
        if (error.message && error.message !== 'Request failed with status code 401') {
            throw error;
        }
        
        // Si no, lanzar un error genérico
        throw new Error('Error al registrar la asistencia. Por favor, inténtalo de nuevo.');
    }
};
