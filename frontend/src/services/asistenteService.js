import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';

/**
 * Obtiene la lista completa de asistentes disponibles
 * @returns {Promise<Array>} - Lista de asistentes
 */
export const obtenerAsistentes = async () => {
  try {
    console.log('Solicitando asistentes a la API...');
    const response = await axiosInstance.get('/api/asistente');
    console.log('Respuesta de la API de asistentes:', response);
    
    // Verificar si la respuesta tiene datos
    if (!response.data) {
      console.warn('La respuesta de la API no contiene datos');
      return [];
    }
    
    // Manejar diferentes formatos de respuesta
    const asistentes = response.data.data || response.data.asistentes || response.data || [];
    console.log('Asistentes obtenidos:', asistentes);
    
    return asistentes;
  } catch (error) {
    console.error('Error al obtener los asistentes:', error);
    console.error('Detalles del error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    // Si hay un error, devolvemos un array vacío para evitar romper la UI
    return [];
  }
};

/**
 * Guarda los asistentes de una actividad
 * @param {string} actividadId - ID de la actividad
 * @param {Array} asistentes - Lista de asistentes a guardar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const guardarAsistentes = async (actividadId, asistentes) => {
  try {
    const response = await axiosInstance.post(
      `/actividades/${actividadId}/asistentes`,
      { asistentes }
    );
    return response.data;
  } catch (error) {
    console.error('Error al guardar los asistentes:', error);
    throw error;
  }
};

/**
 * Exporta los asistentes a Excel
 * @param {string} actividadId - ID de la actividad
 * @returns {Promise} - Respuesta con el archivo Excel
 */
export const exportarAsistentesExcel = async (actividadId) => {
  try {
    const response = await axiosInstance.get(
      `/actividades/${actividadId}/asistentes/exportar`,
      { responseType: 'blob' }
    );
    return response;
  } catch (error) {
    console.error('Error al exportar los asistentes:', error);
    throw error;
  }
};
