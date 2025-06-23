import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Crear una instancia de axios con configuración base
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
        
        // Manejar errores específicos de respuesta
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    throw new Error(error.response.data.msg || 'Error de solicitud');
                case 401:
                    throw new Error(error.response.data.msg || 'No autorizado');
                case 404:
                    throw new Error(error.response.data.msg || 'Recurso no encontrado');
                case 500:
                    throw new Error(error.response.data.msg || 'Error interno del servidor');
                default:
                    throw new Error(error.response.data.msg || 'Error desconocido');
            }
        }
        
        return Promise.reject(error);
    }
);

export const crearFuncionario = async (funcionario) => {
    try {
        
        const response = await axiosInstance.post('/funcionarios/funcionarios', funcionario);
        
        // Manejar la nueva estructura de respuesta
        const funcionarioCreado = response.data.funcionario || response.data;
        
        // Asegurar que el funcionario tenga un ID
        const funcionarioConId = {
            ...funcionarioCreado,
            _id: funcionarioCreado._id || funcionarioCreado.id || response.data.funcionario_id,
            id: funcionarioCreado._id || funcionarioCreado.id || response.data.funcionario_id
        };
        
        return funcionarioConId;
    } catch (error) {  
        console.error('Error COMPLETO al crear funcionario:', {
            fullError: error,
            responseData: error.response?.data,
            responseStatus: error.response?.status,
            errorMessage: error.message
        });
       
    }
};

const funcionarioService = {
    crearFuncionario,
    /**
     * Obtener lista de funcionarios
     * @returns {Promise} Promesa con la lista de funcionarios
     */
    obtenerFuncionarios: async () => {
        try {
            console.log('Solicitando lista de funcionarios...');
            const response = await axiosInstance.get('/funcionarios/funcionarios');
            console.log('Respuesta de la API:', response);
            
            // Validar estructura de respuesta
            if (!response.data || !response.data.funcionarios) {
                console.warn('La respuesta no contiene la propiedad funcionarios:', response.data);
                return [];
            }
            
            // Mapear funcionarios para garantizar campos
            const funcionariosConId = response.data.funcionarios.map(funcionario => {
                const lineaTrabajo = {
                    id: funcionario.linea_trabajo,
                    nombre: funcionario.nombreLineaTrabajo || 'Sin línea asignada'
                };

                return {
                    ...funcionario,
                    id: funcionario._id || funcionario.id,
                    _id: funcionario._id || funcionario.id,
                    nombres: funcionario.nombres || '',
                    apellidos: funcionario.apellidos || '',
                    tipo_documento: funcionario.tipo_documento || '',
                    numero_documento: funcionario.numero_documento || '',
                    correo: funcionario.correo || '',
                    telefono: funcionario.telefono || '',
                    cargo: funcionario.cargo || 'Sin cargo asignado',
                    nombre_completo: `${funcionario.nombres || ''} ${funcionario.apellidos || ''}`.trim(),
                    lineaTrabajo,
                    nombreLineaTrabajo: lineaTrabajo.nombre
                };
            });
            
            console.log('Funcionarios procesados:', funcionariosConId);
            return funcionariosConId || [];
        } catch (error) {
            console.error('Error al obtener funcionarios:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message
            });
            return [];
        }
    },

    /**
     * Obtener un funcionario por su ID
     * @param {string} id ID del funcionario
     * @returns {Promise} Promesa con la información del funcionario
     */
    obtenerFuncionarioPorId: async (id) => {
        try {
            
            // Validar ID
            const funcionarioId = id.trim();
            
            if (!funcionarioId) {
              
                throw new Error('ID de funcionario no válido');
            }
            
            // Intentar con ambas rutas
            try {
                const response = await axiosInstance.get(`/funcionarios/${funcionarioId}`);
                
                // Verificar la estructura de la respuesta
                if (!response.data || !response.data.funcionario) {
                    throw new Error('Respuesta del servidor inválida');
                }
                
                // Asegurar que el funcionario tenga un ID
                const funcionarioConId = {
                    ...response.data.funcionario,
                    _id: response.data.funcionario._id || response.data.funcionario.id || funcionarioId,
                    id: response.data.funcionario._id || response.data.funcionario.id || funcionarioId
                };
                
              
                
                return funcionarioConId;
            } catch (errorPrimeraRuta) {
                
                const response = await axiosInstance.get(`/funcionarios/funcionarios/${funcionarioId}`);
                
                // Verificar la estructura de la respuesta
                if (!response.data || !response.data.funcionario) {
                    throw new Error('Respuesta del servidor inválida');
                }
                
                // Asegurar que el funcionario tenga un ID
                const funcionarioConId = {
                    ...response.data.funcionario,
                    _id: response.data.funcionario._id || response.data.funcionario.id || funcionarioId,
                    id: response.data.funcionario._id || response.data.funcionario.id || funcionarioId
                };
                
              
                
                return funcionarioConId;
            }
        } catch (error) {
            
            // Extraer detalles específicos del error
            const errorDetalles = error.response?.data?.detalles || {};
            const errorMensaje = error.response?.data?.msg || 'Error al obtener funcionario';
            
            // Formatear mensajes de error
            const errorFormateado = {
                mensaje: errorMensaje,
                detalles: errorDetalles,
                camposError: Object.keys(errorDetalles).map(campo => ({
                    campo,
                    mensajes: errorDetalles[campo]
                }))
            };
            
        
            
            // Lanzar error formateado para ser manejado por el componente
            throw errorFormateado;
        }
    },

    /**
     * Actualizar un funcionario
     * @param {string} id ID del funcionario
     * @param {Object} datos Datos a actualizar
     * @returns {Promise} Promesa con el funcionario actualizado
     */
    actualizarFuncionario: async (id, datos) => {
        try {
                    
            // URL de actualización
            const url = `/funcionarios/funcionarios/${id}`;
            
            const response = await axiosInstance.put(url, datos);
                      
            // Manejar la estructura de respuesta
            const funcionarioActualizado = response.data.funcionario || response.data;
            
           
            // Asegurar que el funcionario tenga un ID
            const funcionarioConId = {
                ...funcionarioActualizado,
                _id: funcionarioActualizado._id || funcionarioActualizado.id || id,
                id: funcionarioActualizado._id || funcionarioActualizado.id || id
            };
            
         
            
            return funcionarioConId;
        } catch (error) {
                       
            // Extraer detalles específicos del error
            const errorDetalles = error.response?.data?.detalles || {};
            const errorMensaje = error.response?.data?.msg || 'Error al actualizar funcionario';
            
            // Formatear mensajes de error
            const errorFormateado = {
                mensaje: errorMensaje,
                detalles: errorDetalles,
                camposError: Object.keys(errorDetalles).map(campo => ({
                    campo,
                    mensajes: errorDetalles[campo]
                }))
            };
            
            throw errorFormateado;
        }
    },

    /**
     * Eliminar un funcionario
     * @param {string} id ID del funcionario
     * @returns {Promise} Promesa que se resuelve cuando el funcionario es eliminado
     */
    eliminarFuncionario: async (id) => {
        try {
            
            if (!id || id === 'undefined') {
                throw new Error('ID de funcionario no válido');
            }
            
            const response = await axiosInstance.delete(`/funcionarios/funcionarios/${id}`);
                    
            return response.data;
        } catch (error) {
            console.error('Error COMPLETO al eliminar funcionario:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message
            });


        }
    }
};

export default funcionarioService;
