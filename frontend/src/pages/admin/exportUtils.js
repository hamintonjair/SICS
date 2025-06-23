// Utilidad para exportar datos y gráficas a Excel en una sola hoja
import * as XLSX from 'xlsx';

/**
 * Exporta datos y gráficas (como imágenes base64) a una sola hoja de Excel.
 * @param {Object[]} estadisticasTabulares - Array de objetos con los datos estadísticos.
 * @param {Array<{title: string, imageBase64: string}>} graficas - Título y base64 de cada gráfica.
 * @param {string} nombreArchivo - Nombre del archivo a descargar.
 */
export async function exportarDatosYGraficasAExcel({ estadisticasTabulares, nombreArchivo = 'estadisticas_de_beneficiarios.xlsx' }) {
    // 1. Crear hoja con datos tabulares
    const ws = XLSX.utils.json_to_sheet(estadisticasTabulares);

    // 2. Ajustar el ancho de las columnas automáticamente
    const cols = Object.keys(estadisticasTabulares[0] || {}).map(key => ({
        wch: Math.max(
            key.length,
            ...estadisticasTabulares.map(row => String(row[key] ?? '').length)
        ) + 4 // margen extra
    }));
    ws['!cols'] = cols;

    // 3. Crear libro y exportar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas de Habitantes');
    XLSX.writeFile(wb, nombreArchivo);
}
