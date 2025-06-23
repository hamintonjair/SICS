import React from 'react';
import { Box, Typography, List, ListItem, Chip } from '@mui/material';

// Colores por comuna
const COMUNA_COLORS = {
  'Comuna 1': '#e74c3c', // Rojo
  'Comuna 2': '#e67e22', // Naranja
  'Comuna 3': '#f1c40f', // Amarillo
  'Comuna 4': '#27ae60', // Verde
  'Comuna 5': '#2980b9', // Azul
  'Comuna 6': '#8e44ad', // Morado
  'Zonas Rurales': '#7f8c8d', // Gris
};

const ComunasSidebar = ({ agrupadoPorComuna }) => (
  <Box id="sidebar-comunas" sx={{ width: { xs: '100%', md: 320 }, p: 2, bgcolor: '#fafafa', borderRadius: 2, boxShadow: 2, height: { xs: 'auto', md: '128vh' }, overflowY: { xs: 'visible', md: 'auto' }, overflowX: 'auto' }}>
    <Typography variant="h6" gutterBottom>
      Beneficiarios por Comuna
    </Typography>
    <List>
      {Object.entries(agrupadoPorComuna)
  .sort(([a], [b]) => {
    // Ordenar Zonas Rurales al final
    if (a === 'Zonas Rurales') return 1;
    if (b === 'Zonas Rurales') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  })
  .map(([comuna, barrios]) => (
        <Box key={comuna} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: COMUNA_COLORS[comuna] }}>{comuna}</Typography>
          <List disablePadding>
            {Object.entries(barrios).map(([barrio, cantidad]) => (
              <ListItem key={barrio} sx={{ pl: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{barrio}</Typography>
                <Chip label={cantidad} size="small" sx={{ bgcolor: COMUNA_COLORS[comuna], color: '#fff', fontWeight: 'bold' }} />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </List>
  </Box>
);

export default ComunasSidebar;
