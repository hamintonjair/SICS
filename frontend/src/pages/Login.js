import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';
import fondoImg from '../fondo/fondo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const isMounted = useRef(true);
  const navigateRef = useRef(navigate);

  // Efecto de limpieza al desmontar
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Actualizar referencia de navigate
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validación básica
    if (!email.trim() || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    // Resetear estados
    setError('');
    setIsLoading(true);

    try {
      // Ejecutar login
      const usuario = await login(email.trim(), password);
      
      // Verificar si el componente sigue montado
      if (!isMounted.current) return;
      
      // Navegar después del login exitoso
      const path = usuario.rol === 'admin' 
        ? '/admin/dashboard' 
        : '/funcionario/dashboard';
      
      // Usar replace para evitar que el usuario vuelva al login con el botón atrás
      navigateRef.current(path, { replace: true });
      
    } catch (err) {
      // Manejo de errores
      if (isMounted.current) {
        const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Error de inicio de sesión';
        
        setError(errorMessage);
        
        // Mostrar notificación de error
        enqueueSnackbar(errorMessage, { 
          variant: 'error',
          autoHideDuration: 5000,
          preventDuplicate: true,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          }
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Grid container component="main" sx={{ minHeight: '100vh', height: '100%' }}>
      <CssBaseline />

      {/* Lado izquierdo con imagen */}
      <Grid
        item xs={false} sm={4} md={7}
        sx={{
          backgroundImage: `url(${fondoImg})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'contain',
          backgroundPosition: 'left',
        }}
      />

      {/* Formulario de login */}
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          <Box 
            component="form" 
            noValidate 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 1, 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                {error}
              </Alert>
            )}
            <TextField
              disabled={isLoading}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <TextField
              disabled={isLoading}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              variant="outlined"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  boxShadow: 2,
                },
                maxWidth: '300px',
                alignSelf: 'center'
              }}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
