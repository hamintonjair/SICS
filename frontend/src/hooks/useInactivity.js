import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const useInactivity = (timeout = 30 * 60 * 1000) => { // 30 minutos por defecto
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let inactivityTimer;

        const resetTimer = () => {
            // Limpiar el temporizador existente
            clearTimeout(inactivityTimer);
            // Establecer un nuevo temporizador
            inactivityTimer = setTimeout(logoutAndRedirect, timeout);
        };

        const logoutAndRedirect = () => {
            logout();
            navigate('/login');
        };

        // Eventos que indican actividad del usuario
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        // Agregar listeners de eventos
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Iniciar el temporizador
        resetTimer();

        // Limpieza al desmontar el componente
        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeout, logout, navigate]);
};

export default useInactivity;
