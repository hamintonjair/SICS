import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import MapaRegistrosPage from '../pages/admin/MapaRegistros';
import Funcionarios from '../pages/admin/Funcionarios';
import ListadoFuncionarios from '../pages/admin/ListadoFuncionarios';
import RegistroFuncionarios from '../pages/admin/RegistroFuncionarios';
import EditarFuncionario from '../pages/admin/EditarFuncionario';
import DetalleFuncionario from '../pages/admin/DetalleFuncionario';
import Beneficiarios from '../pages/admin/Beneficiarios';
import ListadoBeneficiarios from '../pages/admin/ListadoBeneficiarios';
import RegistroBeneficiarios from '../pages/admin/RegistroBeneficiarios';
import EditarBeneficiario from '../pages/admin/EditarBeneficiario';
import LineasTrabajo from '../pages/admin/LineasTrabajo';
import ListadoLineasTrabajo from '../pages/admin/ListadoLineasTrabajo';
import CrearLineaTrabajo from '../pages/admin/CrearLineaTrabajo';
import EditarLineaTrabajo from '../pages/admin/EditarLineaTrabajo';
import Perfil from '../pages/admin/Perfil';
import Comunas from '../pages/admin/Comunas';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="" element={<AdminLayout />}>
                    {/* Eliminar redirección automática a dashboard */}
                    {/* <Route index element={<Navigate to="dashboard" replace />} /> */}
                    
                    {/* Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />
                    {/* Mapa de registros */}
                    <Route path="mapa-registros" element={<MapaRegistrosPage />} />
                    
                    {/* Funcionarios */}
                    <Route path="funcionarios" element={<Funcionarios />}>
                        <Route index element={<ListadoFuncionarios />} />
                        <Route path="registro" element={<RegistroFuncionarios />} />
                        <Route path="editar/:id" element={<EditarFuncionario />} />
                        <Route path=":id" element={<DetalleFuncionario />} />
                    </Route>
                    
                    {/* Beneficiarios */}
                    <Route path="beneficiarios" element={<Beneficiarios />}>
                        <Route index element={<ListadoBeneficiarios />} />
                        <Route path="registro" element={<RegistroBeneficiarios />} />
                        <Route path="editar/:id" element={<EditarBeneficiario />} />
                    </Route>
                    
                    {/* Comunas */}
                    <Route path="comunas" element={<Comunas />} />
                    
                    {/* Líneas de Trabajo */}
                    <Route path="lineas-trabajo" element={<LineasTrabajo />}>
                        <Route index element={<ListadoLineasTrabajo />} />
                        <Route path="crear" element={<CrearLineaTrabajo />} />
                        <Route path="editar/:id" element={<EditarLineaTrabajo />} />
                    </Route>
                    
                    {/* Perfil */}
                    <Route path="perfil" element={<Perfil />} />
                    
                    {/* Ruta por defecto */}
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
