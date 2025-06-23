// Funciones de utilidad para manejo de autenticación

import { jwtDecode } from 'jwt-decode';

export const getToken = () => {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
};

export const setToken = (token) => {
    localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'authToken', token);
};

export const removeToken = () => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
};

export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return true;
        return decoded.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired(token);
};

const authUtils = {
    getToken,
    setToken,
    removeToken,
    isAuthenticated
};

export default authUtils;
