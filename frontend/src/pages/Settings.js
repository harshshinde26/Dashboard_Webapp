import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { settings, updateSetting, resetSettings, formatDate, theme } = useTheme();
  const [previewDate] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSettingChange = (category, setting, value) => {
    updateSetting(category, setting, value);
    setHasUnsavedChanges(false); // Changes are auto-saved
    
    // Show immediate feedback for theme changes
    if (category === 'appearance' && setting === 'theme') {
      toast.success(`Theme changed to ${value === 'auto' ? 'auto (system)' : value}`);
    } else if (category === 'appearance' && setting === 'dateFormat') {
      toast.success(`Date format changed to ${value}`);
    }
  };

  const handleSaveSettings = () => {
    // Settings are automatically saved via context
    toast.success('All settings are automatically saved!');
  };

  const handleResetSettings = () => {
    resetSettings();
    toast.info('Settings reset to defaults');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Enhanced Title Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography className="page-title" variant="h1" gutterBottom>
          Application Settings
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Customize your dashboard experience
        </Typography>
        <Box sx={{ 
          width: 80, 
          height: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          mx: 'auto',
          mb: 3
        }} />
      </Box>

      <Grid container spacing={3}>
        {/* Notifications Settings */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <NotificationsIcon />
                </Box>
                <Typography className="section-title" variant="h6" sx={{ mb: 0, pl: 0, '&::before': { display: 'none' } }}>
                  Notifications
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.pushNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.batchAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'batchAlerts', e.target.checked)}
                    />
                  }
                  label="Batch Processing Alerts"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.systemMaintenance}
                      onChange={(e) => handleSettingChange('notifications', 'systemMaintenance', e.target.checked)}
                    />
                  }
                  label="System Maintenance Notices"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.weeklyReports}
                      onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                    />
                  }
                  label="Weekly Summary Reports"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PaletteIcon />
                </Box>
                <Typography className="section-title" variant="h6" sx={{ mb: 0, pl: 0, '&::before': { display: 'none' } }}>
                  Appearance
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    label="Theme"
                  >
                    <MenuItem value="light">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          border: '2px solid #667eea'
                        }} />
                        Light Mode
                      </Box>
                    </MenuItem>
                    <MenuItem value="dark">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
                          border: '2px solid #8fa5f4'
                        }} />
                        Dark Mode
                      </Box>
                    </MenuItem>
                    <MenuItem value="auto">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(90deg, #f5f7fa 50%, #0c0c0c 50%)',
                          border: '2px solid #764ba2'
                        }} />
                        Auto (System)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                {/* Theme Preview */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Theme: {settings.appearance.theme === 'auto' ? 'Auto (System)' : settings.appearance.theme}
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    p: 2,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)'
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                  }}>
                    <Chip 
                      label="Preview" 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.primary,
                      fontStyle: 'italic'
                    }}>
                      {theme.palette.mode === 'dark' ? '🌙 Dark theme active' : '☀️ Light theme active'}
                    </Typography>
                  </Box>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.appearance.language}
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
                
                                 <FormControl fullWidth>
                   <InputLabel>Date Format</InputLabel>
                   <Select
                     value={settings.appearance.dateFormat}
                     onChange={(e) => handleSettingChange('appearance', 'dateFormat', e.target.value)}
                     label="Date Format"
                   >
                     <MenuItem value="MM/DD/YYYY">
                       MM/DD/YYYY - {formatDate(previewDate)}
                     </MenuItem>
                     <MenuItem value="DD/MM/YYYY">
                       DD/MM/YYYY - {previewDate.toLocaleDateString('en-GB')}
                     </MenuItem>
                     <MenuItem value="YYYY-MM-DD">
                       YYYY-MM-DD - {previewDate.toISOString().split('T')[0]}
                     </MenuItem>
                   </Select>
                 </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.appearance.timezone}
                    onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
                    label="Timezone"
                  >
                    <MenuItem value="UTC-5">Eastern Time (UTC-5)</MenuItem>
                    <MenuItem value="UTC-6">Central Time (UTC-6)</MenuItem>
                    <MenuItem value="UTC-7">Mountain Time (UTC-7)</MenuItem>
                    <MenuItem value="UTC-8">Pacific Time (UTC-8)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Preferences */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Data Preferences
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.autoRefresh}
                      onChange={(e) => handleSettingChange('preferences', 'autoRefresh', e.target.checked)}
                    />
                  }
                  label="Auto-refresh Data"
                />
                
                <TextField
                  fullWidth
                  label="Refresh Interval (seconds)"
                  type="number"
                  value={settings.preferences.refreshInterval}
                  onChange={(e) => handleSettingChange('preferences', 'refreshInterval', parseInt(e.target.value))}
                  disabled={!settings.preferences.autoRefresh}
                  InputProps={{ inputProps: { min: 10, max: 300 } }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Default Page Size</InputLabel>
                  <Select
                    value={settings.preferences.pageSize}
                    onChange={(e) => handleSettingChange('preferences', 'pageSize', e.target.value)}
                    label="Default Page Size"
                  >
                    <MenuItem value={10}>10 items</MenuItem>
                    <MenuItem value={25}>25 items</MenuItem>
                    <MenuItem value={50}>50 items</MenuItem>
                    <MenuItem value={100}>100 items</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.showTooltips}
                      onChange={(e) => handleSettingChange('preferences', 'showTooltips', e.target.checked)}
                    />
                  }
                  label="Show Help Tooltips"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Security
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Some security settings may require administrator approval.
                </Alert>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
                
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 15, max: 480 } }}
                />
                
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Password Security
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Strong" color="success" size="small" />
                    <Chip label="Last changed 45 days ago" variant="outlined" size="small" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

             {/* Action Buttons */}
       <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
           <Box>
             <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
               Settings Management
             </Typography>
             <Typography variant="body2" color="textSecondary">
               Settings are automatically saved as you change them
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', gap: 2 }}>
             <Button
               variant="outlined"
               startIcon={<RefreshIcon />}
               onClick={handleResetSettings}
               color="warning"
             >
               Reset to Defaults
             </Button>
           </Box>
         </Box>
         
         {/* Current theme preview */}
         <Alert severity="info" sx={{ mt: 2 }}>
           <Typography variant="body2">
             <strong>Current Theme:</strong> {settings.appearance.theme === 'auto' ? 'Auto (follows system)' : settings.appearance.theme} • 
             <strong> Date Format:</strong> {formatDate(previewDate)} • 
             <strong> Timezone:</strong> {settings.appearance.timezone}
           </Typography>
         </Alert>
       </Paper>
    </Container>
  );
};

export default Settings; 