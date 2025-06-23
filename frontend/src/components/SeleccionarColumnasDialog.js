import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Typography,
    Divider
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

export const SeleccionarColumnasDialog = ({
    open,
    onClose,
    columnasDisponibles,
    columnasSeleccionadas,
    onAceptar,
    titulo = 'Seleccionar columnas para exportar',
    textoBotonAceptar = 'Aceptar',
    textoBotonCancelar = 'Cancelar'
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [seleccionadas, setSeleccionadas] = useState({});

    // Inicializar selección
    useEffect(() => {
        if (columnasDisponibles) {
            const inicial = {};
            columnasDisponibles.forEach(col => {
                inicial[col.campo] = columnasSeleccionadas
                    ? columnasSeleccionadas.includes(col.campo)
                    : col.visiblePorDefecto !== false;
            });
            setSeleccionadas(inicial);
        }
    }, [columnasDisponibles, columnasSeleccionadas]);

    const handleToggle = (campo) => (event) => {
        setSeleccionadas(prev => ({
            ...prev,
            [campo]: event.target.checked
        }));
    };

    const handleToggleTodas = (event) => {
        const todas = {};
        columnasDisponibles.forEach(col => {
            if (!busqueda || col.etiqueta.toLowerCase().includes(busqueda.toLowerCase())) {
                todas[col.campo] = event.target.checked;
            }
        });
        setSeleccionadas(prev => ({
            ...prev,
            ...todas
        }));
    };

    const handleAceptar = () => {
        const columnas = Object.entries(seleccionadas)
            .filter(([_, seleccionada]) => seleccionada)
            .map(([campo]) => campo);
        onAceptar(columnas);
        onClose();
    };

    const columnasFiltradas = columnasDisponibles?.filter(col => 
        col.etiqueta.toLowerCase().includes(busqueda.toLowerCase())
    ) || [];

    const todasSeleccionadas = columnasFiltradas.length > 0 && 
        columnasFiltradas.every(col => seleccionadas[col.campo]);
    const algunaSeleccionada = columnasFiltradas.some(col => seleccionadas[col.campo]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogContent dividers>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Buscar columnas..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: busqueda && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setBusqueda('')}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 2 }}
                />
                
                {columnasFiltradas.length > 0 ? (
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={todasSeleccionadas}
                                    indeterminate={!todasSeleccionadas && algunaSeleccionada}
                                    onChange={handleToggleTodas}
                                />
                            }
                            label={
                                <Typography variant="subtitle2">
                                    {todasSeleccionadas ? 'Desmarcar todas' : 'Marcar todas'}
                                </Typography>
                            }
                        />
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                            {columnasFiltradas.map((col) => (
                                <FormControlLabel
                                    key={col.campo}
                                    control={
                                        <Checkbox
                                            checked={!!seleccionadas[col.campo]}
                                            onChange={handleToggle(col.campo)}
                                        />
                                    }
                                    label={col.etiqueta}
                                    sx={{ 
                                        display: 'block',
                                        '& .MuiFormControlLabel-label': { 
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </FormGroup>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography color="textSecondary">
                            No se encontraron columnas que coincidan con la búsqueda
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    {textoBotonCancelar}
                </Button>
                <Button 
                    onClick={handleAceptar} 
                    color="primary" 
                    variant="contained"
                    disabled={!algunaSeleccionada}
                >
                    {textoBotonAceptar}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SeleccionarColumnasDialog;
