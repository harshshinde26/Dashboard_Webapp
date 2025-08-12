import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Authentication and Theme
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import BatchPerformance from './pages/BatchPerformance';
import Volumetrics from './pages/Volumetrics';
import SLATracking from './pages/SLATracking';
import BatchSchedule from './pages/BatchSchedule';
import SmartPredictor from './pages/SmartPredictor';
import ClientInventory from './pages/ClientInventory';
import CustomerManagement from './pages/CustomerManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function App() {
  return (
    <CustomThemeProvider>
      <ThemedApp />
    </CustomThemeProvider>
  );
}

function ThemedApp() {
  const { theme, toastConfig } = useTheme();
  
  // Apply theme data attribute to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.palette.mode);
  }, [theme.palette.mode]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Login Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={toastConfig.theme}
            toastStyle={toastConfig.toastStyle}
            progressStyle={toastConfig.progressStyle}
            style={{
              zIndex: 9999,
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Dashboard Layout Component (protected content)
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={handleSidebarToggle} />
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: 8,
          marginLeft: sidebarOpen ? 0 : '-240px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/batch-performance" element={<BatchPerformance />} />
          <Route path="/volumetrics" element={<Volumetrics />} />
          <Route path="/sla-tracking" element={<SLATracking />} />
          <Route path="/batch-schedule" element={<BatchSchedule />} />
          <Route path="/smart-predictor" element={<SmartPredictor />} />
          <Route path="/client-inventory" element={<ClientInventory />} />
          <Route path="/customers" element={
            <ProtectedRoute requiredPermission="write">
              <CustomerManagement />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App; 