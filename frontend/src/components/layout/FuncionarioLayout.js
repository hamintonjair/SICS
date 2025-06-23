import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    CssBaseline, 
    Drawer, 
    AppBar, 
    Toolbar, 
    List, 
    Typography, 
    Divider, 
    IconButton, 
    ListItem, 
    ListItemIcon, 
    ListItemText,
    Avatar
} from '@mui/material';
import { 
    Menu as MenuIcon, 
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Event as EventIcon
    // Add as AddIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import fondoImg from '../../fondo/fondo.png';


const menuItems = [
    { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/funcionario/dashboard' 
    },
    { 
        text: 'Habitantes', 
        icon: <PeopleIcon />, 
        path: '/funcionario/beneficiarios',
        // hideForLineaTrabajoNombre: 'Población Migrante'
    },
    { 
        text: 'Asistentes', 
        icon: <PeopleIcon />, 
        path: '/funcionario/asistentes'
    },
    { 
        text: 'Migrantes', 
        icon: <PeopleIcon />, 
        path: '/funcionario/poblacion-migrante',
        // disabled: true,
        hideForLineaTrabajoNombre: [
            'Adulto mayor',
            'Población Religiosa',
            'Enlace Religioso',
            'Poblacion Religiosa', 
            'Colombia Mayor', 
            'Coordinación de Juventud',
            'Coordinacion de Juventud',
            'Renta Ciudadana', 
            'Enlace de Niñas, Niños y Adolecentes',
            'Habitantes Calles',
            'Poblacion con Discapacidad',
            'Población con Discapacidad',
            'Coordinación de Víctimas',
            'Coordinacion de Victimas'       ] 
    },
    { 
        text: 'Actividades', 
        icon: <EventIcon />, 
        path: '/funcionario/actividades' 
    },
    { 
        text: 'Perfil', 
        icon: <PersonIcon />, 
        path: '/funcionario/perfil' 
    }
];

const FuncionarioLayout = ({ children }) => {
    const [open, setOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const drawerRef = useRef(null);

    // Efecto para manejar el montaje/desmontaje seguro
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const filteredMenuItems = menuItems.filter(item => 
        !item.hideForLineaTrabajoNombre || 
        (Array.isArray(item.hideForLineaTrabajoNombre) 
            ? !item.hideForLineaTrabajoNombre.includes(user?.linea_trabajo_nombre)
            : item.hideForLineaTrabajoNombre !== user?.linea_trabajo_nombre)
    );

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleNavigation = (path) => {
        if (!mounted) return;
        navigate(path);
    };

    const handleLogout = () => {
        if (!mounted) return;
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                open={open}
                sx={{
                    backgroundImage: `url(${fondoImg})`,
                    backgroundSize: { xs: 'cover', md: '100% 100%' },
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    color: '#fff',
                    height: 90,
                    justifyContent: 'center',
                    transition: (theme) => theme.transitions.create(['margin-left', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    ml: { xs: 0, md: open ? '280px' : '57px' },
                    width: { xs: '100%', md: `calc(100% - ${open ? 280 : 57}px)` },
                }}
            >
                <Toolbar sx={{ minHeight: 90 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        edge="start"
                        sx={{
                            marginRight: 5,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, textShadow: '0 3px 12px #000, 0 1px 0 #000, 2px 2px 8px #000' }}>
                        Panel de Funcionario
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                            {user?.nombre?.charAt(0).toUpperCase()}
                        </Avatar>
                        <IconButton color="inherit" onClick={handleLogout} sx={{ backgroundColor: 'green', '&:hover': { backgroundColor: '#388e3c' } }}>
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer 
                variant="permanent" 
                open={open}
                ref={drawerRef}
                sx={{
                    width: open ? 280 : 57,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: open ? 280 : 57,
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                        position: 'fixed',
                        height: '100vh',
                        zIndex: theme => theme.zIndex.drawer + 1,
                    },
                }}
                ModalProps={{
                    keepMounted: true, // Mejora el rendimiento en móviles
                }}
            >
                <Toolbar>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <List component="nav">
                    {filteredMenuItems.map((item, index) => {
                        const isSelected = item.path === '/funcionario/beneficiarios' 
                            ? location.pathname === item.path 
                            : location.pathname.startsWith(item.path);
                            
                        return (
                            <ListItem 
                                button 
                                key={`${item.text}-${index}`}
                                onClick={() => !item.disabled && handleNavigation(item.path)}
                                selected={isSelected}
                                disabled={item.disabled}
                                sx={{
                                    opacity: item.disabled ? 0.6 : 1,
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.light',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: item.disabled ? 'text.disabled' : 'inherit' }}>
                                    {React.cloneElement(item.icon, { 
                                        color: item.disabled ? 'disabled' : isSelected ? 'primary' : 'inherit'
                                    })}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{
                                        color: item.disabled ? 'text.disabled' : 'inherit',
                                        variant: 'body2',
                                        noWrap: true
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>
            <Box 
                component="main" 
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    maxWidth: '100%',
                    ml: { xs: 0, md: open ? '240px' : '57px' },
                    margin: { xs: 0, md: '0 auto' },
                    p: { xs: 1, sm: 2, md: 4, lg: 6 },
                    mt: { xs: 12, md: 8 },
                    boxSizing: 'border-box',
                    transition: (theme) => theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default FuncionarioLayout;
