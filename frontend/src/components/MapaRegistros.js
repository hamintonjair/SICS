import React, { useMemo } from 'react';
// Mapa personalizado sobre imagen SVG de comunas de Quibdó

// Colores por comuna
export const COMUNA_COLORS = {
  'Comuna 1': '#e74c3c', // Rojo
  'Comuna 2': '#e67e22', // Naranja
  'Comuna 3': '#f1c40f', // Amarillo
  'Comuna 4': '#27ae60', // Verde
  'Comuna 5': '#2980b9', // Azul
  'Comuna 6': '#8e44ad', // Morado
  'Zonas Rurales': '#7f8c8d', // Gris
};

// Función para normalizar nombres de barrios (quitar espacios, convertir a minúsculas, etc.)
const normalizarNombreBarrio = (nombre) => {
  if (!nombre) return '';
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres especiales
};

// Agrupa los registros por comuna y barrio
export function agruparPorComunaYBarrio(registros) {
  const resultado = {};
  const nombresOriginales = {}; // Para mantener el nombre original del barrio
  
  registros.forEach(r => {
    if (!r.comuna) return; // Saltar registros sin comuna
    
    const comuna = r.comuna.trim();
    const barrioOriginal = r.barrio ? r.barrio.trim() : 'Sin barrio';
    const barrioKey = normalizarNombreBarrio(barrioOriginal);
    
    if (!resultado[comuna]) {
      resultado[comuna] = {};
      nombresOriginales[comuna] = {};
    }
    
    // Si es la primera vez que vemos este barrio, guardar el nombre original
    if (!nombresOriginales[comuna][barrioKey]) {
      nombresOriginales[comuna][barrioKey] = barrioOriginal;
    }
    
    // Usar el nombre normalizado para agrupar, pero mostrar el nombre original
    resultado[comuna][barrioKey] = (resultado[comuna][barrioKey] || 0) + 1;
  });
  
  // Reemplazar las claves normalizadas por los nombres originales
  const resultadoFinal = {};
  Object.keys(resultado).forEach(comuna => {
    resultadoFinal[comuna] = {};
    Object.keys(resultado[comuna]).forEach(barrioKey => {
      const nombreOriginal = nombresOriginales[comuna][barrioKey];
      resultadoFinal[comuna][nombreOriginal] = resultado[comuna][barrioKey];
    });
  });
  
  return resultadoFinal;
}

const MapaRegistros = ({ registros }) => {
  // Agrupar registros por barrio y coordenadas
  // Mostrar cada registro individual como un punto, sin agrupar
  const barriosMarcados = useMemo(() => {
    // Filtrar solo registros con coordenadas válidas
    return registros
      .filter(r => r.barrio_lat && r.barrio_lng) // Solo incluir registros con coordenadas
      .map(r => ({
        comuna: r.comuna,
        barrio: r.barrio,
        lat: r.barrio_lat,
        lng: r.barrio_lng,
      }));
  }, [registros]);

  // Conversión de lat/lng a coordenadas X/Y sobre la imagen SVG
  const latLngToXY = (lat, lng) => {
    // Estos valores deben coincidir con la proyección de tu SVG
    const minLat = 5.6800, maxLat = 5.7000;
    const minLng = -76.6820, maxLng = -76.6400;
    const width = 1200;
    const height = 900;
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  return (
    <div className="mapa-beneficiarios-print" style={{ position: 'relative', width: 1200, height: 900, margin: '0 auto', background: '#fff', border: '1px solid #ccc' }}>
      <img src="/fondo/comunas_quibdo.svg" alt="Mapa comunas Quibdó" style={{ width: 1200, height: 900, display: 'block' }} />
      {barriosMarcados.map((barrio, idx) => {
        const { x, y } = latLngToXY(barrio.lat, barrio.lng);
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: x - 8,
              top: y - 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: COMUNA_COLORS[barrio.comuna] || '#555',
              border: '2px solid #fff',
              boxShadow: '0 1px 4px #0006',
              zIndex: 2
            }}
            title={barrio.barrio + ' (' + barrio.comuna + ')'}
          />
        );
      })}
    </div>
  );
};

export default MapaRegistros;
