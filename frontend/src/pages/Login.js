import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Login as LoginIcon,
  Dashboard as DashboardIcon,
  Visibility,
  VisibilityOff,
  PersonAdd,
} from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer' // Default role
  });
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to dashboards' },
    { value: 'manager', label: 'Manager', description: 'Read/write access to data and reports' },
    { value: 'admin', label: 'Administrator', description: 'Full access to all features' }
  ];
  
  const { login, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(credentials.username, credentials.password);
      
      if (result.success) {
        const userType = result.user.isRealUser ? 'registered user' : 'demo account';
        toast.success(`Welcome ${result.user.firstName}! Logged in as ${userType}.`);
        navigate(from, { replace: true });
      } else {
        setErrors({ general: result.error });
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: 'Login failed. Please try again.' });
      toast.error('Login failed. Please try again.');
    }
  };

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateRegistrationForm = () => {
    const newErrors = {};
    
    if (!registrationData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (registrationData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!registrationData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!registrationData.password) {
      newErrors.password = 'Password is required';
    } else if (registrationData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (registrationData.password !== registrationData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!registrationData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!registrationData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate form
    const validationErrors = validateRegistrationForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting registration request:', registrationData);
      
      const response = await authAPI.register(registrationData);

      console.log('Registration response status:', response.status);
      const data = response.data;
      console.log('Registration response data:', data);

      if (response.status === 201 && data.message) {
        toast.success('Account request submitted successfully! An administrator will review your request and activate your account.');
        setRegistrationMode(false);
        setCredentials({
          username: '',
          password: ''
        });
        setRegistrationData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          firstName: '',
          lastName: '',
          role: 'viewer'
        });
      } else {
        // Handle API errors
        if (data.errors) {
          setErrors(data.errors);
          const errorMessages = Object.values(data.errors).join(', ');
          toast.error(`Registration failed: ${errorMessages}`);
        } else {
          toast.error(data.message || 'Account request submission failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle axios error responses
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.errors) {
          setErrors(errorData.errors);
          const errorMessages = Object.values(errorData.errors).join(', ');
          toast.error(`Registration failed: ${errorMessages}`);
        } else {
          toast.error(errorData.message || 'Account request submission failed. Please try again.');
        }
      } else {
        // If API is unavailable, show a helpful message
        toast.error('Account request submission is currently unavailable. Please try again later or contact an administrator.');
        setRegistrationMode(false);
      }
    }

    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Get theme-aware background
  const getBackgroundGradient = () => {
    const isDark = theme.palette.mode === 'dark';
    return isDark 
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: getBackgroundGradient(),
        padding: 2,
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        {/* Welcome Notice */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
            color: 'primary.contrastText',
            textAlign: 'center',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          }}
        >
          <Typography variant="h6" gutterBottom>
            🔐 Batch Data Analytics System
          </Typography>
          <Typography variant="body1">
            <strong>Secure access to your dashboard.</strong> Login with your credentials or request a new account.
          </Typography>
        </Paper>

        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {/* Login Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={12}
              sx={{
                p: 4,
                borderRadius: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(30, 30, 30, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Box
                component="form"
                onSubmit={registrationMode ? handleRegistration : handleLogin}
                noValidate
                sx={{ mt: 1 }}
              >
                <Typography 
                  component="h1" 
                  variant="h4" 
                  align="center" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <DashboardIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                  {registrationMode ? 'Request Account' : 'Batch Data Analytics'}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  align="center" 
                  sx={{ 
                    mb: 3,
                    color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.secondary'
                  }}
                >
                  {registrationMode 
                    ? 'Submit a request for a new account with specified permissions'
                    : 'Please Login to access the application'
                  }
                </Typography>

                {registrationMode ? (
                  // Registration Form
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>Account Request System</strong><br/>
                      Submit your account details below. An administrator will review and activate your account manually.
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={registrationData.firstName}
                          onChange={handleRegistrationChange}
                          error={!!errors.firstName}
                          helperText={errors.firstName}
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          value={registrationData.lastName}
                          onChange={handleRegistrationChange}
                          error={!!errors.lastName}
                          helperText={errors.lastName}
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Username"
                          name="username"
                          autoComplete="username"
                          value={registrationData.username}
                          onChange={handleRegistrationChange}
                          error={!!errors.username}
                          helperText={errors.username}
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Email Address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={registrationData.email}
                          onChange={handleRegistrationChange}
                          error={!!errors.email}
                          helperText={errors.email}
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>User Role</InputLabel>
                          <Select
                            name="role"
                            value={registrationData.role}
                            label="User Role"
                            onChange={handleRegistrationChange}
                          >
                            {roleOptions.map((role) => (
                              <MenuItem key={role.value} value={role.value}>
                                <Box>
                                  <Typography variant="body1">{role.label}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {role.description}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          value={registrationData.password}
                          onChange={handleRegistrationChange}
                          error={!!errors.password}
                          helperText={errors.password}
                          disabled={loading}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={togglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showPassword ? 'text' : 'password'}
                          value={registrationData.confirmPassword}
                          onChange={handleRegistrationChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          disabled={loading}
                        />
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  // Login Form
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={credentials.username}
                      onChange={handleInputChange}
                      error={!!errors.username}
                      helperText={errors.username}
                      disabled={loading}
                    />

                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : 
                    (registrationMode ? <PersonAdd /> : <LoginIcon />)}
                >
                  {loading 
                    ? (registrationMode ? 'Submitting Request...' : 'Signing In...')
                    : (registrationMode ? 'Submit Account Request' : 'Sign In')
                  }
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Chip 
                    label="OR" 
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                      color: 'text.primary'
                    }}
                  />
                </Divider>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    fullWidth
                    variant={registrationMode ? "contained" : "outlined"}
                    onClick={() => {
                      setRegistrationMode(!registrationMode);
                      setErrors({});
                    }}
                    startIcon={registrationMode ? <LoginIcon /> : <PersonAdd />}
                    color={registrationMode ? "primary" : "success"}
                  >
                    {registrationMode ? 'Back to Login' : 'Request New Account'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login; 