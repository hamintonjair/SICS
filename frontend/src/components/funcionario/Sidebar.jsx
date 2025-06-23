import React from 'react';
import { 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    Divider 
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    People as PeopleIcon, 
    Person as PersonIcon,
    Group as GroupIcon,
    Event as EventIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <List>
            <ListItem button component={Link} to="/funcionario/dashboard">
                <ListItemIcon>
                    <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
            </ListItem>

            <Divider />

            <ListItem button component={Link} to="/funcionario/beneficiarios">
                <ListItemIcon>
                    <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Beneficiarios" />
            </ListItem>

            <ListItem button component={Link} to="/funcionario/poblacion-migrante">
                <ListItemIcon>
                    <GroupIcon />
                </ListItemIcon>
                <ListItemText primary="Migrantes" />
            </ListItem>

            <ListItem button component={Link} to="/funcionario/actividades">
                <ListItemIcon>
                    <EventIcon />
                </ListItemIcon>
                <ListItemText primary="Actividades" />
            </ListItem>

            <Divider />

            <ListItem button component={Link} to="/funcionario/perfil">
                <ListItemIcon>
                    <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Perfil" />
            </ListItem>
        </List>
    );
};

export default Sidebar;
