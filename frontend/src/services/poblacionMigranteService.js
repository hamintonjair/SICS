import axios from 'axios';
import { getToken, isTokenExpired } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        if (token && !isTokenExpired(token)) { // Verificar también si el token ha expirado
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export const crearPoblacionMigrante = async (datos) => {
    try {
        // Obtener información del usuario actual
        const userString = localStorage.getItem('user');
        if (!userString) {
            throw new Error('Debe iniciar sesión nuevamente');
        }

        const user = JSON.parse(userString);
        
        // Validaciones previas
        if (!user.linea_trabajo && !user.linea_trabajo_id) {
            throw new Error('Línea de trabajo no definida');
        }

        // Preparar datos completos para registro
        const datosCompletos = {
            funcionario_id: user.id || user._id,
            funcionario_nombre: user.nombre,
            fecha_registro: new Date().toISOString().slice(0, 19).replace('T', ' '),
            linea_trabajo: user.linea_trabajo || user.linea_trabajo_id,
            ...(Object.keys(datos).reduce((acc, key) => {
                if (datos[key] instanceof Date) {
                    acc[key] = datos[key].toISOString().slice(0, 10);
                } else {
                    acc[key] = datos[key];
                }
                return acc;
            }, {}))
        };
        // Limpiar y validar datos antes de enviar
        const camposNoPermitidos = [
            '_debug_user', 
            '_id', 
            'token', 
            'secretaría', 
            'rol', 
            'estado', 
            'email'
        ];

        const datosValidados = Object.keys(datosCompletos).reduce((acc, key) => {
            const valor = datosCompletos[key];
            if (valor !== null && valor !== undefined && valor !== '' && !camposNoPermitidos.includes(key)) {
                // Mapeo de campos específicos
                switch(key) {
                    case 'edad':
                        acc['edad'] = parseInt(valor, 10);
                        break;
                    case 'trabajoActual':
                        acc['trabajoActual'] = valor;
                        break;
                    // case 'tipoTrabajo':
                    //     acc['tipoTrabajo'] = valor;
                    //     break;
                    case 'workingStatus':
                        acc['workingStatus'] = valor;
                        break;
                    case 'workType':
                        acc['workType'] = valor;
                        break;
                    case 'healthSystem':
                        acc['healthSystem'] = valor;
                        break;
                    case 'healthSystemName':
                        acc['healthSystemName'] = valor;
                        break;
                    case 'sisbenStatus':
                        acc['sisbenStatus'] = valor;
                        break;
                    case 'situacion_migratoria':
                        acc['situacion_migratoria'] = valor;
                        break;
                    case 'telefono':
                        acc['telefono'] = valor;
                        break;
                    case 'supportRoute':
                        acc['supportRoute'] = valor;
                        break;
                    case 'permanentTreatment':
                        acc['permanentTreatment'] = valor;
                        break;
                    case 'treatmentDetails':
                        acc['treatmentDetails'] = valor;
                        break;
                    case 'disability':
                        acc['disability'] = valor;
                        break;
                    case 'disabilityType':
                        acc['disabilityType'] = valor;
                        break;
                    case 'disease':
                        acc['disease'] = valor;
                        break;
                    case 'diseaseDetails':
                        acc['diseaseDetails'] = valor;
                        break;
                    case 'victimOfViolence':
                        acc['victimOfViolence'] = valor;
                        break;
                    case 'armedConflictVictim':
                        acc['armedConflictVictim'] = valor;
                        break;
                    case 'conflictVictimType':
                        acc['conflictVictimType'] = valor;
                        break;
                    default:
                        // Manejar caso de "Sin documento"
                        if (key === 'numero_documento' && valor === 'Sin documento') {
                            acc[key] = 'SD-' + Date.now(); // Generar un ID único
                        } else {
                            acc[key] = valor;
                        }
                }

                // Conversiones específicas
                if (['tiene_ppt', 'victima_conflicto'].includes(key)) {
                    acc[key] = !!datosCompletos[key];
                }
            }
            return acc;
        }, {});

        // Lista DEFINITIVA de campos requeridos basada en PoblacionMigranteSchema (required=True)
        const camposRequeridos = [
            'funcionario_id',
            'funcionario_nombre',
            'linea_trabajo',
            'fecha_registro',
            'nombre_completo',
            'tipo_documento',
            'numero_documento',
            'pais_origen',
            'tiempoPermanenciaColombia', // camelCase
            'comunaResidencia', // camelCase
            'barrio', // snake_case
            'etnia', // snake_case
            'nivelEducativo', // camelCase
            'tamanoNucleoFamiliar', // camelCase
            'cantidadNinosAdolescentes' // camelCase
        ];

        // Validación frontend: Verificar que todos los campos requeridos están presentes y no son nulos/undefined/vacíos
        const camposFaltantes = camposRequeridos.filter(campo => 
            datosValidados[campo] === undefined || datosValidados[campo] === null || datosValidados[campo] === ''
        );

        if (camposFaltantes.length > 0) {
            console.error('Validación Frontend Fallida - Campos Faltantes:', camposFaltantes);
            throw new Error(`Campos requeridos faltantes en el frontend: ${camposFaltantes.join(', ')}`);
        }

        const response = await axiosInstance.post('/poblacion-migrante/registrar', datosValidados);
        return {
            data: {
                success: true,
                message: 'Registro creado exitosamente',
                ...response.data
            }
        };
    } catch (error) {
        console.error('Error al crear registro de población migrante:', error);
        throw error;
    }
};

export const listarPoblacionMigrante = async (
    pagina = 1, 
    porPagina = 10, 
    filtro = '',
    lineaTrabajo = null
) => {
    // Validaciones iniciales
    if (pagina < 1) {
        pagina = 1;
    }

    if (porPagina < 1 || porPagina > 100) {
        porPagina = 10;
    }

    try {
        // Obtener el usuario desde localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Priorizar la línea de trabajo del usuario
        const lineaTrabajoParam = user.linea_trabajo || 
            (lineaTrabajo && typeof lineaTrabajo === 'string' 
                ? lineaTrabajo.trim() 
                : (lineaTrabajo?._id || lineaTrabajo?.id));

        // Verificar si lineaTrabajoParam es un valor válido
        if (!lineaTrabajoParam) {
            throw new Error('Línea de trabajo no válida');
        }

        // Validar formato del ID de línea de trabajo (24 caracteres hexadecimales)
        if (!/^[0-9a-fA-F]{24}$/.test(lineaTrabajoParam)) {
            throw new Error('Formato de línea de trabajo inválido');
        }
        const response = await axiosInstance.get('/poblacion-migrante/listar', {
            params: {
                pagina,
                por_pagina: porPagina,
                filtro,
                linea_trabajo: lineaTrabajoParam
            },
            transformRequest: [(data, headers) => {
            
                return data;
            }]
        });

        return {
            data: response.data.poblacion_migrante || [],
            total: response.data.total || 0
        };
    } catch (error) {
        console.error('Detalles del error:', error.response?.data);
        
        throw error;
    }
};

export const obtenerPoblacionMigrantePorId = async (id) => {
    try {
        const response = await axiosInstance.get(`/poblacion-migrante/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener detalles de población migrante:', error);
        throw error;
    }
};

export const actualizarPoblacionMigrante = async (id, datos) => {
    try {
        const response = await axiosInstance.put(`/poblacion-migrante/${id}`, datos);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar población migrante:', error);
        throw error;
    }
};

export const eliminarPoblacionMigrante = async (id) => {
    try {
        const response = await axiosInstance.delete(`/poblacion-migrante/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar población migrante:', error);
        throw error;
    }
};

export const exportarPoblacionMigrante = async (filtros = {}) => {
    try {
        const response = await axiosInstance.get('/poblacion-migrante/exportar', {
            params: filtros,
            responseType: 'blob'
        });
        
        // Crear y descargar archivo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'poblacion_migrante.xlsx');
        document.body.appendChild(link);
        link.click();
        
        return true;
    } catch (error) {
        console.error('Error al exportar población migrante:', error);
        throw error;
    }
};

export const verificarDocumentoUnico = async (numeroDocumento) => {
    try {
        const response = await axiosInstance.get('/poblacion-migrante/verificar-documento', {
            params: { numero_documento: numeroDocumento }
        });
        return response.data.es_unico;
    } catch (error) {
        console.error('Error al verificar documento:', error);
        throw error;
    }
};
