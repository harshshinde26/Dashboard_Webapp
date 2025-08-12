import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Business as BusinessIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Brightness4 as Brightness4Icon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';

const Navbar = ({ onMenuClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const { settings, updateSetting, theme } = useAppTheme();
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    toast.success('Successfully logged out');
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleThemeToggle = () => {
    const currentTheme = settings.appearance.theme;
    let newTheme;
    
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'auto';
    } else {
      newTheme = 'light';
    }
    
    updateSetting('appearance', 'theme', newTheme);
    toast.success(`Theme switched to ${newTheme === 'auto' ? 'auto (system)' : newTheme}`);
  };

  const getThemeIcon = () => {
    const currentTheme = settings.appearance.theme;
    if (currentTheme === 'light') return <LightModeIcon />;
    if (currentTheme === 'dark') return <DarkModeIcon />;
    return <Brightness4Icon />;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'viewer': return 'info';
      default: return 'primary';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // Theme-aware background handled by MUI theme context
      }}
    >
      <Toolbar>
        <IconButton
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ 
            mr: 2,
            borderRadius: 2,
            color: theme.palette.text.primary,
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.1)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: 2,
          p: 1,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <BusinessIcon />
        </Box>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Batch Data Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* User Info */}
          {user && (
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              background: theme.palette.mode === 'light' 
                ? 'rgba(102, 126, 234, 0.08)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.mode === 'light' ? '#2d3748' : '#f7fafc',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  letterSpacing: '0.02em',
                }}
              >
                Welcome, {user.firstName}
              </Typography>
              <Chip
                label={user.role}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ 
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    color: 'RED'
                  }
                }}
              />
            </Box>
          )}

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${settings.appearance.theme === 'light' ? 'dark' : settings.appearance.theme === 'dark' ? 'auto' : 'light'} mode`}>
            <IconButton
              size="large"
              aria-label="toggle theme"
              onClick={handleThemeToggle}
              sx={{
                borderRadius: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {getThemeIcon()}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              aria-label="show notifications"
              onClick={handleNotificationsClick}
              sx={{
                borderRadius: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              <Badge 
                badgeContent={4} 
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    fontWeight: 600,
                    animation: 'pulse 2s infinite',
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              onClick={handleMenuOpen}
              sx={{
                borderRadius: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              {user ? (
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white', // Ensure text is always white for visibility
                    border: theme.palette.mode === 'light' 
                      ? '2px solid rgba(102, 126, 234, 0.2)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 4px 16px rgba(102, 126, 234, 0.3)'
                        : '0 4px 16px rgba(102, 126, 234, 0.4)',
                    }
                  }}
                >
                  {getInitials(user.firstName, user.lastName)}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1.5,
                minWidth: 280,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User Info */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={user?.role}
                  color={getRoleColor(user?.role)}
                  size="small"
                />
              </Box>
            </Box>
            
            <Divider />
            
            {/* Menu Items */}
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText>
                Profile
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText>
                Settings
              </ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText>
                Logout
              </ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 