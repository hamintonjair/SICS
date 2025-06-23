import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import usuarioService from '../services/usuarioService';

const LineaTrabajoFiltro = ({ lineaSeleccionada, setLineaSeleccionada, incluirTodos = true, disabled = false }) => {
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    const cargarLineas = async () => {
      try {
        const data = await usuarioService.obtenerLineasTrabajo();
        setLineas(data);
      } catch (error) {
        setLineas([]);
      }
    };
    cargarLineas();
  }, []);

  return (
    <Box sx={{ minWidth: 200, mb: 2 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>Línea de Trabajo</InputLabel>
        <Select
          value={lineaSeleccionada || ''}
          label="Línea de Trabajo"
          onChange={e => setLineaSeleccionada(e.target.value)}
        >
          {incluirTodos && <MenuItem value="">Todas las líneas</MenuItem>}
          {lineas.map(linea => (
            <MenuItem key={linea._id || linea.id} value={linea._id || linea.id}>
              {linea.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LineaTrabajoFiltro;
