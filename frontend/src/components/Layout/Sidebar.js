import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Psychology as SmartIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Batch Performance',
    icon: <AssignmentIcon />,
    path: '/batch-performance',
  },
  {
    text: 'Volumetrics',
    icon: <BarChartIcon />,
    path: '/volumetrics',
  },
  {
    text: 'SLA Tracking',
    icon: <TimelineIcon />,
    path: '/sla-tracking',
  },
  {
    text: 'Batch Schedule',
    icon: <ScheduleIcon />,
    path: '/batch-schedule',
  },
  {
    text: 'Smart Predictor',
    icon: <SmartIcon />,
    path: '/smart-predictor',
  },
  {
    text: 'Client Inventory',
    icon: <InventoryIcon />,
    path: '/client-inventory',
  },
  {
    text: 'Customer Management',
    icon: <PeopleIcon />,
    path: '/customers',
  },
];

const Sidebar = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ color: 'white' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <Box sx={{ p: 2, color: 'white' }}>
          <Box sx={{ 
            textAlign: 'center', 
            fontSize: '0.75rem', 
            opacity: 0.8,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 1,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            🚀 Dashboard Analytics v1.0
          </Box>
          <Box sx={{ 
            textAlign: 'center', 
            fontSize: '0.7rem', 
            opacity: 0.6,
            mt: 1,
            fontStyle: 'italic'
          }}>
            Enterprise-grade analytics
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 