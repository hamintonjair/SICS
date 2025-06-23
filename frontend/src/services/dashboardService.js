import axiosInstance from '../utils/axiosConfig';

const dashboardService = {
    // Obtener estadísticas para gráficos
    obtenerEstadisticasGraficas: async () => {
        try {
            const response = await axiosInstance.get('/dashboard/estadisticas-graficas');
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    },

    // Exportar gráfico específico
    exportarGrafico: async (tipo) => {
        try {
            const response = await axiosInstance.get(`/dashboard/exportar-grafico/${tipo}`, {
                responseType: 'json'
            });

            // Descargar imagen
            if (response.data.imagen) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${response.data.imagen}`;
                link.download = `estadisticas_globales.png`;
                link.click();
            }

            // Descargar Excel
            if (response.data.datos_excel) {
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${response.data.datos_excel}`;
                link.download = `estadisticas_globales.xlsx`;
                link.click();
            }

            return response.data;
        } catch (error) {
            console.error(`Error al exportar estadísticas:`, error);
            
            // Manejar específicamente el error de dependencias faltantes
            if (error.response && error.response.status === 501) {
                const dependenciasFaltantes = error.response.data.dependencias_faltantes || {};
                const faltantes = Object.keys(dependenciasFaltantes)
                    .filter(dep => dependenciasFaltantes[dep])
                    .join(', ');
                
                error.dependenciasFaltantes = faltantes;
            }
            
            throw error;
        }
    }
};

export default dashboardService;
