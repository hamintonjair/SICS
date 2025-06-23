import React, { createContext, useState, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        variant: 'info'
    });

    const enqueueSnackbar = (message, { variant = 'info' } = {}) => {
        setSnackbarState({
            open: true,
            message,
            variant
        });
    };

    const closeSnackbar = () => {
        setSnackbarState(prev => ({ ...prev, open: false }));
    };

    return (
        <SnackbarContext.Provider value={{ enqueueSnackbar, closeSnackbar }}>
            {children}
            <Snackbar
                open={snackbarState.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={closeSnackbar} 
                    severity={snackbarState.variant} 
                    sx={{ width: '100%' }}
                >
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};
