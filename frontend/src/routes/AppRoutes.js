import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import PrivateRoute from '../components/PrivateRoute';
import FuncionarioRoutes from './FuncionarioRoutes';

// Importaciones de páginas de funcionario
const MigrantPopulationForm = lazy(() => import('../components/MigrantPopulationForm'));
const RegistroBeneficiarios = lazy(() => import('../pages/funcionario/RegistroBeneficiarios'));
const Login = lazy(() => import('../pages/Login'));
const VerificacionRegistro = lazy(() => import('../pages/VerificacionRegistro'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/verificar/:codigo" element={<VerificacionRegistro />} />
        
        {/* Rutas de funcionario (requieren autenticación) */}
        <Route path="/funcionario/*" element={<FuncionarioRoutes />} />
        
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
