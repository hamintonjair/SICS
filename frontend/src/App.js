import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import AppRoutes from './routes';
import VerificacionPublica from './pages/verificacion/VerificacionPublica';
import useInactivity from './hooks/useInactivity';

// Componente wrapper para manejar la inactividad
const InactivityHandler = ({ children }) => {
    useInactivity(); // Usar el hook de inactividad
    return children;
};

function App() {
    return (
        <AuthProvider>
            <SnackbarProvider>
                <BrowserRouter>
                    <InactivityHandler>
                        <Routes>
                            <Route path="/verificar" element={<VerificacionPublica />} />
                            <Route path="/verificar/beneficiario/:documento" element={<VerificacionPublica />} />
                            <Route path="/*" element={<AppRoutes />} />
                        </Routes>
                    </InactivityHandler>
                </BrowserRouter>
            </SnackbarProvider>
        </AuthProvider>
    );
}

export default App;
