import React, { useState } from 'react';
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
    People as PeopleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    AssessmentOutlined as AssessmentOutlinedIcon,
    Work as WorkIcon,
    Logout as LogoutIcon,
    LocationCity as LocationCityIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import fondoImg from '../../fondo/fondo.png';

const menuItems = [
    { 
        text: 'Estadísticas', 
        icon: <AssessmentOutlinedIcon />, 
        path: '/admin/dashboard' 
    },
    { 
        text: 'Funcionarios', 
        icon: <PeopleIcon />, 
        path: '/admin/funcionarios' 
    },
    { 
        text: 'Habitantes', 
        icon: <GroupIcon />, 
        path: '/admin/beneficiarios' 
    },
    { 
        text: 'Líneas de Trabajo', 
        icon: <WorkIcon />, 
        path: '/admin/lineas-trabajo' 
    },
    { 
        text: 'Comunas', 
        icon: <LocationCityIcon />, 
        path: '/admin/comunas' 
    },
    { 
        text: 'Perfil', 
        icon: <PersonIcon />, 
        path: '/admin/perfil' 
    }
];

const AdminLayout = () => {
    const [open, setOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
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
                    ml: { xs: 0, md: open ? '240px' : '57px' },
                    width: { xs: '100%', md: `calc(100% - ${open ? 240 : 57}px)` },
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
                        Panel de Administración
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
                sx={{
                    width: open ? 240 : 57,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: open ? 240 : 57,
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                    },
                }}
            >
                <Toolbar>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <List>
                    {menuItems.map((item) => (
                        <ListItem 
                            button 
                            key={item.text}
                            onClick={() => handleNavigation(item.path)}
                            selected={location.pathname.startsWith(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box 
                component="main" 
                sx={{
                    flexGrow: 1,
                    width: '100vw',
                    maxWidth: '100vw',
                    overflowX: 'hidden',
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

export default AdminLayout;
