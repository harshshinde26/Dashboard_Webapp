import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, loading, user, hasPermission } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    const getLoadingBackground = () => {
      const isDark = theme.palette.mode === 'dark';
      return isDark 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: getLoadingBackground(),
        }}
      >
        <CircularProgress 
          size={60} 
          sx={{ 
            color: theme.palette.mode === 'dark' ? '#4fc3f7' : 'white', 
            mb: 2 
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: theme.palette.mode === 'dark' ? '#e0e0e0' : 'white',
            fontWeight: 500 
          }}
        >
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have permission to access this page.
          <br />
          Required permission: <strong>{requiredPermission}</strong>
          <br />
          Your role: <strong>{user?.role}</strong>
        </Typography>
      </Box>
    );
  }

  // User is authenticated and has required permissions
  return children;
};

export default ProtectedRoute; 