import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FuncionarioLayout from '../components/layout/FuncionarioLayout';
import Dashboard from '../pages/funcionario/Dashboard';
import Beneficiarios from '../pages/funcionario/Beneficiarios';
import ListadoBeneficiarios from '../pages/funcionario/ListadoBeneficiarios';
import EditarBeneficiario from '../pages/funcionario/EditarBeneficiario';
import Perfil from '../pages/funcionario/Perfil';
import RegistroPoblacionMigrante from '../pages/funcionario/RegistroPoblacionMigrante';
import RegistroBeneficiarios from '../pages/funcionario/RegistroBeneficiarios';
import ListadoPoblacionMigrante from '../pages/funcionario/ListadoPoblacionMigrante';
import Actividades from '../pages/funcionario/Actividades';
import NuevaActividad from '../pages/funcionario/NuevaActividad';
import NuevaReunion from '../pages/funcionario/NuevaReunion';
import DetalleActividad from '../pages/funcionario/DetalleActividad';
import Asistentes from '../pages/funcionario/Asistentes';

const FuncionarioRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<FuncionarioLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                
                {/* Dashboard */}
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Beneficiarios */}
                <Route path="beneficiarios" element={<Beneficiarios />}>
                    <Route index element={<ListadoBeneficiarios />} />
                    <Route path="editar/:id" element={<EditarBeneficiario />} />
                </Route>
                
                {/* Rutas de Registro */}
                <Route path="registro-poblacion" element={<RegistroBeneficiarios />} />
                <Route path="registro-migrantes" element={<RegistroPoblacionMigrante />} />
                
                {/* Población Migrante */}
                <Route path="poblacion-migrante" element={<ListadoPoblacionMigrante />} />
                <Route path="poblacion-migrante/registro" element={<RegistroPoblacionMigrante />} />
                <Route path="poblacion-migrante/editar/:id" element={<RegistroPoblacionMigrante />} />
                
                {/* Perfil */}
                <Route path="perfil" element={<Perfil />} />
                
                {/* Actividades */}
                <Route path="actividades" element={<Actividades />} />
                <Route path="actividades/nueva" element={<NuevaActividad />} />
                <Route path="actividades/reunion" element={<NuevaReunion />} />
                <Route path="actividades/editar/:id" element={<NuevaActividad />} />
                <Route path="actividades/editar-reunion/:id" element={<NuevaReunion />} />
                <Route path="actividades/reunion/:id" element={<DetalleActividad esReunion={true} />} />
                <Route path="actividades/:id" element={<DetalleActividad />} />
                
                {/* Asistentes */}
                <Route path="asistentes" element={<Asistentes />} />
                

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default FuncionarioRoutes;
