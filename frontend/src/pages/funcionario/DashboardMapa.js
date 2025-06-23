import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import beneficiarioService from '../../services/beneficiarioService';
import MapaRegistros, { agruparPorComunaYBarrio } from '../../components/MapaRegistros';
import ComunasSidebar from '../../components/ComunasSidebar';
import { useAuth } from '../../context/AuthContext';

const ITEMS_PER_PAGE_OPTIONS = [20, 50, 100, 200];

const DashboardMapa = () => {
  const [registros, setRegistros] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    porPagina: ITEMS_PER_PAGE_OPTIONS[0],
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoizar la carga de registros para evitar recálculos innecesarios
  const cargarRegistros = useCallback(async () => {
    if (!user?.linea_trabajo) return;
    
    setLoading(true);
    try {
      const { pagina, porPagina } = paginacion;
      const data = await beneficiarioService.obtenerBeneficiarios({ 
        linea_trabajo: user.linea_trabajo, 
        por_pagina: porPagina,
        pagina: pagina
      });
      
      if (data) {
        // Verificar si la respuesta tiene el formato esperado
        const items = Array.isArray(data) ? data : 
                     Array.isArray(data?.beneficiarios) ? data.beneficiarios : [];
        
        setRegistros(items);
        setTotalRegistros(data.total || items.length);
      }
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError('Error al cargar registros. Intente de nuevo más tarde.');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [user, paginacion]);

  // Cargar datos cuando cambian los parámetros de paginación
  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  // Memoizar el cálculo de datos agrupados para evitar recálculos innecesarios
  const datosAgrupados = useMemo(() => {
    return agruparPorComunaYBarrio(registros);
  }, [registros]);

  const handleChangePage = (event, newPage) => {
    setPaginacion(prev => ({
      ...prev,
      pagina: newPage
    }));
  };

  const handleChangeItemsPerPage = (event) => {
    setPaginacion({
      pagina: 1, // Resetear a la primera página al cambiar el tamaño de página
      porPagina: event.target.value
    });
  };

  const totalPaginas = Math.ceil(totalRegistros / paginacion.porPagina);

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Mapa de beneficiarios registrados
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Registros por página</InputLabel>
            <Select
              value={paginacion.porPagina}
              label="Registros por página"
              onChange={handleChangeItemsPerPage}
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Pagination 
            count={totalPaginas} 
            page={paginacion.pagina} 
            onChange={handleChangePage}
            color="primary"
            size="small"
            disabled={loading}
          />
        </Box>
      </Box>

      {loading && registros.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, bgcolor: 'error.light', color: 'white', borderRadius: 1, mb: 2 }}>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            color="inherit" 
            onClick={cargarRegistros}
            sx={{ mt: 1 }}
          >
            Reintentar
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
              <ComunasSidebar 
                agrupadoPorComuna={datosAgrupados} 
                loading={loading && registros.length > 0}
              />
            </Grid>
            <Grid item xs={12} md={8} lg={9}>
              <Box sx={{ height: '70vh', minHeight: 500, position: 'relative' }}>
                <MapaRegistros registros={registros} loading={loading} />
              </Box>
            </Grid>
          </Grid>
          
          {totalPaginas > 1 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={totalPaginas} 
                page={paginacion.pagina} 
                onChange={handleChangePage}
                color="primary"
                showFirstButton 
                showLastButton
                disabled={loading}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default DashboardMapa;
