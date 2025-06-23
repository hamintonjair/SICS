import React from 'react';
import MapaRegistros from '../../components/MapaRegistros';
import beneficiarioService from '../../services/beneficiarioService';
import { Box, Typography, CircularProgress } from '@mui/material';

const MapaRegistrosPage = () => {
  const [registros, setRegistros] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const cargarRegistros = async () => {
      setLoading(true);
      try {
        const data = await beneficiarioService.obtenerBeneficiarios();
        if (Array.isArray(data)) {
          setRegistros(data);
        } else if (Array.isArray(data?.beneficiarios)) {
          setRegistros(data.beneficiarios);
        } else {
          setRegistros([]);
        }
      } catch (err) {
        setError('Error al cargar registros');
      } finally {
        setLoading(false);
      }
    };
    cargarRegistros();
  }, []);

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Mapa de registros de beneficiarios
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <MapaRegistros registros={registros} />
      )}
    </Box>
  );
};

export default MapaRegistrosPage;
